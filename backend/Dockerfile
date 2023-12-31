ARG PYTHON_VER=3.11

FROM python:${PYTHON_VER} AS base

WORKDIR /app

ENV PYTHONUNBUFFERED=1

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | POETRY_HOME=/opt/poetry python && \
    cd /usr/local/bin && \
    ln -s /opt/poetry/bin/poetry && \
    poetry config virtualenvs.create false

COPY ./pyproject.toml ./poetry.lock* /app/

RUN poetry install --no-root

COPY . /app

FROM python:3.11-slim

RUN apt-get update -y && apt-get upgrade -y && \
    apt-get -y install libgomp1 && \
    apt-get -y install libc-dev && \
    apt-get -y install build-essential

WORKDIR /app

COPY --from=base /app /app
COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=base /usr/local/bin /usr/local/bin

CMD uvicorn --host 0.0.0.0 --port 8000 main:app
