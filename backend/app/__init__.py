from flask import Flask, jsonify
from app.routes.caixa import caixa_bp
from app.routes.health import health_bp
from app.routes.produtos import produtos_bp
from app.routes.relatorios import relatorios_bp
from app.routes.usuarios import usuarios_bp
from app.routes.vendas import vendas_bp

def create_app():
    app = Flask(__name__)

    # Registrar Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(caixa_bp)
    app.register_blueprint(produtos_bp)
    app.register_blueprint(usuarios_bp)
    app.register_blueprint(vendas_bp)
    app.register_blueprint(relatorios_bp)

    #Rotas raiz funcionando igual ao / health
    @app.route("/")
    def home():
        return jsonify ({"sucess": True, "data": "API online"}), 200

    return app
