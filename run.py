import os
from app import create_app

app = create_app()

# ROTA PRINCIPAL (cartão de visita da API)
@app.route("/")
def home():
    return {
        "status": "online",
        "api": "Projeto Integrador",
        "versao": "1.0",
        "rotas": [
            "/health",
            "/teste",
            "/api/produtos",
            "/api/usuarios",
            "/api/vendas"
        ]
    }

# ROTA DE TESTE
@app.route("/teste")
def teste():
    return {
        "status": "sucesso",
        "mensagem": "API funcionando perfeitamente",
        "servidor": "Render"
    }

# TRATAMENTO DE ERROS (PROFISSIONAL)
@app.errorhandler(404)
def not_found(e):
    return {
        "status": "erro",
        "mensagem": "Rota não encontrada"
    }, 404

@app.errorhandler(500)
def internal_error(e):
    return {
        "status": "erro",
        "mensagem": "Erro interno no servidor"
    }, 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
