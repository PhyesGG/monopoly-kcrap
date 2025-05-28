#!/bin/sh
# Run the application container
IMAGE_NAME=${1:-monopoly-kcrap:latest}
PORT=${PORT:-3000}
docker run -p $PORT:3000 --env-file .env $IMAGE_NAME
