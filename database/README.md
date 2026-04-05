### 🗄️ Banco de Dados

Estrutura do banco de dados do sistema de controle de caixa e estoque da aplicação.

O banco foi modelado com foco em integridade dos dados, automação de processos e consistência das operações, utilizando PostgreSQL via Supabase.

---

### 📊 Visão Geral

O sistema permite:

- Abertura e fechamento de caixa
- Registro de vendas com múltiplos itens
- Controle automático de estoque
- Gestão de produtos próprios e consignados
- Registro de movimentações de estoque
- Geração de relatórios de vendas

---

### 🧾 Tabelas

#### 🧾 caixa

Responsável por controlar a abertura e fechamento do caixa diário.

Campos principais:
- data
- valor_inicial
- valor_final
- status

Regras:
- Apenas um caixa pode ser aberto por dia
- Apenas um caixa pode estar aberto por vez
- Não é possível fechar o caixa sem informar valor final e data de fechamento
- Controle de consistência garantido por constraint no banco

---

#### 👤 usuarios

Controla o acesso ao sistema.

Campos principais:
- nome
- email (único)
- senha
- tipo ('admin' ou 'suporte')

Regras:
- Email único
- Controle de acesso por perfil

---

#### 💰 vendas

Registra as vendas realizadas no caixa.

Campos principais:
- caixa_id
- usuario_id
- valor_total
- forma_pagamento ('dinheiro', 'pix', 'credito', 'debito')
- status ('pendente', 'paga', 'cancelada')
- criado_em

Regras:
- Cada venda pertence a um caixa
- Toda venda deve estar vinculada a um usuário
- O valor total não pode ser negativo
- Vendas possuem controle de status

---

#### 🧩 vendas_itens

Relaciona produtos às vendas.

Campos principais:
- venda_id
- produto_id
- quantidade
- preco_unitario
- subtotal

Regras:
- Não permite valores negativos
- Um produto não pode ser repetido na mesma venda
- Integridade garantida por chave única (venda + produto)

Automação de estoque:
- Validação automática antes da venda
- Baixa automática ao inserir item
- Devolução automática ao remover item
- Ajuste automático ao editar item

---

#### 📦 produtos

Armazena os produtos disponíveis para venda.

Campos principais:
- nome
- preco
- quantidade_estoque
- tipo ('proprio' ou 'consignado')

Campos adicionais:
- artesao_id
- tipo_repasse ('porcentagem' ou 'fixo')
- porcentagem_repasse
- valor_custo

Regras:
- Não permite valores negativos
- Produtos consignados possuem regras de repasse
- Produtos próprios não utilizam repasse

---

#### 🧑‍🎨 artesaos

Armazena os fornecedores de produtos consignados.

Campos principais:
- nome
- telefone
- email

---

#### 📦 movimentacoes_estoque

Registra entradas e saídas de produtos.

Campos principais:
- produto_id
- tipo ('entrada', 'saida')
- quantidade
- motivo
- criado_em

Regras:
- Apenas registra histórico (não altera diretamente o estoque)
- Quantidade sempre positiva

---

### 🔗 Relacionamentos

- Um caixa possui várias vendas
- Uma venda pertence a um usuário
- Uma venda possui vários itens
- Um item pertence a um produto
- Produtos podem ter movimentações de estoque
- Produtos consignados podem estar vinculados a artesãos

---

### ⚙️ Regras de Negócio Implementadas no Banco

O sistema utiliza constraints e triggers para garantir integridade:

- Validação de estoque antes da venda
- Baixa automática de estoque
- Devolução automática ao remover itens
- Atualização automática ao editar itens
- Controle de consistência do caixa

---

### 📊 Relatórios

Os relatórios do sistema foram estruturados como views no banco de dados.

#### 💰 Relatório de Caixa
View: relatorio_caixa

- Total vendido
- Quantidade de vendas
- Totais por forma de pagamento

---

#### 🛍️ Relatórios de Vendas

Produtos mais vendidos  
View: relatorio_vendas_produto

- Quantidade vendida por produto
- Faturamento por produto

Vendas por dia  
View: relatorio_vendas_dia

- Total vendido por data
- Quantidade de vendas por dia

---

#### 📦 Relatórios de Estoque

Estoque atual  
View: relatorio_estoque

- Lista de produtos e quantidades disponíveis

Estoque baixo  
View: relatorio_estoque_baixo

- Produtos com quantidade crítica (<= 2)

---

#### 🎨 Relatório de Consignado

View: relatorio_consignado

- Total vendido por artesão
- Faturamento por produto consignado

---

### 🧠 Arquitetura dos Relatórios

Os relatórios foram implementados diretamente no banco de dados utilizando views, garantindo:

- Padronização das consultas
- Melhor desempenho
- Reutilização no sistema
- Independência da camada de aplicação

---

### 🚀 Tecnologias

- PostgreSQL
- Supabase

---

### 🧠 Considerações Técnicas

O banco foi projetado para:

- Reduzir dependência da aplicação
- Garantir consistência dos dados
- Automatizar processos críticos
- Facilitar geração de relatórios

A lógica de negócio principal foi implementada diretamente no banco de dados, aumentando a confiabilidade do sistema.
