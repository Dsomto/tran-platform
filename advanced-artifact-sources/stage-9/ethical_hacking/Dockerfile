FROM python:3.12-alpine
WORKDIR /app
COPY estate.py /app/estate.py
RUN adduser -D -u 10001 range
USER range
ENTRYPOINT ["python3", "/app/estate.py"]
