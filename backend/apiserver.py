from flask import Flask, request, jsonify
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)

DB_CONFIG = {
    'host': 'mysql-service',  # or '10.32.0.21'
    'user': 'root',
    'password': 'root',
    'database': 'NOTES'
}

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

# Ensure table exists
def init_db():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                content TEXT NOT NULL
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
    except Error as e:
        print("Error initializing DB:", e)

@app.route('/notes', methods=['GET'])
def get_notes():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT name, content FROM notes")
        notes = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(notes)
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/notes', methods=['POST'])
def create_note():
    data = request.get_json()
    name = data.get('name')
    content = data.get('content')
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO notes (name, content) VALUES (%s, %s)", (name, content))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Note created successfully"})
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/notes/<name>', methods=['PUT'])
def update_note(name):
    data = request.get_json()
    content = data.get('content')
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE notes SET content = %s WHERE name = %s", (content, name))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Note updated successfully"})
    except Error as e:
        return jsonify({"error": str(e)}), 500

@app.route('/notes/<name>', methods=['DELETE'])
def delete_note(name):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM notes WHERE name = %s", (name,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Note deleted successfully"})
    except Error as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000)
