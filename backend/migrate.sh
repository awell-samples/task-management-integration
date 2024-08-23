#!/bin/sh
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/awell-experiments/task-management-backend/migrate:latest -f ./Dockerfile.migrate --push .
gcloud run jobs execute task-management-migrate --project awell-sandbox --region us-central1