from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import hashlib
import secrets
import os

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt

from database import (
    criar_tabela,
    registrar_usuario, buscar_usuario_por_email, buscar_usuario_por_id,
    atualizar_perfil, atualizar_senha_usuario, deletar_usuario,
    adicionar_gasto, visualizar_gasto, deletar_gasto, atualizar_gasto,
    deletar_todos_gastos_usuario,
    visualizar_categorias, visualizar_gastos_por_categoria,
    visualizar_gastos_por_mes, total_por_categoria, total_por_mes,
    criar_tabela_metas, buscar_metas, salvar_meta, remover_meta, deletar_metas_usuario,
    gastos_heatmap_ano, gastos_por_dia_semana, total_por_categoria_mes,
)

SECRET_KEY = os.getenv("JWT_SECRET", "fintrack-dev-secret-change-in-prod")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30

bearer = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        criar_tabela()
        criar_tabela_metas()
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


# --- Auth helpers ---

def _hash(senha: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", senha.encode(), salt.encode(), 100_000)
    return f"{salt}:{key.hex()}"


def _verificar(senha: str, hashed: str) -> bool:
    try:
        salt, key_hex = hashed.split(":", 1)
        key = hashlib.pbkdf2_hmac("sha256", senha.encode(), salt.encode(), 100_000)
        return secrets.compare_digest(key.hex(), key_hex)
    except Exception:
        return False


def _criar_token(usuario_id: int, email: str) -> str:
    exp = datetime.now(tz=timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(usuario_id), "email": email, "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)) -> int:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")


# --- Models ---

class PerfilUpdate(BaseModel):
    nome: str
    email: str


class SenhaUpdate(BaseModel):
    senha_atual: str
    nova_senha: str


class ContaDelete(BaseModel):
    senha: str


class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str


class LoginData(BaseModel):
    email: str
    senha: str


class GastoCreate(BaseModel):
    descricao: str
    valor: float
    data: str
    categoria_id: int


class GastoUpdate(BaseModel):
    valor: float
    data: str


class MetaUpsert(BaseModel):
    categoria_id: int
    valor: float


class Gasto(BaseModel):
    id: int
    descricao: str
    valor: float
    data: str
    categoria_id: int


class Categoria(BaseModel):
    id: int
    nome: str


# --- Auth ---

@app.post("/auth/cadastrar", status_code=201)
def cadastrar(usuario: UsuarioCreate):
    if buscar_usuario_por_email(usuario.email):
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")
    uid = registrar_usuario(usuario.nome, usuario.email, _hash(usuario.senha))
    return {"access_token": _criar_token(uid, usuario.email), "token_type": "bearer", "nome": usuario.nome}


@app.post("/auth/login")
def login(dados: LoginData):
    usuario = buscar_usuario_por_email(dados.email)
    if not usuario or not _verificar(dados.senha, usuario[3]):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    return {"access_token": _criar_token(usuario[0], usuario[2]), "token_type": "bearer", "nome": usuario[1]}


@app.get("/auth/me")
def me(uid: int = Depends(get_current_user)):
    u = buscar_usuario_por_id(uid)
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"id": u[0], "nome": u[1], "email": u[2]}


@app.put("/auth/perfil")
def update_perfil(dados: PerfilUpdate, uid: int = Depends(get_current_user)):
    existing = buscar_usuario_por_email(dados.email)
    if existing and existing[0] != uid:
        raise HTTPException(status_code=409, detail="E-mail já em uso por outra conta")
    atualizar_perfil(uid, dados.nome, dados.email)
    return {"mensagem": "Perfil atualizado"}


@app.put("/auth/senha")
def update_senha(dados: SenhaUpdate, uid: int = Depends(get_current_user)):
    u = buscar_usuario_por_id(uid)
    if not u or not _verificar(dados.senha_atual, u[3]):
        raise HTTPException(status_code=401, detail="Senha atual incorreta")
    if len(dados.nova_senha) < 6:
        raise HTTPException(status_code=422, detail="A nova senha deve ter pelo menos 6 caracteres")
    atualizar_senha_usuario(uid, _hash(dados.nova_senha))
    return {"mensagem": "Senha alterada com sucesso"}


@app.delete("/auth/conta")
def delete_conta(dados: ContaDelete, uid: int = Depends(get_current_user)):
    u = buscar_usuario_por_id(uid)
    if not u or not _verificar(dados.senha, u[3]):
        raise HTTPException(status_code=401, detail="Senha incorreta")
    deletar_usuario(uid)
    return {"mensagem": "Conta excluída"}


