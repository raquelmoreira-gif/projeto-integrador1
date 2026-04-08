from flask import Flask, make_response, request

from app.routes.caixa import caixa_bp
from app.routes.health import health_bp
from app.routes.produtos import produtos_bp
from app.routes.relatorios import relatorios_bp
from app.routes.usuarios import usuarios_bp
from app.routes.vendas import vendas_bp


def create_app():
    app = Flask(__name__)

    @app.before_request
    def _cors_preflight():
        if request.method == "OPTIONS":
            r = make_response("", 204)
            r.headers["Access-Control-Allow-Origin"] = "*"
            r.headers["Access-Control-Allow-Methods"] = (
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            )
            r.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            r.headers["Access-Control-Max-Age"] = "86400"
            return r

    @app.after_request
    def _cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    # Registrar rotas
    app.register_blueprint(health_bp)
    app.register_blueprint(caixa_bp)
    app.register_blueprint(produtos_bp)
    app.register_blueprint(usuarios_bp)
    app.register_blueprint(vendas_bp)
    app.register_blueprint(relatorios_bp)

    print(app.url_map)

    return app
