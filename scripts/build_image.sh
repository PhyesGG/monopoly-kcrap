#!/bin/sh
# Build the production Docker image
IMAGE_NAME=${1:-monopoly-kcrap:latest}
docker build -t $IMAGE_NAME .
