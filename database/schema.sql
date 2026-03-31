-- TABELA: caixa
-- controla abertura e fechamento diário

CREATE TABLE caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data DATE NOT NULL,
  valor_inicial NUMERIC(10,2) NOT NULL,
  valor_final NUMERIC(10,2),
  aberto_em TIMESTAMP DEFAULT NOW(),
  fechado_em TIMESTAMP,
  status TEXT DEFAULT 'aberto'
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
