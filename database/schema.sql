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
