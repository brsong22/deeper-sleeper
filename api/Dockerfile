FROM python:3.9
WORKDIR /app/api
COPY ./requirements.txt .
RUN pip install --no-cache-dir --upgrade -r requirements.txt
COPY . .
# COPY ../commands /app/commands # need to move this folder into context or change context
CMD ["fastapi", "dev", "main.py", "--host", "0.0.0.0", "--port", "8000", "--reload"]