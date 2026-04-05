-- =========================================
-- EXTENSÕES
-- =========================================
create extension if not exists "pgcrypto";

-- =========================================
-- TABELA: caixa
-- =========================================
create table caixa (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  valor_inicial numeric(10,2) not null check (valor_inicial >= 0),
  valor_final numeric(10,2),
  aberto_em timestamp default now(),
  fechado_em timestamp,
  status text not null default 'aberto'
    check (status in ('aberto', 'fechado'))
);

create unique index unique_caixa_data on caixa (data);
create unique index unique_caixa_aberto on caixa (status) where status = 'aberto';

alter table caixa
add constraint chk_caixa_fechamento
check (
  (status = 'aberto' and valor_final is null and fechado_em is null)
  or
  (status = 'fechado' and valor_final is not null and fechado_em is not null)
);

-- =========================================
-- TABELA: usuarios
-- =========================================
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text unique not null,
  senha text not null,
  tipo text not null check (tipo in ('admin', 'suporte')),
  criado_em timestamp default now()
);

-- =========================================
-- TABELA: artesaos
-- =========================================
create table artesaos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  criado_em timestamp default now()
);

-- =========================================
-- TABELA: produtos
-- =========================================
create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  preco numeric(10,2) not null check (preco >= 0),
  quantidade_estoque integer default 0 check (quantidade_estoque >= 0),
  tipo text not null check (tipo in ('proprio', 'consignado')),
  artesao_id uuid,
  tipo_repasse text check (tipo_repasse in ('porcentagem', 'fixo')),
  porcentagem_repasse numeric(5,2),
  valor_custo numeric(10,2),
  criado_em timestamp default now(),

  constraint fk_artesao
    foreign key (artesao_id)
    references artesaos(id),

  constraint chk_repasse
  check (
    (tipo_repasse = 'porcentagem' and porcentagem_repasse is not null and valor_custo is null)
    or
    (tipo_repasse = 'fixo' and valor_custo is not null and porcentagem_repasse is null)
    or
    (tipo_repasse is null)
  ),

  constraint chk_repasse_tipo
  check (
    tipo = 'consignado' or tipo_repasse is null
  )
);

-- =========================================
-- TABELA: vendas
-- =========================================
create table vendas (
  id uuid primary key default gen_random_uuid(),
  caixa_id uuid not null,
  usuario_id uuid not null,
  valor_total numeric(10,2) not null check (valor_total >= 0),
  forma_pagamento text not null check (forma_pagamento in ('dinheiro','pix','debito', 'credito')),
  status text not null default 'pendente'
    check (status in ('pendente','paga','cancelada')),
  criado_em timestamp default now(),

  constraint fk_caixa
    foreign key (caixa_id)
    references caixa(id)
    on delete cascade,

  constraint fk_usuario_venda
    foreign key (usuario_id)
    references usuarios(id)
);

create index idx_vendas_caixa on vendas(caixa_id);
create index idx_vendas_status on vendas(status);

-- =========================================
-- TABELA: vendas_itens
-- =========================================
create table vendas_itens (
  id uuid primary key default gen_random_uuid(),
  venda_id uuid not null,
  produto_id uuid not null,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10,2) not null check (preco_unitario >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  criado_em timestamp default now(),

  constraint fk_venda
    foreign key (venda_id)
    references vendas(id)
    on delete cascade,

  constraint fk_produto
    foreign key (produto_id)
    references produtos(id),

  constraint unique_venda_produto 
    unique (venda_id, produto_id)
);

create index idx_itens_venda on vendas_itens(venda_id);

-- =========================================
-- TABELA: movimentacoes_estoque
-- =========================================
create table movimentacoes_estoque (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  quantidade integer not null check (quantidade > 0),
  motivo text,
  criado_em timestamp default now(),

  constraint fk_produto_movimentacao
    foreign key (produto_id)
    references produtos(id)
    on delete cascade
);

-- =========================================
-- TRIGGERS: CONTROLE DE ESTOQUE
-- =========================================

-- valida estoque
create or replace function validar_estoque()
returns trigger as $$
declare
  estoque_atual integer;
