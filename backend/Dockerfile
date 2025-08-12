FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV DB_HOST=10.32.0.21
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASS=root
ENV DB_NAME=NOTES

EXPOSE 5000
CMD ["python", "app.py"]
