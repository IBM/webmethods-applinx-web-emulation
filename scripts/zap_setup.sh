#!/usr/bin/env bash
set -euo pipefail

echo "saving artifact image"
echo "pwd"
pwd

echo "Login to ICR registry"
docker login uk.icr.io/dev-applinx-icr -u "$(get_env applinx-icrio-docker-user)" -p "$(get_env dastscan-api-key)"

BRANCH=v1

echo "docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH"
docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation@sha256:ab3742200ff9127a1b97518c0b79fcf7ff2145300976c3d6e40e356f4bf73479

IMAGE="uk.icr.io/dev-applinx-icr/applinx-web-emulation@sha256:ab3742200ff9127a1b97518c0b79fcf7ff2145300976c3d6e40e356f4bf73479"
DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' $IMAGE | awk -F@ '{print $2}')"
IMAGE_TAG=$BRANCH

echo "save-artifact"
save_artifact app-image \
    type=image \
    name="${IMAGE}" \
    digest="${DIGEST}" \
    tags="${IMAGE_TAG}"
