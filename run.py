import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from flask import send_from_directory
from app import create_app

app = create_app()

# ── Serve o frontend ─────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/<path:path>")
def static_files(path):
    full = os.path.join(FRONTEND_DIR, path)
    if os.path.isfile(full):
        return send_from_directory(FRONTEND_DIR, path)
    # Fallback: qualquer rota desconhecida devolve o index (navegação SPA)
    return send_from_directory(FRONTEND_DIR, "index.html")

# ── Erros ─────────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return {"status": "erro", "mensagem": "Rota não encontrada"}, 404

@app.errorhandler(500)
def internal_error(e):
    return {"status": "erro", "mensagem": "Erro interno no servidor"}, 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
