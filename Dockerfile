FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY backend/requirements.txt ./backend/requirements.txt

RUN pip install --upgrade pip && \
    pip install -r backend/requirements.txt

COPY . .

WORKDIR /app/backend

RUN mkdir -p uploads

EXPOSE 5000

CMD ["python", "server_simple.py"]
