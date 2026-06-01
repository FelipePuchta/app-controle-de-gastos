#IMPORTAÇÕES DAS BIBLIOTECAS
import psycopg2
from dotenv import load_dotenv
import os

#CONEXÃO COM O BANCO DE DADOS
load_dotenv(r"C:\Users\Usuario\Desktop\App Controle de Gastos\.env")

conexao=psycopg2.connect(
    host=os.getenv("DB_HOST"),
    database=os.getenv("DB_DATABASE"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT"),
)

cursor=conexao.cursor()

#CRIAÇÃO DAS TABELAS DO BANCO DE DADOS

def criar_tabela():
    cursor.execute("CREATE TABLE IF NOT EXISTS categorias(id SERIAL PRIMARY KEY, nome VARCHAR(30) NOT NULL)")

    cursor.execute("CREATE TABLE IF NOT EXISTS gastos(id SERIAL PRIMARY KEY, descricao VARCHAR(100) NOT NULL, " \
    "valor REAL NOT NULL, data DATE)")
    conexao.commit()

criar_tabela()

#CRUD GASTOS

def adicionar_gasto(descricao,valor,data,categoria_id):
    cursor.execute("INSERT INTO gastos( descricao, valor, data, categoria_id)" \
    " VALUES(%s, %s, %s, %s)",(descricao, valor, data, categoria_id,))
    conexao.commit()

def visualizar_gasto():
    cursor.execute("SELECT * FROM gastos")
    resultados=cursor.fetchall()
    return resultados

def deletar_gasto(id):
    cursor.execute("DELETE FROM gastos" \
    " WHERE id = %s",(id,))
    conexao.commit()

def atualizar_gasto(novo_valor, nova_data, id):
    cursor.execute("UPDATE gastos" \
    " SET valor = %s," \
    "     data = %s " \
    " WHERE id = %s ", (novo_valor, nova_data, id))
    conexao.commit()

#CRUD CATEGORIAS

def visualizar_categorias():
    cursor.execute("SELECT * FROM categorias")
    resultados=cursor.fetchall()
    return resultados

def visualizar_gastos_por_categoria(categoria_id):
    cursor.execute("SELECT * FROM gastos WHERE categoria_id = %s",(categoria_id,))
    resultados=cursor.fetchall()
    return resultados

def visualizar_gastos_por_mes(mes,ano):
    cursor.execute("SELECT * FROM gastos WHERE EXTRACT(MONTH FROM data) = %s" \
    " AND EXTRACT(YEAR FROM data) = %s",(mes,ano,))
    resultados=cursor.fetchall()
    return resultados

def total_por_categoria():
    cursor.execute("SELECT categorias.nome, SUM(gastos.valor) FROM gastos JOIN categorias ON gastos.categoria_id = categorias.id GROUP BY categorias.nome")
    resultados=cursor.fetchall()
    return resultados

def total_por_mes(mes,ano):
    cursor.execute("SELECT SUM(valor) FROM gastos WHERE EXTRACT(MONTH FROM data) = %s" \
    " AND EXTRACT(YEAR FROM data) = %s",(mes,ano,))
    resultado=cursor.fetchone()
    return resultado











