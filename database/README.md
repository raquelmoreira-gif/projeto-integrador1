# Banco de Dados

Estrutura do banco de dados do sistema de controle de caixa.

## Tabelas

### 🧾 caixa
Responsável por controlar a abertura e fechamento do caixa diário.

Campos principais:
- data: data do caixa
- valor_inicial: valor de troco inicial
- valor_final: valor ao fechar o caixa
- status: indica se o caixa está 'aberto' ou 'fechado'

Regras:
- Apenas um caixa pode ser aberto por dia
- O status do caixa é limitado a 'aberto' ou 'fechado'

---

### 💰 vendas
Registra as vendas realizadas no caixa.

Campos principais:
- caixa_id: referência ao caixa
- valor: valor da venda
- forma_pagamento: tipo de pagamento (pix, dinheiro, crédito, débito)
- criado_em: data e hora da venda

---

### 📦 produtos
Armazena os produtos disponíveis para venda.

Campos principais:
- nome: nome do produto
- preco: valor de venda (não pode ser negativo)
- quantidade_estoque: quantidade disponível em estoque (não pode ser negativa)
- tipo: define se o produto é próprio ou consignado ('proprio' ou 'consignado')

Campos adicionais:
- tipo_repasse: define se o repasse é por 'porcentagem' ou 'fixo'
- porcentagem_repasse: percentual aplicado na venda (quando aplicável)
- valor_custo: valor fixo do produto para o artesão (quando aplicável)

Regras:
- Não permite valores negativos para preço e estoque
- O tipo do produto é limitado a valores válidos
- Produtos consignados podem utilizar apenas um tipo de repasse (porcentagem ou fixo)

---

### 🧩 vendas_itens
Relaciona produtos às vendas.

Campos principais:
- venda_id: referência à venda
- produto_id: referência ao produto
- quantidade: quantidade vendida
- preco_unitario: valor no momento da venda
- subtotal: valor total do item

Regras:
- Não permite valores negativos
- Quantidade deve ser maior que zero
- Um produto não pode ser repetido na mesma venda

---

### 🧑‍🎨 artesaos
Armazena os fornecedores de produtos consignados.

Campos principais:
- nome: nome do artesão
- telefone: contato
- email: contato

---

## Relacionamentos

- Cada venda está vinculada a um caixa
- Um caixa pode ter várias vendas
- Cada venda pode conter vários produtos (vendas_itens)
- Produtos consignados podem estar vinculados a um artesão através do campo `artesao_id`
