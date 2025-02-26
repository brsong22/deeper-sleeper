FROM python:3.9 AS dev
# install some networking utils
RUN apt-get update && apt-get install -y \
    iputils-ping \
    dnsutils \
    telnet \
    net-tools \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app/api
COPY ./requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt
COPY . .
WORKDIR /app
CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM python:3.9-alpine AS prod_builder
ENV PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    PIP_NO_CACHE_DIR=on \
    PIP_DISABLE_PIP_VERSION_CHECK=on
WORKDIR /app/api
COPY ./requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.9-alpine AS prod
RUN addgroup --system api && adduser --system --ingroup api api
WORKDIR /app/api
COPY . .
COPY --from=prod_builder /install /usr/local
RUN chown -R api:api /app/api
USER api
EXPOSE 8000
WORKDIR /app
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-w", "4", "-b", "0.0.0.0:8000", "api.main:app"]