FROM python:3.9

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