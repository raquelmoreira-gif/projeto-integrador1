import bcrypt
from flask import Blueprint, request

from app.services.responses import fail, ok
from app.services.supabase_client import get_supabase

usuarios_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")


def _hash_senha(senha: str) -> str:
    """Gera o hash bcrypt de uma senha em texto puro."""
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verificar_senha(senha: str, hash_salvo: str) -> bool:
    """Compara a senha digitada com o hash armazenado no banco."""
    try:
        return bcrypt.checkpw(senha.encode("utf-8"), hash_salvo.encode("utf-8"))
    except Exception:
        return False


@usuarios_bp.get("")
def listar_usuarios():
    sb = get_supabase()
    # Nunca retorna o campo senha — nem hash, nem texto puro
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

    # Aplica o hash antes de salvar — a senha em texto puro nunca toca o banco
    payload = {
        "nome":  body["nome"],
        "email": body["email"],
        "senha": _hash_senha(body["senha"]),
        "tipo":  body["tipo"],
    }

    sb = get_supabase()
    result = sb.table("usuarios").insert(payload).execute()
    return ok(result.data, 201)


@usuarios_bp.post("/login")
def login_usuario():
    body = request.get_json(silent=True) or {}
    email = body.get("email", "").strip()
    senha = body.get("senha", "")

    if not email or not senha:
        return fail("E-mail e senha são obrigatórios", 422)

    sb = get_supabase()

    # Busca pelo e-mail e traz o hash para comparar — sem expor via resposta
    result = (
        sb.table("usuarios")
        .select("id,nome,tipo,senha")
        .eq("email", email)
        .limit(1)
        .execute()
    )

    if not result.data:
        # Mensagem genérica para não revelar se o e-mail existe
        return fail("E-mail ou senha incorretos", 401)

    usuario = result.data[0]
    hash_salvo = usuario.get("senha", "")

    # Detecta senhas antigas em texto puro (migração gradual)
    # Um hash bcrypt sempre começa com "$2b$" ou "$2a$"
    if hash_salvo.startswith("$2"):
        autenticado = _verificar_senha(senha, hash_salvo)
    else:
        # Senha ainda em texto puro: compara diretamente e já migra para hash
        autenticado = (senha == hash_salvo)
        if autenticado:
            novo_hash = _hash_senha(senha)
            sb.table("usuarios").update({"senha": novo_hash}).eq("id", usuario["id"]).execute()

    if not autenticado:
        return fail("E-mail ou senha incorretos", 401)

    # Retorna apenas os dados necessários — nunca o hash
    return ok({"id": usuario["id"], "nome": usuario["nome"], "tipo": usuario["tipo"]})
