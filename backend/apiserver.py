import os
from flask import Flask, request, jsonify
import pymysql

# Config from env vars or defaults
DB_HOST = os.getenv("DB_HOST", "10.32.0.21")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "root")
DB_NAME = os.getenv("DB_NAME", "NOTES")

app = Flask(__name__)

def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASS,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

# -------------------- CRUD Routes --------------------

# Get all notes (filename + content)
@app.route("/notes", methods=["GET"])
def get_notes():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT filename, content FROM notes")
            rows = cursor.fetchall()
        return jsonify(rows), 200
    finally:
        conn.close()

# Get a single note by filename
@app.route("/notes/<filename>", methods=["GET"])
def get_note(filename):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT filename, content FROM notes WHERE filename=%s", (filename,))
            row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Note not found"}), 404
        return jsonify(row), 200
    finally:
        conn.close()

# Create a new note
@app.route("/notes", methods=["POST"])
def create_note():
    data = request.get_json(force=True)
    filename = data.get("filename")
    content = data.get("content", "")

    if not filename:
        return jsonify({"error": "filename is required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO notes (filename, content) VALUES (%s, %s)", (filename, content))
        conn.commit()
        return jsonify({"message": "Note created"}), 201
    except pymysql.err.IntegrityError:
        return jsonify({"error": "Filename already exists"}), 409
    finally:
        conn.close()

# Update a note
@app.route("/notes/<filename>", methods=["PUT", "PATCH"])
def update_note(filename):
    data = request.get_json(force=True)
    content = data.get("content")

    if content is None:
        return jsonify({"error": "content is required"}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE notes SET content=%s WHERE filename=%s", (content, filename))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Note not found"}), 404
        return jsonify({"message": "Note updated"}), 200
    finally:
        conn.close()

# Delete a note
@app.route("/notes/<filename>", methods=["DELETE"])
def delete_note(filename):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM notes WHERE filename=%s", (filename,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({"error": "Note not found"}), 404
        return jsonify({"message": "Note deleted"}), 200
    finally:
        conn.close()

# ------------------------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
