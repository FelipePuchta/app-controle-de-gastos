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


def criar_tabela():
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
    cursor.execute(
        "INSERT INTO usuarios(nome, email, senha) VALUES(%s, %s, %s) RETURNING id",
        (nome, email, senha_hash)
    )
    conexao.commit()
    return cursor.fetchone()[0]


def buscar_usuario_por_email(email):
    cursor.execute(
        "SELECT id, nome, email, senha FROM usuarios WHERE email = %s",
        (email,)
    )
    return cursor.fetchone()


# GASTOS

def adicionar_gasto(descricao, valor, data, categoria_id, usuario_id):
    cursor.execute(
        "INSERT INTO gastos(descricao, valor, data, categoria_id, usuario_id)"
        " VALUES(%s, %s, %s, %s, %s)",
        (descricao, valor, data, categoria_id, usuario_id)
    )
    conexao.commit()


def visualizar_gasto(usuario_id):
    cursor.execute(
        "SELECT id, descricao, valor, data, categoria_id FROM gastos WHERE usuario_id = %s",
        (usuario_id,)
    )
    return cursor.fetchall()


def deletar_gasto(id, usuario_id):
    cursor.execute(
        "DELETE FROM gastos WHERE id = %s AND usuario_id = %s",
        (id, usuario_id)
    )
    conexao.commit()


def atualizar_gasto(novo_valor, nova_data, id, usuario_id):
    cursor.execute(
        "UPDATE gastos SET valor = %s, data = %s WHERE id = %s AND usuario_id = %s",
        (novo_valor, nova_data, id, usuario_id)
    )
    conexao.commit()


# CATEGORIAS

def visualizar_categorias():
    cursor.execute("SELECT * FROM categorias")
    return cursor.fetchall()


def visualizar_gastos_por_categoria(categoria_id, usuario_id):
    cursor.execute(
        "SELECT id, descricao, valor, data, categoria_id FROM gastos"
        " WHERE categoria_id = %s AND usuario_id = %s",
        (categoria_id, usuario_id)
    )
    return cursor.fetchall()


def visualizar_gastos_por_mes(mes, ano, usuario_id):
    cursor.execute(
        "SELECT id, descricao, valor, data, categoria_id FROM gastos"
        " WHERE EXTRACT(MONTH FROM data) = %s"
        " AND EXTRACT(YEAR FROM data) = %s"
        " AND usuario_id = %s",
        (mes, ano, usuario_id)
    )
    return cursor.fetchall()


def total_por_categoria(usuario_id):
    cursor.execute(
        "SELECT categorias.nome, SUM(gastos.valor) FROM gastos"
        " JOIN categorias ON gastos.categoria_id = categorias.id"
        " WHERE gastos.usuario_id = %s"
        " GROUP BY categorias.nome",
        (usuario_id,)
    )
    return cursor.fetchall()


def total_por_mes(mes, ano, usuario_id):
    cursor.execute(
        "SELECT SUM(valor) FROM gastos"
        " WHERE EXTRACT(MONTH FROM data) = %s"
        " AND EXTRACT(YEAR FROM data) = %s"
        " AND usuario_id = %s",
        (mes, ano, usuario_id)
    )
    return cursor.fetchone()
