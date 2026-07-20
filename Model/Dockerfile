FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN addgroup --system app \
    && adduser --system --ingroup app app

COPY Model/requirements.txt /tmp/requirements.txt

RUN python -m pip install --upgrade pip \
    && python -m pip install -r /tmp/requirements.txt

COPY --chown=app:app Model/main.py \
    Model/dealer_churn_service_model.pkl \
    Model/company_churn_service_model.pkl \
    /app/Model/

COPY --chown=app:app dataset/dummy_output/dealer_churn_dummy.json \
    dataset/dummy_output/company_churn_dummy.json \
    /app/dataset/dummy_output/

USER app
WORKDIR /app/Model

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/', timeout=3)"]

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
