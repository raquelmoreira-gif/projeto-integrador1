from uuid import UUID

from flask import Blueprint, request

from app.services.responses import fail, ok
from app.services.supabase_client import get_supabase

vendas_bp = Blueprint("vendas", __name__, url_prefix="/api/vendas")

FORMAS_PAGAMENTO = frozenset({"dinheiro", "pix", "debito", "credito"})


def _required_present(body: dict, fields: list[str]) -> list[str]:
    missing = []
    for field in fields:
        val = body.get(field)
        if field == "itens":
            if val is None:
                missing.append(field)
        elif val is None or (isinstance(val, str) and not val.strip()):
            missing.append(field)
    return missing


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
    required = ["usuario_id", "forma_pagamento", "itens"]
    missing = _required_present(body, required)
    if missing:
        return fail(f"Campos obrigatorios ausentes: {', '.join(missing)}", 422)

    forma = body["forma_pagamento"]
    if isinstance(forma, str):
        forma = forma.strip()
    if forma not in FORMAS_PAGAMENTO:
        return fail(
            "forma_pagamento invalida; use: dinheiro, pix, debito ou credito",
            422,
        )

    itens = body.get("itens", [])
    if not itens:
        return fail("A venda precisa ter ao menos 1 item", 422)

    valor_total = sum(item.get("subtotal", 0) for item in itens)
    if valor_total <= 0:
        return fail("Valor total da venda deve ser maior que zero", 422)

    sb = get_supabase()

    # 🔎 BUSCA CAIXA ABERTO
    caixa_aberto = (
        sb.table("caixa")
        .select("id")
        .eq("status", "aberto")
        .limit(1)
        .execute()
    )
    if not caixa_aberto.data:
        return fail("Não existe caixa aberto para registrar venda.", 400)

    caixa_id = caixa_aberto.data[0]["id"]

    try:
        # ✅ CRIA VENDA
        venda_result = (
            sb.table("vendas")
            .insert(
                {
                    "caixa_id": caixa_id,
                    "usuario_id": body["usuario_id"],
                    "forma_pagamento": forma,
                    "status": body.get("status", "paga"),
                    "valor_total": valor_total,
                }
            )
            .execute()
        )

        if not venda_result.data:
            return fail("Erro ao criar venda", 500)

        venda = venda_result.data[0]
        venda_id = venda["id"]

        # 🔎 VALIDA ITENS ANTES DE INSERIR
        itens_payload = []
        for item in itens:
            for field in ["produto_id", "quantidade", "preco_unitario", "subtotal"]:
                if item.get(field) is None:
                    return fail(f"Item com campo obrigatorio ausente: {field}", 422)

            itens_payload.append({"venda_id": venda_id, **item})

        # ✅ INSERE ITENS
        itens_result = sb.table("vendas_itens").insert(itens_payload).execute()

        if not itens_result.data:
            # rollback manual
            sb.table("vendas").delete().eq("id", venda_id).execute()
            return fail("Erro ao inserir itens da venda", 500)

        return ok({"venda": venda, "itens": itens_result.data}, 201)

    except Exception as e:
        return fail(f"Erro ao criar venda: {str(e)}", 500)


@vendas_bp.patch("/<uuid:venda_id>/status")
def atualizar_status_venda(venda_id: UUID):
    body = request.get_json(silent=True) or {}
    status = body.get("status")

    if status not in ["pendente", "paga", "cancelada"]:
        return fail("Status invalido", 422)

    sb = get_supabase()

    venda_result = (
        sb.table("vendas")
        .select("*")
        .eq("id", str(venda_id))
        .limit(1)
        .execute()
    )

    if not venda_result.data:
        return fail("Venda nao encontrada", 404)

    venda = venda_result.data[0]

    # 🔒 NÃO PERMITE ALTERAR VENDA CANCELADA
    if venda["status"] == "cancelada":
        return fail("Venda já está cancelada", 400)

    result = (
        sb.table("vendas")
        .update({"status": status})
        .eq("id", str(venda_id))
        .execute()
    )

    if not result.data:
        return fail("Erro ao atualizar status", 500)

    return ok(result.data[0])
