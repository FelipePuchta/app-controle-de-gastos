import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

database_url = os.getenv("DATABASE_URL")
if database_url:
    conexao = psycopg2.connect(database_url, sslmode="require")
else:
    conexao = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_DATABASE"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT"),
        sslmode="require",
    )

cursor = conexao.cursor()


def _do_reconnect():
    global conexao, cursor
    try:
        conexao.close()
    except Exception:
        pass
    if database_url:
        conexao = psycopg2.connect(database_url, sslmode="require")
    else:
        conexao = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            database=os.getenv("DB_DATABASE"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT"),
            sslmode="require",
        )
    cursor = conexao.cursor()


def _ensure_connection():
    try:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    except Exception:
        _do_reconnect()
        try:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        except Exception:
            _do_reconnect()


def criar_tabela():
    _ensure_connection()
    cursor.execute(
        "CREATE TABLE IF NOT EXISTS categorias("
        "id SERIAL PRIMARY KEY, nome VARCHAR(30) NOT NULL)"
    )
    conexao.commit()

    cursor.execute(
        "CREATE TABLE IF NOT EXISTS usuarios ("
        "id SERIAL PRIMARY KEY, "
        "nome VARCHAR(50) NOT NULL, "
        "email VARCHAR(60) UNIQUE NOT NULL, "
        "senha VARCHAR(255) NOT NULL)"
    )
    conexao.commit()

    cursor.execute(
        "CREATE TABLE IF NOT EXISTS gastos("
        "id SERIAL PRIMARY KEY, "
        "descricao VARCHAR(100) NOT NULL, "
        "valor REAL NOT NULL, "
        "data DATE, "
        "categoria_id INTEGER REFERENCES categorias(id), "
        "usuario_id INTEGER REFERENCES usuarios(id))"
    )
    conexao.commit()


# USUARIOS

def registrar_usuario(nome, email, senha_hash):
    _ensure_connection()
    cursor.execute(
        "INSERT INTO usuarios(nome, email, senha) VALUES(%s, %s, %s) RETURNING id",
        (nome, email, senha_hash)
    )
    conexao.commit()
    return cursor.fetchone()[0]


def buscar_usuario_por_email(email):
    _ensure_connection()
    cursor.execute(
        "SELECT id, nome, email, senha FROM usuarios WHERE email = %s",
        (email,)
    )
    return cursor.fetchone()


def buscar_usuario_por_id(usuario_id):
    _ensure_connection()
    cursor.execute(
        "SELECT id, nome, email, senha FROM usuarios WHERE id = %s",
        (usuario_id,)
    )
    return cursor.fetchone()


def atualizar_perfil(usuario_id, nome, email):
    _ensure_connection()
    cursor.execute(
        "UPDATE usuarios SET nome = %s, email = %s WHERE id = %s",
        (nome, email, usuario_id)
    )
    conexao.commit()


def atualizar_senha_usuario(usuario_id, nova_senha_hash):
    _ensure_connection()
    cursor.execute(
        "UPDATE usuarios SET senha = %s WHERE id = %s",
        (nova_senha_hash, usuario_id)
    )
    conexao.commit()


def deletar_usuario(usuario_id):
    _ensure_connection()
    cursor.execute("DELETE FROM gastos WHERE usuario_id = %s", (usuario_id,))
    cursor.execute("DELETE FROM usuarios WHERE id = %s", (usuario_id,))
    conexao.commit()


def deletar_todos_gastos_usuario(usuario_id):
    _ensure_connection()
    cursor.execute("DELETE FROM gastos WHERE usuario_id = %s", (usuario_id,))
    conexao.commit()


# GASTOS

def adicionar_gasto(descricao, valor, data, categoria_id, usuario_id):
    _ensure_connection()
    cursor.execute(
        "INSERT INTO gastos(descricao, valor, data, categoria_id, usuario_id)"
        " VALUES(%s, %s, %s, %s, %s)",
        (descricao, valor, data, categoria_id, usuario_id)
    )
    conexao.commit()


def visualizar_gasto(usuario_id):
    _ensure_connection()
    cursor.execute(
        "SELECT id, descricao, valor, data, categoria_id FROM gastos WHERE usuario_id = %s",
        (usuario_id,)
    )
    return cursor.fetchall()


def deletar_gasto(id, usuario_id):
    _ensure_connection()
    cursor.execute(
        "DELETE FROM gastos WHERE id = %s AND usuario_id = %s",
        (id, usuario_id)
    )
    conexao.commit()


def atualizar_gasto(novo_valor, nova_data, id, usuario_id):
    _ensure_connection()
    cursor.execute(
        "UPDATE gastos SET valor = %s, data = %s WHERE id = %s AND usuario_id = %s",
        (novo_valor, nova_data, id, usuario_id)
    )
    conexao.commit()


