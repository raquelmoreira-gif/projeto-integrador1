from flask import Blueprint, request

from app.services.responses import fail, ok
from app.services.supabase_client import get_supabase

caixa_bp = Blueprint("caixa", __name__, url_prefix="/api/caixa")


@caixa_bp.get("")
def listar_caixas():
    sb = get_supabase()
    result = sb.table("caixa").select("*").order("data", desc=True).execute()
    return ok(result.data)


@caixa_bp.get("/aberto")
def caixa_aberto():
    sb = get_supabase()
    result = (
        sb.table("caixa")
        .select("*")
        .eq("status", "aberto")
        .order("data", desc=True)
        .limit(1)
        .execute()
    )
    return ok(result.data[0] if result.data else None)


@caixa_bp.post("/abrir")
def abrir_caixa():
    body = request.get_json(silent=True) or {}
    data = body.get("data")
    valor_inicial = body.get("valor_inicial")

    if data is None or valor_inicial is None:
        return fail("Campos obrigatorios: data e valor_inicial", 422)

    sb = get_supabase()
    result = (
        sb.table("caixa")
        .insert({"data": data, "valor_inicial": valor_inicial, "status": "aberto"})
        .execute()
    )
    return ok(result.data, 201)


@caixa_bp.post("/<int:caixa_id>/fechar")
def fechar_caixa(caixa_id: int):
    body = request.get_json(silent=True) or {}
    valor_final = body.get("valor_final")

    if valor_final is None:
        return fail("Campo obrigatorio: valor_final", 422)

    sb = get_supabase()
    result = (
        sb.table("caixa")
        .update({"valor_final": valor_final, "status": "fechado"})
        .eq("id", caixa_id)
        .eq("status", "aberto")
        .execute()
    )
    if not result.data:
        return fail("Caixa nao encontrado ou ja fechado", 404)
    return ok(result.data[0])
