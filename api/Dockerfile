FROM python:3.9
WORKDIR /app/api
COPY ./api/requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt
COPY ./api .
CMD ["fastapi", "dev", "main.py", "--host", "0.0.0.0", "--port", "8000", "--reload"]