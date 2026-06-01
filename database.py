import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

_conexao = None

def get_conn():
    global _conexao
    if _conexao is None or _conexao.closed:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            _conexao = psycopg2.connect(database_url, sslmode="require")
        else:
            _conexao = psycopg2.connect(
                host=os.getenv("DB_HOST"),
                database=os.getenv("DB_DATABASE"),
                user=os.getenv("DB_USER"),
                password=os.getenv("DB_PASSWORD"),
                port=os.getenv("DB_PORT"),
                sslmode="require",
            )
    return _conexao

def criar_tabela():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS categorias(id SERIAL PRIMARY KEY, nome VARCHAR(30) NOT NULL)")
    cur.execute(
        "CREATE TABLE IF NOT EXISTS gastos("
        "id SERIAL PRIMARY KEY, descricao VARCHAR(100) NOT NULL, "
        "valor REAL NOT NULL, data DATE, "
        "categoria_id INTEGER REFERENCES categorias(id))"
    )
    conn.commit()

def adicionar_gasto(descricao, valor, data, categoria_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO gastos(descricao, valor, data, categoria_id) VALUES(%s, %s, %s, %s)",
        (descricao, valor, data, categoria_id),
    )
    conn.commit()

def visualizar_gasto():
    cur = get_conn().cursor()
    cur.execute("SELECT * FROM gastos")
    return cur.fetchall()

def deletar_gasto(id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM gastos WHERE id = %s", (id,))
    conn.commit()

def atualizar_gasto(novo_valor, nova_data, id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE gastos SET valor = %s, data = %s WHERE id = %s",
        (novo_valor, nova_data, id),
    )
    conn.commit()

def visualizar_categorias():
    cur = get_conn().cursor()
    cur.execute("SELECT * FROM categorias")
    return cur.fetchall()

def visualizar_gastos_por_categoria(categoria_id):
    cur = get_conn().cursor()
    cur.execute("SELECT * FROM gastos WHERE categoria_id = %s", (categoria_id,))
    return cur.fetchall()

def visualizar_gastos_por_mes(mes, ano):
    cur = get_conn().cursor()
    cur.execute(
        "SELECT * FROM gastos WHERE EXTRACT(MONTH FROM data) = %s AND EXTRACT(YEAR FROM data) = %s",
        (mes, ano),
    )
    return cur.fetchall()

def total_por_categoria():
    cur = get_conn().cursor()
    cur.execute(
        "SELECT categorias.nome, SUM(gastos.valor) FROM gastos "
        "JOIN categorias ON gastos.categoria_id = categorias.id "
        "GROUP BY categorias.nome"
    )
    return cur.fetchall()

def total_por_mes(mes, ano):
    cur = get_conn().cursor()
    cur.execute(
        "SELECT SUM(valor) FROM gastos WHERE EXTRACT(MONTH FROM data) = %s AND EXTRACT(YEAR FROM data) = %s",
        (mes, ano),
    )
    return cur.fetchone()
