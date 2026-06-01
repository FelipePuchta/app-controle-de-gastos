from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import (
    criar_tabela,
    adicionar_gasto, visualizar_gasto, deletar_gasto, atualizar_gasto,
    visualizar_categorias, visualizar_gastos_por_categoria,
    visualizar_gastos_por_mes, total_por_categoria, total_por_mes
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        criar_tabela()
    except Exception as e:
        print(f"WARNING: DB init failed: {e}")
    yield

app = FastAPI(title="Controle de Gastos API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)



class GastoCreate(BaseModel):
    descricao: str
    valor: float
    data: str
    categoria_id: int


class GastoUpdate(BaseModel):
    valor: float
    data: str


class Gasto(BaseModel):
    id: int
    descricao: str
    valor: float
    data: str
    categoria_id: int


class Categoria(BaseModel):
    id: int
    nome: str


# --- Gastos ---

@app.get("/gastos", response_model=list[Gasto])
def listar_gastos():
    resultados = visualizar_gasto()
    return [
        {"id": r[0], "descricao": r[1], "valor": r[2], "data": str(r[3]), "categoria_id": r[4]}
        for r in resultados
    ]


@app.post("/gastos", status_code=201)
def criar_gasto(gasto: GastoCreate):
    adicionar_gasto(gasto.descricao, gasto.valor, gasto.data, gasto.categoria_id)
    return {"mensagem": "Gasto adicionado com sucesso"}


@app.put("/gastos/{id}")
def atualizar(id: int, gasto: GastoUpdate):
    gastos = visualizar_gasto()
    if not any(g[0] == id for g in gastos):
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    atualizar_gasto(gasto.valor, gasto.data, id)
    return {"mensagem": "Gasto atualizado com sucesso"}


@app.delete("/gastos/{id}")
def deletar(id: int):
    gastos = visualizar_gasto()
    if not any(g[0] == id for g in gastos):
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    deletar_gasto(id)
    return {"mensagem": "Gasto deletado com sucesso"}


# --- Categorias ---

@app.get("/categorias", response_model=list[Categoria])
def listar_categorias():
    resultados = visualizar_categorias()
    return [{"id": r[0], "nome": r[1]} for r in resultados]


@app.get("/gastos/categoria/{categoria_id}", response_model=list[Gasto])
def gastos_por_categoria(categoria_id: int):
    resultados = visualizar_gastos_por_categoria(categoria_id)
    return [
        {"id": r[0], "descricao": r[1], "valor": r[2], "data": str(r[3]), "categoria_id": r[4]}
        for r in resultados
    ]


# --- Filtros e Totais ---

@app.get("/gastos/mes/{mes}/{ano}", response_model=list[Gasto])
def gastos_por_mes(mes: int, ano: int):
    resultados = visualizar_gastos_por_mes(mes, ano)
    return [
        {"id": r[0], "descricao": r[1], "valor": r[2], "data": str(r[3]), "categoria_id": r[4]}
        for r in resultados
    ]


@app.get("/gastos/total/categoria")
def total_gastos_por_categoria():
    resultados = total_por_categoria()
    return [{"categoria": r[0], "total": r[1]} for r in resultados]


@app.get("/gastos/total/mes/{mes}/{ano}")
def total_gastos_por_mes(mes: int, ano: int):
    resultado = total_por_mes(mes, ano)
    total = resultado[0] if resultado and resultado[0] else 0.0
    return {"mes": mes, "ano": ano, "total": total}