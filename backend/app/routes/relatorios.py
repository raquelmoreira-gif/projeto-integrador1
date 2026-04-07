from flask import Blueprint

from app.services.responses import ok
from app.services.supabase_client import get_supabase

relatorios_bp = Blueprint("relatorios", __name__, url_prefix="/api/relatorios")


def _query_view(view_name: str):
    sb = get_supabase()
    result = sb.table(view_name).select("*").execute()
    return ok(result.data)


@relatorios_bp.get("/caixa")
def relatorio_caixa():
    return _query_view("relatorio_caixa")


@relatorios_bp.get("/vendas-produto")
def relatorio_vendas_produto():
    return _query_view("relatorio_vendas_produto")


@relatorios_bp.get("/vendas-dia")
def relatorio_vendas_dia():
    return _query_view("relatorio_vendas_dia")


@relatorios_bp.get("/estoque")
def relatorio_estoque():
    return _query_view("relatorio_estoque")


@relatorios_bp.get("/estoque-baixo")
def relatorio_estoque_baixo():
    return _query_view("relatorio_estoque_baixo")


@relatorios_bp.get("/consignado")
def relatorio_consignado():
    return _query_view("relatorio_consignado")
