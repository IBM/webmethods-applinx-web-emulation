#!/usr/bin/env bash
set -euo pipefail

echo "saving artifact image"
echo "pwd"
pwd

echo "Login to ICR registry"
docker login uk.icr.io/dev-applinx-icr -u "$(get_env applinx-icrio-docker-user)" -p "$(get_env dastscan-api-key)"

BRANCH=latest

echo "docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH"
docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH

IMAGE="uk.icr.io/dev-applinx-icr/applinx-web-emulation"
DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH | awk -F@ '{print $2}')"
IMAGE_TAG=$BRANCH

echo "save-artifact"
save_artifact app-image \
    type=image \
    name="${IMAGE}" \
    digest="${DIGEST}" \
    tags="${IMAGE_TAG}"