# CATEGORIAS

def visualizar_categorias():
    _ensure_connection()
    cursor.execute("SELECT * FROM categorias")
    return cursor.fetchall()


def visualizar_gastos_por_categoria(categoria_id, usuario_id):
    _ensure_connection()
    cursor.execute(
        "SELECT id, descricao, valor, data, categoria_id FROM gastos"
        " WHERE categoria_id = %s AND usuario_id = %s",
        (categoria_id, usuario_id)
    )
    return cursor.fetchall()


def visualizar_gastos_por_mes(mes, ano, usuario_id):
    _ensure_connection()
    cursor.execute(
        "SELECT id, descricao, valor, data, categoria_id FROM gastos"
        " WHERE EXTRACT(MONTH FROM data) = %s"
        " AND EXTRACT(YEAR FROM data) = %s"
        " AND usuario_id = %s",
        (mes, ano, usuario_id)
    )
    return cursor.fetchall()


def total_por_categoria(usuario_id):
    _ensure_connection()
    cursor.execute(
        "SELECT categorias.nome, SUM(gastos.valor) FROM gastos"
        " JOIN categorias ON gastos.categoria_id = categorias.id"
        " WHERE gastos.usuario_id = %s"
        " GROUP BY categorias.nome",
        (usuario_id,)
    )
    return cursor.fetchall()


def total_por_mes(mes, ano, usuario_id):
    _ensure_connection()
    cursor.execute(
        "SELECT SUM(valor) FROM gastos"
        " WHERE EXTRACT(MONTH FROM data) = %s"
        " AND EXTRACT(YEAR FROM data) = %s"
        " AND usuario_id = %s",
        (mes, ano, usuario_id)
    )
    return cursor.fetchone()


# METAS

def criar_tabela_metas():
    _ensure_connection()
    cursor.execute(
        "CREATE TABLE IF NOT EXISTS metas("
        "id SERIAL PRIMARY KEY, "
        "usuario_id INTEGER REFERENCES usuarios(id), "
        "categoria_id INTEGER REFERENCES categorias(id), "
        "valor REAL NOT NULL, "
        "UNIQUE(usuario_id, categoria_id))"
    )
    conexao.commit()


def buscar_metas(usuario_id):
    _ensure_connection()
    cursor.execute(
        "SELECT categoria_id, valor FROM metas WHERE usuario_id = %s",
        (usuario_id,)
    )
    return cursor.fetchall()


def salvar_meta(usuario_id, categoria_id, valor):
    _ensure_connection()
    cursor.execute(
        "INSERT INTO metas(usuario_id, categoria_id, valor) VALUES(%s, %s, %s)"
        " ON CONFLICT (usuario_id, categoria_id) DO UPDATE SET valor = EXCLUDED.valor",
        (usuario_id, categoria_id, valor)
    )
    conexao.commit()


def remover_meta(usuario_id, categoria_id):
    _ensure_connection()
    cursor.execute(
        "DELETE FROM metas WHERE usuario_id = %s AND categoria_id = %s",
        (usuario_id, categoria_id)
    )
    conexao.commit()


def deletar_metas_usuario(usuario_id):
    _ensure_connection()
    cursor.execute("DELETE FROM metas WHERE usuario_id = %s", (usuario_id,))
    conexao.commit()


# ANÁLISE

def gastos_heatmap_ano(usuario_id, ano):
    _ensure_connection()
    cursor.execute(
        "SELECT data, SUM(valor) FROM gastos"
        " WHERE usuario_id = %s AND EXTRACT(YEAR FROM data) = %s"
        " GROUP BY data ORDER BY data",
        (usuario_id, ano)
    )
    return cursor.fetchall()


def gastos_por_dia_semana(usuario_id, mes, ano):
    _ensure_connection()
    cursor.execute(
        "SELECT EXTRACT(DOW FROM data) AS dow, SUM(valor), COUNT(*) FROM gastos"
        " WHERE usuario_id = %s"
        " AND EXTRACT(MONTH FROM data) = %s"
        " AND EXTRACT(YEAR FROM data) = %s"
        " GROUP BY dow ORDER BY dow",
        (usuario_id, mes, ano)
    )
    return cursor.fetchall()


def total_por_categoria_mes(mes, ano, usuario_id):
    _ensure_connection()
    cursor.execute(
        "SELECT categorias.nome, categorias.id, SUM(gastos.valor) FROM gastos"
        " JOIN categorias ON gastos.categoria_id = categorias.id"
        " WHERE gastos.usuario_id = %s"
        " AND EXTRACT(MONTH FROM gastos.data) = %s"
        " AND EXTRACT(YEAR FROM gastos.data) = %s"
        " GROUP BY categorias.nome, categorias.id",
        (usuario_id, mes, ano)
    )
    return cursor.fetchall()
