-- TABELA: caixa
-- controla abertura e fechamento diário

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
-- impede mais de um caixa no mesmo dia
CREATE UNIQUE INDEX unique_caixa_data 
ON caixa (data);

-- impede fechar caixa sem valor_final
ALTER TABLE caixa
ADD CONSTRAINT chk_caixa_fechamento
CHECK (
  (status = 'aberto' AND valor_final IS NULL)
  OR
  (status = 'fechado' AND valor_final IS NOT NULL)
);
-----------------------------------------------------
-- TABELA: vendas
-- registra cada venda realizada no caixa

CREATE TABLE vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id UUID NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  forma_pagamento TEXT NOT NULL, -- pix, dinheiro, credito
  criado_em TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_caixa
    FOREIGN KEY (caixa_id)
    REFERENCES caixa(id)
    ON DELETE CASCADE
);
------------------------------------------------------
-- TABELA: produtos
-- armazena os produtos disponíveis para venda

CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL, 
  preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
  quantidade_estoque INTEGER DEFAULT 0 CHECK (quantidade_estoque >= 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('proprio', 'consignado')),
  criado_em TIMESTAMP DEFAULT NOW()
);
-----------------------------------------------------------
-- TABELA: artesaos
-- armazena os fornecedores de produtos consignados

CREATE TABLE artesaos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,  
  telefone TEXT, 
  email TEXT, 
  criado_em TIMESTAMP DEFAULT NOW()
);
------------------------------------------------------------
-- RELAÇÃO: produtos → artesaos
ALTER TABLE produtos
ADD COLUMN artesao_id UUID;

ALTER TABLE produtos
ADD CONSTRAINT fk_artesao
FOREIGN KEY (artesao_id)
REFERENCES artesaos(id);
----------------------------------------------------------
-- TABELA: vendas_itens
-- registra os produtos dentro de cada venda

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
-- evita produto repetido na mesma venda
CREATE UNIQUE INDEX unique_venda_produto 
ON vendas_itens (venda_id, produto_id);
------------------------------------------
-- ALTERAÇÃO: produtos (repasse consignado)

ALTER TABLE produtos
ADD COLUMN tipo_repasse TEXT CHECK (tipo_repasse IN ('porcentagem', 'fixo'));
ALTER TABLE produtos
ADD COLUMN porcentagem_repasse NUMERIC(5,2);
ALTER TABLE produtos
ADD COLUMN valor_custo NUMERIC(10,2);

-- isso garante nunca usar os dois ao mesmo tempo e evita erro no sistema
ALTER TABLE produtos
ADD CONSTRAINT chk_repasse
CHECK (
  (tipo_repasse = 'porcentagem' AND porcentagem_repasse IS NOT NULL AND valor_custo IS NULL)
  OR
  (tipo_repasse = 'fixo' AND valor_custo IS NOT NULL AND porcentagem_repasse IS NULL)
  OR
  (tipo_repasse IS NULL)
);
