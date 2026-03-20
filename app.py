from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from database import get_connection
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "velora_secret")
CORS(app)
bcrypt = Bcrypt(app)


def row_to_user(user_row):
    return {
        "id": user_row[0],
        "name": user_row[1],
        "username": user_row[2],
        "email": user_row[3],
        "account_type": user_row[5]
    }


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()

    name = (data.get("name") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()
    account_type = (data.get("accountType") or "player").strip()

    if not name or not username or not email or not password:
        return jsonify({"error": "Preencha nome, usuário, e-mail e senha."}), 400

    if len(password) < 8:
        return jsonify({"error": "A senha deve ter pelo menos 8 caracteres."}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        cursor = conn.cursor()

        cursor.execute(
            "SELECT id FROM users WHERE username = %s OR email = %s",
            (username, email)
        )
        existing = cursor.fetchone()

        if existing:
            return jsonify({"error": "Usuário ou e-mail já cadastrado."}), 409

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        cursor.execute("""
            INSERT INTO users (name, username, email, password_hash, account_type)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, username, email, password_hash, account_type))

        user_id = cursor.lastrowid

        if account_type == "developer":
            cursor.execute("""
                INSERT INTO developer_profiles (user_id, display_name, bio, favorite_genres)
                VALUES (%s, %s, %s, %s)
            """, (user_id, name, "", ""))
        else:
            cursor.execute("""
                INSERT INTO player_profiles (user_id, display_name, bio, favorite_genres)
                VALUES (%s, %s, %s, %s)
            """, (user_id, name, "", ""))

        conn.commit()

        return jsonify({
            "message": "Conta criada com sucesso.",
            "user": {
                "id": user_id,
                "name": name,
                "username": username,
                "email": email,
                "account_type": account_type
            }
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Erro ao cadastrar: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    login_value = (data.get("login") or "").strip()
    password = (data.get("password") or "").strip()

    if not login_value or not password:
        return jsonify({"error": "Informe login e senha."}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, username, email, password_hash, account_type
            FROM users
            WHERE username = %s OR email = %s
        """, (login_value, login_value))

        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Usuário não encontrado."}), 404

        if not bcrypt.check_password_hash(user[4], password):
            return jsonify({"error": "Senha incorreta."}), 401

        return jsonify({
            "message": "Login realizado com sucesso.",
            "user": row_to_user(user)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Erro no login: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/profile/user/<int:user_id>", methods=["GET"])
def get_user_profile(user_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.name, u.username, u.email, u.account_type,
                   p.display_name, p.bio, p.favorite_genres, p.avatar_url
            FROM users u
            LEFT JOIN player_profiles p ON p.user_id = u.id
            WHERE u.id = %s AND u.account_type = 'player'
        """, (user_id,))
        profile = cursor.fetchone()

        if not profile:
            return jsonify({"error": "Perfil não encontrado."}), 404

        return jsonify({"data": profile}), 200

    except Exception as e:
        return jsonify({"error": f"Erro ao buscar perfil: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/profile/dev/<int:user_id>", methods=["GET"])
def get_dev_profile(user_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT u.id, u.name, u.username, u.email, u.account_type,
                   d.display_name, d.studio_name, d.bio, d.website,
                   d.favorite_genres, d.avatar_url
            FROM users u
            LEFT JOIN developer_profiles d ON d.user_id = u.id
            WHERE u.id = %s AND u.account_type = 'developer'
        """, (user_id,))
        profile = cursor.fetchone()

        if not profile:
            return jsonify({"error": "Perfil não encontrado."}), 404

        return jsonify({"data": profile}), 200

    except Exception as e:
        return jsonify({"error": f"Erro ao buscar perfil: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/profile/user/<int:user_id>", methods=["PUT"])
def update_user_profile(user_id):
    data = request.get_json()

    display_name = (data.get("display_name") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    bio = (data.get("bio") or "").strip()

    if not display_name or not username or not email:
        return jsonify({"error": "Nome, usuário e e-mail são obrigatórios."}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE users
            SET username = %s, email = %s, name = %s
            WHERE id = %s AND account_type = 'player'
        """, (username, email, display_name, user_id))

        cursor.execute("""
            UPDATE player_profiles
            SET display_name = %s, bio = %s
            WHERE user_id = %s
        """, (display_name, bio, user_id))

        conn.commit()
        return jsonify({"message": "Perfil atualizado com sucesso."}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Erro ao atualizar perfil: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/profile/dev/<int:user_id>", methods=["PUT"])
def update_dev_profile(user_id):
    data = request.get_json()

    display_name = (data.get("display_name") or "").strip()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    bio = (data.get("bio") or "").strip()

    if not display_name or not username or not email:
        return jsonify({"error": "Nome, usuário e e-mail são obrigatórios."}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE users
            SET username = %s, email = %s, name = %s
            WHERE id = %s AND account_type = 'developer'
        """, (username, email, display_name, user_id))

        cursor.execute("""
            UPDATE developer_profiles
            SET display_name = %s, bio = %s
            WHERE user_id = %s
        """, (display_name, bio, user_id))

        conn.commit()
        return jsonify({"message": "Perfil atualizado com sucesso."}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Erro ao atualizar perfil: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/change-password/<int:user_id>", methods=["PUT"])
def change_password(user_id):
    data = request.get_json()

    current_password = (data.get("current_password") or "").strip()
    new_password = (data.get("new_password") or "").strip()

    if not current_password or not new_password:
        return jsonify({"error": "Informe a senha atual e a nova senha."}), 400

    if len(new_password) < 8:
        return jsonify({"error": "A nova senha deve ter pelo menos 8 caracteres."}), 400

    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        cursor = conn.cursor()

        cursor.execute("SELECT password_hash FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()

        if not row:
            return jsonify({"error": "Usuário não encontrado."}), 404

        if not bcrypt.check_password_hash(row[0], current_password):
            return jsonify({"error": "Senha atual incorreta."}), 401

        new_hash = bcrypt.generate_password_hash(new_password).decode("utf-8")

        cursor.execute("""
            UPDATE users
            SET password_hash = %s
            WHERE id = %s
        """, (new_hash, user_id))

        conn.commit()
        return jsonify({"message": "Senha alterada com sucesso."}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Erro ao alterar senha: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/user/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT 
                u.id,
                u.name,
                u.username,
                u.email,
                u.account_type,
                pp.bio AS player_bio,
                dp.bio AS developer_bio
            FROM users u
            LEFT JOIN player_profiles pp ON pp.user_id = u.id
            LEFT JOIN developer_profiles dp ON dp.user_id = u.id
            WHERE u.id = %s
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Usuário não encontrado."}), 404

        # 👇 lógica pra escolher a bio certa
        user["bio"] = user["developer_bio"] if user["account_type"] == "developer" else user["player_bio"]

        user.pop("player_bio", None)
        user.pop("developer_bio", None)

        return jsonify(user), 200

    except Exception as e:
        return jsonify({"error": f"Erro ao buscar usuário: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@app.route("/api/user/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        data = request.get_json()

        name = (data.get("display_name") or "").strip()
        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip().lower()
        bio = (data.get("bio") or "").strip()

        if not name or not username or not email:
            return jsonify({"error": "Preencha nome, usuário e email."}), 400

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, account_type
            FROM users
            WHERE id = %s
        """, (user_id,))
        current_user = cursor.fetchone()

        if not current_user:
            return jsonify({"error": "Usuário não encontrado."}), 404

        cursor.execute("""
            SELECT id
            FROM users
            WHERE (username = %s OR email = %s) AND id <> %s
        """, (username, email, user_id))
        existing = cursor.fetchone()

        if existing:
            return jsonify({"error": "Username ou email já está em uso."}), 409

        cursor.execute("""
            UPDATE users
            SET name = %s, username = %s, email = %s
            WHERE id = %s
        """, (name, username, email, user_id))

        if current_user["account_type"] == "developer":
            cursor.execute("""
                UPDATE developer_profiles
                SET display_name = %s, bio = %s
                WHERE user_id = %s
            """, (name, bio, user_id))
        else:
            cursor.execute("""
                UPDATE player_profiles
                SET display_name = %s, bio = %s
                WHERE user_id = %s
            """, (name, bio, user_id))

        conn.commit()

        return jsonify({
            "message": "Perfil atualizado com sucesso.",
            "user": {
                "id": user_id,
                "name": name,
                "username": username,
                "email": email,
                "account_type": current_user["account_type"],
                "bio": bio
            }
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Erro ao atualizar usuário: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()

@app.route("/api/profile/preferences/<int:user_id>", methods=["PUT"])
def update_preferences(user_id):
    conn = get_connection()
    if not conn:
        return jsonify({"error": "Erro de conexão com o banco."}), 500

    try:
        data = request.get_json()
        favorite_genres = data.get("favorite_genres", [])

        if isinstance(favorite_genres, list):
            favorite_genres_str = ", ".join(favorite_genres)
        else:
            favorite_genres_str = str(favorite_genres)

        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT account_type
            FROM users
            WHERE id = %s
        """, (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "Usuário não encontrado."}), 404

        if user["account_type"] == "developer":
            cursor.execute("""
                UPDATE developer_profiles
                SET favorite_genres = %s
                WHERE user_id = %s
            """, (favorite_genres_str, user_id))
        else:
            cursor.execute("""
                UPDATE player_profiles
                SET favorite_genres = %s
                WHERE user_id = %s
            """, (favorite_genres_str, user_id))

        conn.commit()

        return jsonify({
            "message": "Preferências salvas com sucesso.",
            "favorite_genres": favorite_genres
        }), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Erro ao salvar preferências: {str(e)}"}), 500

    finally:
        cursor.close()
        conn.close()        

if __name__ == "__main__":
    app.run(debug=True)