FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY apiserver.py .

EXPOSE 5000

CMD ["python3", "apiserver.py"]
