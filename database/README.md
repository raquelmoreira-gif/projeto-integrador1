# Banco de Dados

Estrutura inicial do banco de dados do sistema de controle de caixa.

## Tabelas

### 🧾 caixa
Responsável por controlar a abertura e fechamento do caixa diário.

Campos principais:
- data: data do caixa
- valor_inicial: valor de troco inicial
- valor_final: valor ao fechar o caixa
- status: aberto ou fechado

---

### 💰 vendas
Registra as vendas realizadas no caixa.

Campos principais:
- caixa_id: referência ao caixa
- valor: valor da venda
- forma_pagamento: tipo de pagamento (pix, dinheiro, crédito)
- criado_em: data e hora da venda

---

## Observações
- Cada venda está vinculada a um caixa
- Um caixa pode ter várias vendas
- Estrutura em evolução conforme necessidades do sistema

---

### 📦 produtos
Armazena os produtos disponíveis para venda.

Campos principais:
- nome: nome do produto
- preco: valor de venda
- quantidade_estoque: quantidade disponível
- tipo: próprio ou consignado