@app.delete("/gastos/todos")
def deletar_gastos_todos(uid: int = Depends(get_current_user)):
    deletar_todos_gastos_usuario(uid)
    return {"mensagem": "Todos os gastos foram excluídos"}


# --- Gastos ---

@app.get("/gastos", response_model=list[Gasto])
def listar_gastos(uid: int = Depends(get_current_user)):
    return [
        {"id": r[0], "descricao": r[1], "valor": r[2], "data": str(r[3]), "categoria_id": r[4]}
        for r in visualizar_gasto(uid)
    ]


@app.post("/gastos", status_code=201)
def criar_gasto(gasto: GastoCreate, uid: int = Depends(get_current_user)):
    adicionar_gasto(gasto.descricao, gasto.valor, gasto.data, gasto.categoria_id, uid)
    return {"mensagem": "Gasto adicionado com sucesso"}


@app.put("/gastos/{id}")
def atualizar(id: int, gasto: GastoUpdate, uid: int = Depends(get_current_user)):
    if not any(g[0] == id for g in visualizar_gasto(uid)):
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    atualizar_gasto(gasto.valor, gasto.data, id, uid)
    return {"mensagem": "Gasto atualizado com sucesso"}


@app.delete("/gastos/{id}")
def deletar(id: int, uid: int = Depends(get_current_user)):
    if not any(g[0] == id for g in visualizar_gasto(uid)):
        raise HTTPException(status_code=404, detail="Gasto não encontrado")
    deletar_gasto(id, uid)
    return {"mensagem": "Gasto deletado com sucesso"}


# --- Categorias ---

@app.get("/categorias", response_model=list[Categoria])
def listar_categorias():
    return [{"id": r[0], "nome": r[1]} for r in visualizar_categorias()]


@app.get("/gastos/categoria/{categoria_id}", response_model=list[Gasto])
def gastos_por_categoria(categoria_id: int, uid: int = Depends(get_current_user)):
    return [
        {"id": r[0], "descricao": r[1], "valor": r[2], "data": str(r[3]), "categoria_id": r[4]}
        for r in visualizar_gastos_por_categoria(categoria_id, uid)
    ]


@app.get("/gastos/mes/{mes}/{ano}", response_model=list[Gasto])
def gastos_por_mes(mes: int, ano: int, uid: int = Depends(get_current_user)):
    return [
        {"id": r[0], "descricao": r[1], "valor": r[2], "data": str(r[3]), "categoria_id": r[4]}
        for r in visualizar_gastos_por_mes(mes, ano, uid)
    ]


@app.get("/gastos/total/categoria")
def total_gastos_por_categoria(uid: int = Depends(get_current_user)):
    return [{"categoria": r[0], "total": r[1]} for r in total_por_categoria(uid)]


@app.get("/gastos/total/mes/{mes}/{ano}")
def total_gastos_por_mes(mes: int, ano: int, uid: int = Depends(get_current_user)):
    resultado = total_por_mes(mes, ano, uid)
    return {"mes": mes, "ano": ano, "total": resultado[0] if resultado and resultado[0] else 0.0}


@app.get("/gastos/total/categoria/mes/{mes}/{ano}")
def total_categoria_por_mes(mes: int, ano: int, uid: int = Depends(get_current_user)):
    return [{"nome": r[0], "categoria_id": r[1], "total": r[2]} for r in total_por_categoria_mes(mes, ano, uid)]


@app.get("/gastos/heatmap/{ano}")
def heatmap_gastos(ano: int, uid: int = Depends(get_current_user)):
    rows = gastos_heatmap_ano(uid, ano)
    return [{"data": str(r[0]), "total": float(r[1])} for r in rows]


@app.get("/gastos/dia-semana/{mes}/{ano}")
def gastos_dia_semana(mes: int, ano: int, uid: int = Depends(get_current_user)):
    rows = gastos_por_dia_semana(uid, mes, ano)
    return [{"dow": int(r[0]), "total": float(r[1]), "count": int(r[2])} for r in rows]


# --- Metas ---

@app.get("/metas")
def listar_metas(uid: int = Depends(get_current_user)):
    return [{"categoria_id": r[0], "valor": r[1]} for r in buscar_metas(uid)]


@app.post("/metas", status_code=201)
def criar_meta(meta: MetaUpsert, uid: int = Depends(get_current_user)):
    salvar_meta(uid, meta.categoria_id, meta.valor)
    return {"mensagem": "Meta salva"}


@app.delete("/metas/{categoria_id}")
def excluir_meta(categoria_id: int, uid: int = Depends(get_current_user)):
    remover_meta(uid, categoria_id)
    return {"mensagem": "Meta removida"}
