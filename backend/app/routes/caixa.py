from datetime import datetime, timezone
from uuid import UUID

from flask import Blueprint, request

from app.services.responses import fail, ok
from app.services.supabase_client import get_supabase

caixa_bp = Blueprint("caixa", __name__, url_prefix="/api/caixa")


def _non_negative_number(value, field_label: str):
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None, f"{field_label} deve ser numerico"
    if n < 0:
        return None, f"{field_label} deve ser >= 0 (conforme restricao do banco)"
    return n, None


def _numeric(value, field_label: str):
    try:
        return float(value), None
    except (TypeError, ValueError):
        return None, f"{field_label} deve ser numerico"


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

    vi, err = _non_negative_number(valor_inicial, "valor_inicial")
    if err:
        return fail(err, 422)

    sb = get_supabase()
    
    # VERIFICA SE JÁ TEM UM CAIXA ABERTO
    caixa_aberto = (
        sb.table("caixa")
        .select("id")
        .eq("status", "aberto")
        .limit(1)
        .execute()
    )

    if caixa_aberto.data:
        return fail("Já existe um caixa aberto. Feche o atual antes de abrir outro.", 400)
    
    # ABRE O CAIXA    
    result = (
        sb.table("caixa")
        .insert({
            "data": data, 
            "valor_inicial": vi, 
            "status": "aberto"
        })
        .execute()
    )
    return ok(result.data, 201)


@caixa_bp.post("/<uuid:caixa_id>/fechar")
def fechar_caixa(caixa_id: UUID):
    body = request.get_json(silent=True) or {}
    valor_final = body.get("valor_final")

    if valor_final is None:
        return fail("Campo obrigatorio: valor_final", 422)

    vf, err = _numeric(valor_final, "valor_final")
    if err:
        return fail(err, 422)

    sb = get_supabase()
    fechado_em = datetime.now(timezone.utc).isoformat()
    result = (
        sb.table("caixa")
        .update(
            {
                "valor_final": vf,
                "status": "fechado",
                "fechado_em": fechado_em,
            }
        )
        .eq("id", str(caixa_id))
        .eq("status", "aberto")
        .execute()
    )
    if not result.data:
        return fail("Caixa nao encontrado ou ja fechado", 404)
    return ok(result.data[0])
