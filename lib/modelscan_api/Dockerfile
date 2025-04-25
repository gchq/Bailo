FROM python:3.12.10-slim-bookworm

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1
# Keeps Python from buffering stdout and stderr to avoid situations where the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# curl is used by the health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY ./requirements.txt /app/requirements.txt

RUN --mount=type=cache,target=/root/.cache/pip pip install --upgrade -r /app/requirements.txt

COPY ./bailo_modelscan_api /app/bailo_modelscan_api

CMD ["fastapi", "run", "bailo_modelscan_api/main.py", "--port", "3311"]
