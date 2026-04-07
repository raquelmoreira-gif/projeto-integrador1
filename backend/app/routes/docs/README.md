Backend — Sistema de Controle de Caixa e Estoque. 

Este projeto implementa o backend do sistema de controle de caixa e estoque da aplicação, utilizando Python, Flask e Supabase (PostgreSQL). 

O backend centraliza a lógica da aplicação, garantindo integridade dos dados, automação de processos e consistência das operações. 

 
📊 Visão Geral do Banco de Dados 

O backend utiliza Supabase (PostgreSQL) para armazenar dados de caixas, vendas, produtos, movimentações de estoque e usuários. 

Principais funcionalidades: 

    Abertura e fechamento de caixas  

    Registro de vendas com múltiplos itens  

    Controle automático de estoque  

    Gestão de produtos próprios e consignados  

    Registro de movimentações de estoque  

    Geração de relatórios detalhados  


🧾 Tabelas Principais 

    Caixa — controla abertura e fechamento diário, com valor inicial e final, status 'aberto' ou 'fechado'. 

    Usuários — gerencia o acesso ao sistema, com campos nome, email (único), senha e tipo ('admin' ou 'suporte'). 

    Vendas — registra vendas com valor total, forma de pagamento e status ('pendente', 'paga', 'cancelada'). 

    Vendas_itens — relaciona produtos à venda. 

    Um produto não pode aparecer duplicado na mesma venda — use a coluna quantidade para múltiplas unidades. 

    Produtos — armazena produtos, com campos de preço, estoque e tipo ('proprio' ou 'consignado'). 

    Artesãos — fornecedores de produtos consignados. 

    Movimentacoes_estoque — histórico de entradas e saídas de produtos. 


🔗 Relacionamentos 

    Um caixa possui várias vendas. 

    Uma venda pertence a um usuário.  

    Uma venda possui vários itens. 

    Um item pertence a um produto. 

    Produtos podem ter movimentações de estoque. 

    Produtos consignados podem estar vinculados a artesãos.  

 
📋 Regras de Negócio Implementadas 

    Controle de estoque automático: baixa ao vender, devolução ao remover item, ajuste ao editar. 

    Um produto não pode ser repetido na mesma venda. 

    Validação de estoque antes de criar vendas. 

    Apenas um caixa pode estar aberto por vez. 

    Produtos consignados possuem regras de repasse para artesãos. 

    Estrutura preparada para múltiplas formas de pagamento. 

 
📑 Relatórios 

Os relatórios foram implementados via views no Supabase, permitindo consultas rápidas e reutilizáveis. 

💰 Relatório de Caixa: 

View: relatorio_caixa 

    Total vendido  

    Quantidade de vendas  

    Totais por forma de pagamento  

 
🛍️ Relatórios de Vendas: 

Produtos mais vendidos — relatorio_vendas_produto 

    Quantidade vendida por produto  

    Faturamento por produto  

Vendas por dia — relatorio_vendas_dia 

    Total vendido por data  

    Quantidade de vendas por dia  


📦 Relatórios de Estoque: 

Estoque atual — relatorio_estoque 

    Lista de produtos e quantidades disponíveis  

Estoque baixo — relatorio_estoque_baixo 

    Produtos com quantidade crítica (<= 2) 

  
🎨 Relatório de Consignado: 

View: relatorio_consignado 

    Total vendido por artesão  

    Faturamento por produto consignado  

 
📋 Endpoints Principais 

    /health — verifica se a API está online. 

    /api/produtos — gerencia produtos e estoque.  

    /api/usuarios — gerencia usuários. 

    /api/caixa — controle de abertura e fechamento de caixas.  

    /api/vendas — registra vendas e itens. 

    /api/relatorios — fornece dados das views de relatórios. 

Para cada endpoint, use fetch, Axios ou outro cliente HTTP para consumir os dados. 


🧠 Considerações Técnicas 

    Lógica de negócio principal implementada no banco via constraints e triggers. 

    Automatização de processos críticos (estoque, caixa).  

    Garantia de integridade e consistência dos dados. 

    Backend pronto para integração com frontend ou consumo direto via Supabase. 