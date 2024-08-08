#!/bin/sh
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/awell-experiments/task-management-backend/backend:latest .
docker push us-central1-docker.pkg.dev/awell-experiments/task-management-backend/backend:latest
gcloud run deploy task-management-backend --project=awell-sandbox --image us-central1-docker.pkg.dev/awell-experiments/task-management-backend/backend:latest --platform managed --region us-central1 --allow-unauthenticated --set-env-vars NODE_ENV=production --port 8080
