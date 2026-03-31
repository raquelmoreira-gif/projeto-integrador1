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
