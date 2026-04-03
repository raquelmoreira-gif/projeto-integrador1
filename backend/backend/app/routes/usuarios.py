from flask import Blueprint, request

from app.services.responses import fail, ok
from app.services.supabase_client import get_supabase

usuarios_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")


@usuarios_bp.get("")
def listar_usuarios():
    sb = get_supabase()
    result = sb.table("usuarios").select("id,nome,email,tipo").order("nome").execute()
    return ok(result.data)


@usuarios_bp.post("")
def criar_usuario():
    body = request.get_json(silent=True) or {}
    required = ["nome", "email", "senha", "tipo"]
    missing = [field for field in required if body.get(field) is None]
    if missing:
        return fail(f"Campos obrigatorios ausentes: {', '.join(missing)}", 422)

    if body.get("tipo") not in ["admin", "suporte"]:
        return fail("Tipo deve ser 'admin' ou 'suporte'", 422)

    sb = get_supabase()
    result = sb.table("usuarios").insert(body).execute()
    return ok(result.data, 201)
