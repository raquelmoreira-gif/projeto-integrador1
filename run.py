import os
from app import create_app

app = create_app()

@app.route("/")
def home():
    return {"msg": "API rodando"}

@app.route("/teste")
def teste():
    return {"msg": "FUNCIONOU"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
