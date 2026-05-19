from flask import Blueprint, request

from app.services.responses import fail, ok
from app.services.supabase_client import get_supabase

vendas_bp = Blueprint("vendas", __name__, url_prefix="/api/vendas")

FORMAS_PAGAMENTO = {"dinheiro", "pix", "debito", "credito"}


def _required_present(body, required_fields):
    return [field for field in required_fields if body.get(field) in (None, "", [])]


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

    sb = get_supabase()

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

    produtos_vistos = set()
    for item in itens:
        produto_id = item.get("produto_id")
        if produto_id in produtos_vistos:
            return fail("Produto duplicado na venda", 422)
        produtos_vistos.add(produto_id)

    produto_ids = [item.get("produto_id") for item in itens if item.get("produto_id")]

    produtos_result = (
        sb.table("produtos")
        .select("id, preco")
        .in_("id", produto_ids)
        .execute()
    )

    if not produtos_result.data:
        return fail("Produtos não encontrados", 404)

    produtos_map = {p["id"]: p["preco"] for p in produtos_result.data}

    valor_total = 0
    itens_payload = []

    for item in itens:
        produto_id = item.get("produto_id")
        quantidade = item.get("quantidade")

        if not produto_id or quantidade is None:
            return fail("Item deve conter produto_id e quantidade", 422)

        try:
            quantidade = int(quantidade)
        except (TypeError, ValueError):
            return fail("Quantidade deve ser um numero inteiro", 422)

        if quantidade <= 0:
            return fail("Quantidade deve ser maior que zero", 422)

        if produto_id not in produtos_map:
            return fail("Produto não encontrado", 404)

        preco = produtos_map[produto_id]
        subtotal = preco * quantidade
        valor_total += subtotal

        itens_payload.append(
            {
                "produto_id": produto_id,
                "quantidade": quantidade,
                "preco_unitario": preco,
                "subtotal": subtotal,
            }
        )

    if valor_total <= 0:
        return fail("Valor total da venda deve ser maior que zero", 422)

    try:
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

        for item in itens_payload:
            item["venda_id"] = venda_id

        itens_result = sb.table("vendas_itens").insert(itens_payload).execute()

        if not itens_result.data:
            sb.table("vendas").delete().eq("id", venda_id).execute()
            return fail("Erro ao inserir itens da venda", 500)

        return ok({"venda": venda, "itens": itens_result.data}, 201)

    except Exception as e:
        return fail(f"Erro ao criar venda: {str(e)}", 500)


@vendas_bp.get("")
def listar_vendas():
    sb = get_supabase()
    result = (
        sb.table("vendas")
        .select("*")
        .order("criado_em", desc=True)
        .execute()
    )
    return ok(result.data)


@vendas_bp.delete("/<venda_id>")
def excluir_venda(venda_id: str):
    sb = get_supabase()

    # 1. Busca os itens da venda com quantidade de cada produto
    itens_result = (
        sb.table("vendas_itens")
        .select("produto_id, quantidade")
        .eq("venda_id", venda_id)
        .execute()
    )
    itens = itens_result.data or []

    if not itens:
        # Tenta excluir a venda mesmo sem itens (pode já ter sido limpa)
        venda_result = sb.table("vendas").delete().eq("id", venda_id).execute()
        if not venda_result.data:
            return fail("Venda não encontrada", 404)
        return ok({"mensagem": "Venda excluída (sem itens para devolver)", "itens_devolvidos": 0})

    try:
        erros = []

        for item in itens:
            produto_id = item["produto_id"]
            quantidade = item["quantidade"]

            # 2. Busca estoque atual do produto
            produto_result = (
                sb.table("produtos")
                .select("id, quantidade_estoque")
                .eq("id", produto_id)
                .limit(1)
                .execute()
            )

            if not produto_result.data:
                erros.append(f"Produto {produto_id} não encontrado")
                continue

            estoque_atual = produto_result.data[0]["quantidade_estoque"]
            novo_estoque = estoque_atual + quantidade

            # 3. Devolve o estoque manualmente (não depende do trigger)
            sb.table("produtos").update(
                {"quantidade_estoque": novo_estoque}
            ).eq("id", produto_id).execute()

            # 4. Registra a movimentação de entrada no histórico
            sb.table("movimentacoes_estoque").insert({
                "produto_id": produto_id,
                "tipo": "entrada",
                "quantidade": quantidade,
                "motivo": f"Devolução por exclusão da venda {venda_id}"
            }).execute()

        # 5. Deleta todos os itens da venda
        sb.table("vendas_itens").delete().eq("venda_id", venda_id).execute()

        # 6. Deleta a venda
        venda_result = sb.table("vendas").delete().eq("id", venda_id).execute()

        if not venda_result.data:
            return fail("Venda não encontrada ou já excluída", 404)

        resposta = {
            "mensagem": "Venda excluída e estoque devolvido com sucesso",
            "itens_devolvidos": len(itens)
        }
        if erros:
            resposta["avisos"] = erros

        return ok(resposta)

    except Exception as e:
        return fail(f"Erro ao excluir venda: {str(e)}", 500)
