# 💰 Sistema de Controle de Caixa

Projeto Integrador — UNIVESP

---

## 📌 Sobre o Projeto

Este projeto tem como objetivo o desenvolvimento de um sistema web para controle de caixa voltado a microempreendedoras, permitindo a organização de vendas, produtos e fluxo financeiro de forma simples e eficiente.

A proposta surge a partir da necessidade real de digitalizar o controle manual utilizado atualmente, reduzindo erros, otimizando tempo e auxiliando na tomada de decisão.

> ⚠️ **Aviso:** Este é um projeto acadêmico em desenvolvimento ativo. O sistema não está aberto para cadastro público — o acesso é restrito à equipe do projeto e à cliente atendida.
---


## 🎯 Funcionalidades

- ✅ Abertura e fechamento de caixa diário
- ✅ Registro de vendas com múltiplos itens
- ✅ Controle automático de estoque
- ✅ Gestão de produtos próprios e consignados
- ✅ Relatórios financeiros (caixa, vendas, estoque, consignado)
- ✅ Controle de acesso por perfil (admin / suporte)
- ✅ Cálculo automático de troco
- ✅ Alertas de estoque baixo


## 🛠️ Tecnologias Utilizadas


| Camada | Tecnologia |
|---|---|
| ## Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| ## Backend | Python 3.11, Flask |
| ## Banco de Dados | PostgreSQL via Supabase |
| ## Hospedagem | Render (backend) | GitHub Pages (frontend)
| ## Segurança | bcrypt (hash de senhas) |


---

## 🏗️ Estrutura do Projeto

```
projeto-integrador1/
│
├── backend/
│   └── app/
│       ├── routes/       # Endpoints da API (caixa, vendas, produtos, usuários, relatórios)
│       ├── services/     # Supabase client e helpers de resposta
│       └── config.py     # Configuração via variáveis de ambiente
│
├── frontend/
│   ├── pages/            # Telas do sistema
│   ├── css/              # Estilos
│   └── js/               # Scripts e integração com API
│
├── database/
│   ├── schema.sql        # Estrutura completa do banco (tabelas, triggers, views)
│   └── README.md         # Documentação do banco de dados
│
├── docs/                 # Documentação do projeto
├── run.py                # Entry point da aplicação
├── Procfile              # Configuração para deploy no Render
└── requirements.txt      # Dependências Python
```

---

## 🚧 Status do Projeto

**Projeto Integrador I — concluído** ✅
 
Funcionalidades implementadas e integradas. Melhorias de segurança e arquitetura planejadas para a próxima etapa.

---

## 🔗 Integração

O sistema depende da comunicação entre frontend, backend e banco de dados.

Nesta fase, podem ocorrer:

* Funcionalidades incompletas
* Dados não persistidos corretamente
* Ajustes em rotas e integrações

---


## 👩‍💻 Equipe

Projeto desenvolvido por alunas do curso de Engenharia da Computação, Ciência de Dadose Bacharelado em Tecnologia da Informação — UNIVESP.

* Camila Nascimento dos Santos
* Evelyn dos Santos Rofino
* Gabriela Naomi Espindola Sato
* Giovanna Clara Paes
* Marina Sousa Maida
* Raquel Moreira Ferreira
* Tamara da Costa e Silva

---

## 📄 Observações

Este projeto está em constante evolução e pode sofrer alterações conforme o avanço do desenvolvimento.



## 📄 Licença
 
Este projeto foi desenvolvido para fins acadêmicos. Todos os direitos reservados à equipe e à UNIVESP.

