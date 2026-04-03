from flask import Blueprint, request

from app.services.responses import fail, ok
from app.services.supabase_client import get_supabase

vendas_bp = Blueprint("vendas", __name__, url_prefix="/api/vendas")


@vendas_bp.get("")
def listar_vendas():
    sb = get_supabase()
    result = (
        sb.table("vendas")
        .select("*, vendas_itens(*)")
        .order("criado_em", desc=True)
        .execute()
    )
    return ok(result.data)


@vendas_bp.post("")
def criar_venda():
    body = request.get_json(silent=True) or {}
    required = ["caixa_id", "usuario_id", "forma_pagamento", "itens"]
    missing = [field for field in required if body.get(field) is None]
    if missing:
        return fail(f"Campos obrigatorios ausentes: {', '.join(missing)}", 422)

    itens = body.get("itens", [])
    if not itens:
        return fail("A venda precisa ter ao menos 1 item", 422)

    valor_total = sum(item.get("subtotal", 0) for item in itens)
    if valor_total <= 0:
        return fail("Valor total da venda deve ser maior que zero", 422)

    sb = get_supabase()
    venda_result = (
        sb.table("vendas")
        .insert(
            {
                "caixa_id": body["caixa_id"],
                "usuario_id": body["usuario_id"],
                "forma_pagamento": body["forma_pagamento"],
                "status": body.get("status", "paga"),
                "valor_total": valor_total,
            }
        )
        .execute()
    )

    venda = venda_result.data[0]
    venda_id = venda["id"]
    itens_payload = []
    for item in itens:
        for field in ["produto_id", "quantidade", "preco_unitario", "subtotal"]:
            if item.get(field) is None:
                return fail(f"Item com campo obrigatorio ausente: {field}", 422)
        itens_payload.append({"venda_id": venda_id, **item})

    itens_result = sb.table("vendas_itens").insert(itens_payload).execute()
    return ok({"venda": venda, "itens": itens_result.data}, 201)


@vendas_bp.patch("/<int:venda_id>/status")
def atualizar_status_venda(venda_id: int):
    body = request.get_json(silent=True) or {}
    status = body.get("status")
    if status not in ["pendente", "paga", "cancelada"]:
        return fail("Status invalido", 422)

    sb = get_supabase()
    result = sb.table("vendas").update({"status": status}).eq("id", venda_id).execute()
    if not result.data:
        return fail("Venda nao encontrada", 404)
    return ok(result.data[0])
