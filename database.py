import mysql.connector
from mysql.connector import Error

def get_connection():
    try:
        conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="1234",  # COLOCA SUA SENHA AQUI
            database="velorateste"
        )
        return conn
    except Error as e:
        print("Erro ao conectar:", e)
        return None