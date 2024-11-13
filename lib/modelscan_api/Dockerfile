FROM python:3.12-slim

WORKDIR /app

# curl is used by the health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt /app/requirements.txt

RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

COPY ./bailo_modelscan_api /app/bailo_modelscan_api

CMD ["fastapi", "run", "bailo_modelscan_api/main.py", "--port", "80"]
