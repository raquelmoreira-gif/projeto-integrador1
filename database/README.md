# Database
Esta pasta contém os arquivos relacionados ao banco de dados do projeto.
O banco de dados utilizado será o PostgreSQL hospedado no Supabase.
Aqui serão armazenados os scripts SQL e demais arquivos necessários para a criação e manutenção da estrutura do banco.
A definição das tabelas e relacionamentos ainda está em fase de planejamento e será desenvolvida conforme o levantamento de requisitos do sistema.
O objetivo do banco de dados é armazenar as informações necessárias para o funcionamento do sistema, como registros de vendas, produtos e demais dados da operação da loja.

## Banco de Dados

Tabela: caixa

Responsável por controlar abertura e fechamento do caixa diário.

Campos:
- valor_inicial: valor de troco inicial
- valor_final: valor ao fechar o caixa
- status: aberto ou fechado