begin
  select quantidade_estoque into estoque_atual
  from produtos
  where id = new.produto_id;

  if estoque_atual is null then
    raise exception 'Produto não encontrado';
  end if;

  if estoque_atual < new.quantidade then
    raise exception 'Estoque insuficiente';
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trigger_validar_estoque
before insert on vendas_itens
for each row
execute function validar_estoque();

-- baixa estoque
create or replace function baixar_estoque()
returns trigger as $$
begin
  update produtos
  set quantidade_estoque = quantidade_estoque - new.quantidade
  where id = new.produto_id;

  return new;
end;
$$ language plpgsql;

create trigger trigger_baixar_estoque
after insert on vendas_itens
for each row
execute function baixar_estoque();

-- devolve estoque
create or replace function devolver_estoque()
returns trigger as $$
begin
  update produtos
  set quantidade_estoque = quantidade_estoque + old.quantidade
  where id = old.produto_id;

  return old;
end;
$$ language plpgsql;

create trigger trigger_devolver_estoque
after delete on vendas_itens
for each row
execute function devolver_estoque();

-- atualiza estoque
create or replace function atualizar_estoque()
returns trigger as $$
declare
  estoque_atual integer;
begin
  update produtos
  set quantidade_estoque = quantidade_estoque + old.quantidade
  where id = old.produto_id;

  select quantidade_estoque into estoque_atual
  from produtos
  where id = new.produto_id;

  if estoque_atual < new.quantidade then
    raise exception 'Estoque insuficiente para atualização';
  end if;

  update produtos
  set quantidade_estoque = quantidade_estoque - new.quantidade
  where id = new.produto_id;

  return new;
end;
$$ language plpgsql;

create trigger trigger_atualizar_estoque
before update on vendas_itens
for each row
execute function atualizar_estoque();

-- =========================================
-- VIEWS: RELATÓRIOS
-- =========================================

-- 💰 RELATÓRIO DE CAIXA
create or replace view relatorio_caixa as
select
  c.id as caixa_id,
  c.data,
  coalesce(sum(v.valor_total), 0) as total_vendido,
  count(distinct v.id) as quantidade_vendas,
  coalesce(sum(case when v.forma_pagamento = 'dinheiro' then v.valor_total else 0 end), 0) as total_dinheiro,
  coalesce(sum(case when v.forma_pagamento = 'pix' then v.valor_total else 0 end), 0) as total_pix,
  coalesce(sum(case when v.forma_pagamento in ('credito','debito') then v.valor_total else 0 end), 0) as total_cartao
from caixa c
left join vendas v 
  on v.caixa_id = c.id and v.status = 'paga'
group by c.id, c.data;

--------------------------------------------------------

-- 🛍️ PRODUTOS MAIS VENDIDOS
create or replace view relatorio_vendas_produto as
select
  p.id,
  p.nome,
  sum(vi.quantidade) as total_vendido,
  sum(vi.subtotal) as faturamento
from vendas_itens vi
join produtos p on p.id = vi.produto_id
join vendas v on v.id = vi.venda_id
where v.status = 'paga'
group by p.id, p.nome;

--------------------------------------------------------

-- 📅 VENDAS POR DIA
create or replace view relatorio_vendas_dia as
select
  date(v.criado_em) as data,
  count(v.id) as quantidade_vendas,
  sum(v.valor_total) as total_vendido
from vendas v
where v.status = 'paga'
group by date(v.criado_em);

--------------------------------------------------------

-- 📦 ESTOQUE ATUAL
create or replace view relatorio_estoque as
select
  id,
  nome,
  quantidade_estoque
from produtos;

--------------------------------------------------------

-- ⚠️ ESTOQUE BAIXO
create or replace view relatorio_estoque_baixo as
select *
from produtos
where quantidade_estoque <= 2;

--------------------------------------------------------

-- 🎨 CONSIGNADO POR ARTESÃO
create or replace view relatorio_consignado as
select
  a.nome as artesao,
  p.nome as produto,
  sum(vi.quantidade) as vendido,
  sum(vi.subtotal) as faturamento
from vendas_itens vi
join produtos p on p.id = vi.produto_id
join artesaos a on a.id = p.artesao_id
join vendas v on v.id = vi.venda_id
where v.status = 'paga'
  and p.tipo = 'consignado'
group by a.nome, p.nome;
