FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY . .

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY --from=builder /root/.local /root/.local
COPY --from=builder /app /app

ENV PATH=/root/.local/bin:$PATH

EXPOSE 8000

CMD [
  "gunicorn",
  "app.main:app",
  "-k",
  "uvicorn.workers.UvicornWorker",
  "-w",
  "4",
  "--bind",
  "0.0.0.0:8000"
]
