-- =========================================
-- TABELA: caixa
-- =========================================
CREATE TABLE caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  valor_inicial NUMERIC(10,2) NOT NULL,
  valor_final NUMERIC(10,2),
  aberto_em TIMESTAMP DEFAULT NOW(),
  fechado_em TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'aberto'
    CHECK (status IN ('aberto', 'fechado'))
);

CREATE UNIQUE INDEX unique_caixa_data ON caixa (data);
CREATE UNIQUE INDEX unique_caixa_aberto ON caixa (status) WHERE status = 'aberto';

ALTER TABLE caixa
ADD CONSTRAINT chk_caixa_fechamento
CHECK (
  (status = 'aberto' AND valor_final IS NULL)
  OR
  (status = 'fechado' AND valor_final IS NOT NULL)
);

--------------------------------------------------------

-- =========================================
-- TABELA: usuarios
-- =========================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('admin', 'suporte')),
  criado_em TIMESTAMP DEFAULT NOW()
);

--------------------------------------------------------

-- =========================================
-- TABELA: vendas
-- =========================================
CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id UUID NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'paga', 'cancelada')),
  criado_em TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_caixa
    FOREIGN KEY (caixa_id)
    REFERENCES caixa(id)
    ON DELETE CASCADE
);

--------------------------------------------------------

-- =========================================
-- TABELA: produtos
-- =========================================
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  quantidade_estoque INTEGER DEFAULT 0 CHECK (quantidade_estoque >= 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('proprio', 'consignado')),
  criado_em TIMESTAMP DEFAULT NOW()
);

--------------------------------------------------------

-- =========================================
-- TABELA: artesaos
-- =========================================
CREATE TABLE artesaos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  criado_em TIMESTAMP DEFAULT NOW()
);

ALTER TABLE produtos
ADD COLUMN artesao_id UUID;

ALTER TABLE produtos
ADD CONSTRAINT fk_artesao
FOREIGN KEY (artesao_id)
REFERENCES artesaos(id);

--------------------------------------------------------

-- =========================================
-- TABELA: vendas_itens
-- =========================================
CREATE TABLE vendas_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL,
  produto_id UUID NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL CHECK (preco_unitario >= 0),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  criado_em TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_venda
    FOREIGN KEY (venda_id)
    REFERENCES vendas(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_produto
    FOREIGN KEY (produto_id)
    REFERENCES produtos(id)
);

CREATE UNIQUE INDEX unique_venda_produto 
ON vendas_itens (venda_id, produto_id);

--------------------------------------------------------

-- =========================================
-- ALTERAÇÕES: repasse consignado
-- =========================================
ALTER TABLE produtos
ADD COLUMN tipo_repasse TEXT CHECK (tipo_repasse IN ('porcentagem', 'fixo'));

ALTER TABLE produtos
ADD COLUMN porcentagem_repasse NUMERIC(5,2);

ALTER TABLE produtos
ADD COLUMN valor_custo NUMERIC(10,2);

ALTER TABLE produtos
ADD CONSTRAINT chk_repasse
CHECK (
  (tipo_repasse = 'porcentagem' AND porcentagem_repasse IS NOT NULL AND valor_custo IS NULL)
  OR
  (tipo_repasse = 'fixo' AND valor_custo IS NOT NULL AND porcentagem_repasse IS NULL)
  OR
  (tipo_repasse IS NULL)
);

ALTER TABLE produtos
ADD CONSTRAINT chk_repasse_tipo
CHECK (
  tipo = 'consignado' OR tipo_repasse IS NULL
);

--------------------------------------------------------

-- =========================================
-- TABELA: movimentacoes_estoque
-- =========================================
CREATE TABLE movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  motivo TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_produto_movimentacao
    FOREIGN KEY (produto_id)
    REFERENCES produtos(id)
    ON DELETE CASCADE
);

--------------------------------------------------------

-- =========================================
-- TRIGGERS: CONTROLE DE ESTOQUE
-- =========================================

-- valida estoque
CREATE OR REPLACE FUNCTION validar_estoque()
RETURNS TRIGGER AS $$
DECLARE
  estoque_atual INTEGER;
BEGIN
  SELECT quantidade_estoque INTO estoque_atual
  FROM produtos
  WHERE id = NEW.produto_id;

  IF estoque_atual IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

  IF estoque_atual < NEW.quantidade THEN
    RAISE EXCEPTION 'Estoque insuficiente';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_estoque
BEFORE INSERT ON vendas_itens
FOR EACH ROW
EXECUTE FUNCTION validar_estoque();

--------------------------------------------------------

-- baixa estoque
CREATE OR REPLACE FUNCTION baixar_estoque()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE produtos
  SET quantidade_estoque = quantidade_estoque - NEW.quantidade
  WHERE id = NEW.produto_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_baixar_estoque
AFTER INSERT ON vendas_itens
FOR EACH ROW
EXECUTE FUNCTION baixar_estoque();

--------------------------------------------------------

-- devolve estoque
CREATE OR REPLACE FUNCTION devolver_estoque()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE produtos
  SET quantidade_estoque = quantidade_estoque + OLD.quantidade
  WHERE id = OLD.produto_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_devolver_estoque
AFTER DELETE ON vendas_itens
FOR EACH ROW
EXECUTE FUNCTION devolver_estoque();

--------------------------------------------------------

-- atualiza estoque (UPDATE)
CREATE OR REPLACE FUNCTION atualizar_estoque()
RETURNS TRIGGER AS $$
DECLARE
  estoque_atual INTEGER;
BEGIN
  UPDATE produtos
  SET quantidade_estoque = quantidade_estoque + OLD.quantidade
  WHERE id = OLD.produto_id;

  SELECT quantidade_estoque INTO estoque_atual
  FROM produtos
  WHERE id = NEW.produto_id;

  IF estoque_atual IS NULL THEN
    RAISE EXCEPTION 'Produto não encontrado';
  END IF;

  IF estoque_atual < NEW.quantidade THEN
    RAISE EXCEPTION 'Estoque insuficiente para atualização';
  END IF;

  UPDATE produtos
  SET quantidade_estoque = quantidade_estoque - NEW.quantidade
  WHERE id = NEW.produto_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_estoque
BEFORE UPDATE ON vendas_itens
FOR EACH ROW
EXECUTE FUNCTION atualizar_estoque();
