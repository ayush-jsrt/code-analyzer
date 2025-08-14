from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import time
import boto3
from botocore.exceptions import ClientError

app = Flask(__name__)
CORS(app)

MODEL_ID = "us.anthropic.claude-sonnet-4-20250514-v1:0"
client = boto3.client("bedrock-runtime", region_name="us-east-1")

DB_CONFIG = {
    'host': 'mysql.code-analyzer.svc.cluster.local',  # or '10.32.0.21'
    'user': 'root',
    'password': 'root',
    'database': 'NOTES'
}

def get_connection(retries=30, delay=2):
    for attempt in range(retries):
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            if conn.is_connected():
                return conn
        except Error as e:
            print(f"[DB] Attempt {attempt+1}/{retries} failed: {e}")
        time.sleep(delay)
    raise Exception("MySQL not available after retries")

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

@app.route('/invoke', methods=['POST'])
def invoke_sonnet():
    try:
        data = request.get_json()
        if not data or 'inputText' not in data:
            return jsonify({"error": "Missing 'inputText' in request body"}), 400

        payload = {
            "inputText": data['inputText'],
        }

        response = client.invoke_model(modelId=MODEL_ID, body=json.dumps(payload))
        result = json.loads(response["body"].read())

        return jsonify({
            "message": "Invocation successful",
            "result": result
        })

    except ClientError as e:
        return jsonify({"error": f"AWS ClientError: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
