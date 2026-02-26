#!/usr/bin/env bash
set -euo pipefail

echo "saving artifact image"
echo "pwd"
pwd

echo "Login to ICR registry"
docker login uk.icr.io/dev-applinx-icr -u "$(get_env applinx-icrio-docker-user)" -p "$(get_env dastscan-api-key)"

BRANCH=v2

echo "docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH"
docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation@sha256:6533d1800ec0c4b9a82f4aec5c628123653935f19268d8aceed66f8fbca8d7ec

IMAGE="uk.icr.io/dev-applinx-icr/applinx-web-emulation@sha256:6533d1800ec0c4b9a82f4aec5c628123653935f19268d8aceed66f8fbca8d7ec"
DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' $IMAGE | awk -F@ '{print $2}')"
IMAGE_TAG=$BRANCH

echo "save-artifact"
save_artifact app-image \
    type=image \
    name="${IMAGE}" \
    digest="${DIGEST}" \
    tags="${IMAGE_TAG}"
