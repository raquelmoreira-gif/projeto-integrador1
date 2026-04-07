from uuid import UUID

from flask import Blueprint, request

from app.services.responses import fail, ok
from app.services.supabase_client import get_supabase

produtos_bp = Blueprint("produtos", __name__, url_prefix="/api/produtos")


@produtos_bp.get("/")
def listar_produtos():
    try:
        supabase = get_supabase()
        response = supabase.table("produtos").select("*").execute()
        return ok(response.data)
    except Exception as e:
        return fail(str(e))


@produtos_bp.post("")
def criar_produto():
    body = request.get_json(silent=True) or {}
    required = ["nome", "preco", "quantidade_estoque", "tipo"]
    missing = [field for field in required if body.get(field) is None]
    if missing:
        return fail(f"Campos obrigatorios ausentes: {', '.join(missing)}", 422)

    sb = get_supabase()
    result = sb.table("produtos").insert(body).execute()
    return ok(result.data, 201)


@produtos_bp.patch("/<uuid:produto_id>")
def atualizar_produto(produto_id: UUID):
    body = request.get_json(silent=True) or {}
    if not body:
        return fail("Nenhum dado para atualizar", 422)

    sb = get_supabase()
    result = sb.table("produtos").update(body).eq("id", str(produto_id)).execute()
    if not result.data:
        return fail("Produto nao encontrado", 404)
    return ok(result.data[0])


@produtos_bp.post("/<uuid:produto_id>/movimentar")
def movimentar_estoque(produto_id: UUID):
    body = request.get_json(silent=True) or {}
    tipo = body.get("tipo")
    quantidade = body.get("quantidade")
    motivo = body.get("motivo", "ajuste_manual")

    if tipo not in ["entrada", "saida"]:
        return fail("Campo tipo deve ser 'entrada' ou 'saida'", 422)
    if quantidade is None or quantidade <= 0:
        return fail("Campo quantidade deve ser maior que zero", 422)

    sb = get_supabase()
    result = (
        sb.table("movimentacoes_estoque")
        .insert(
            {
                "produto_id": str(produto_id),
                "tipo": tipo,
                "quantidade": quantidade,
                "motivo": motivo,
            }
        )
        .execute()
    )
    return ok(result.data, 201)
