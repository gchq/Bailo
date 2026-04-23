#!/usr/bin/env bash
set -euo pipefail

MODEL_ID=testss-seru1v
IMAGE_NAME=alpine:3.23.3
ECR_REGISTRY=537923540119.dkr.ecr.eu-west-2.amazonaws.com
ECR_MIRROR=${ECR_REGISTRY}/bailo-dockerhub/library

docker version
docker buildx version

# Ensure buildx builder exists
if ! docker buildx inspect mp-builder >/dev/null 2>&1; then
  docker buildx create --name mp-builder --use
else
  docker buildx use mp-builder
fi

# Verify AWS credentials
aws sts get-caller-identity

# Login to ECR
aws ecr get-login-password --region eu-west-2 \
  | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Inspect remote manifest list
docker buildx imagetools inspect ${ECR_MIRROR}/${IMAGE_NAME}

# Copy multi-platform image
docker buildx imagetools create \
  --tag localhost:8080/${MODEL_ID}/${IMAGE_NAME} \
  ${ECR_MIRROR}/${IMAGE_NAME}

# Verify push
docker buildx imagetools inspect localhost:8080/${MODEL_ID}/${IMAGE_NAME}
