from flask import Blueprint

from app.services.responses import ok

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    return ok({"status": "online"})
