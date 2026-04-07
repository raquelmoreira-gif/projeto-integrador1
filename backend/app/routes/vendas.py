from flask import Blueprint, request

vendas_bp = Blueprint("vendas", __name__, url_prefix="/api/vendas")

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

    # 🔒 BLOQUEIA PRODUTOS DUPLICADOS
    produtos_vistos = set()
    for item in itens:
        produto_id = item.get("produto_id")
        if produto_id in produtos_vistos:
            return fail("Produto duplicado na venda", 422)
        produtos_vistos.add(produto_id)

    # 🔥 BUSCA TODOS OS PRODUTOS DE UMA VEZ
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

        itens_payload.append({
            "produto_id": produto_id,
            "quantidade": quantidade,
            "preco_unitario": preco,
            "subtotal": subtotal
        })

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
