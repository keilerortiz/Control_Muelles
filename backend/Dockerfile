FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential unixodbc-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

COPY . .

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH=/home/app/.local/bin:$PATH
ENV WEB_CONCURRENCY=4
ENV GUNICORN_TIMEOUT=60
ENV GUNICORN_KEEP_ALIVE=5

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl gnupg ca-certificates unixodbc \
  && install -d /usr/share/keyrings \
  && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
    | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
  && . /etc/os-release \
  && curl -fsSL "https://packages.microsoft.com/config/debian/${VERSION_ID}/prod.list" \
    > /etc/apt/sources.list.d/mssql-release.list \
  && apt-get update \
  && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
  && apt-get purge -y --auto-remove curl gnupg \
  && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --shell /usr/sbin/nologin app

COPY --from=builder --chown=app:app /root/.local /home/app/.local
COPY --from=builder --chown=app:app /app /app

USER app

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/ready', timeout=3).read()" || exit 1

CMD gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  -w "${WEB_CONCURRENCY}" \
  --bind 0.0.0.0:8000 \
  --timeout "${GUNICORN_TIMEOUT}" \
  --keep-alive "${GUNICORN_KEEP_ALIVE}" \
  --access-logfile - \
  --error-logfile -
