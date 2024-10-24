#!/bin/bash

# Check if the correct number of arguments is provided
if [ $# -ne 1 ]; then
  echo "Usage: $0 <path_to_env_file>"
  exit 1
fi

# Get the .env file from the argument
ENV_FILE=$1

# Load environment variables from the specified .env file
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  echo ".env file not found at: $ENV_FILE"
  exit 1
fi

# Set the project based on the filename
FILENAME=$(basename "$ENV_FILE")

# Determine the PROJECT_ID based on the filename
if [[ "$FILENAME" == *"sandbox.env" ]]; then
  PROJECT_ID="awell-sandbox"
  DATABASE_NAME="sandbox-pg"
elif [[ "$FILENAME" == *"us.env" ]]; then
  PROJECT_ID="awell-production-us"
  DATABASE_NAME="us-tasks"
elif [[ "$FILENAME" == *"eu.env" ]]; then
  PROJECT_ID="awell-production"
  DATABASE_NAME="eu-tasks"
else
  echo "Cannot determine the PROJECT_ID from the filename. Expected 'sandbox', 'us', or 'eu' in the filename."
  exit 1
fi

# Build the application
echo "Building the application..."
yarn run build

docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/awell-experiments/task-management-backend/backend:latest --push .

# Deploy
echo "Deploying Task management..."

gcloud run deploy $CONTAINER_NAME \
    --project=$PROJECT_ID \
    --image=us-central1-docker.pkg.dev/awell-experiments/task-management-backend/backend:latest \
    --platform=managed \
    --region=us-central1 \
    --add-cloudsql-instances=$PROJECT_ID:us-central1:$DATABASE_NAME \
    --port=8080 \
    --allow-unauthenticated \
    --set-env-vars $(grep -v '^PORT=' "$ENV_FILE" | tr '\n' ',') \
    --set-secrets DATABASE_URL="$DATABASE_CONNECTION_STRING_SECRET_NAME:latest"

if [ $? -ne 0 ]; then
  echo "Failed to deploy the task management application to $CONTAINER_NAME."
  exit 1
fi

echo "Task Management deployed successfully to $CONTAINER_NAME."