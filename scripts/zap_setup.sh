#!/usr/bin/env bash
set -euo pipefail

echo "saving artifact image"
echo "pwd"
pwd

echo "Login to ICR registry"
docker login uk.icr.io/dev-applinx-icr -u "$(get_env applinx-icrio-docker-user)" -p "$(get_env dastscan-api-key)"

BRANCH=v2

echo "docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH"
docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation@sha256:ba68c50d333e1fd360f9d2406633e64025f7c1624516bf6b2f4cf846fb6e1815

IMAGE="uk.icr.io/dev-applinx-icr/applinx-web-emulation@sha256:ba68c50d333e1fd360f9d2406633e64025f7c1624516bf6b2f4cf846fb6e1815"
DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' $IMAGE | awk -F@ '{print $2}')"
IMAGE_TAG=$BRANCH

echo "save-artifact"
save_artifact app-image \
    type=image \
    name="${IMAGE}" \
    digest="${DIGEST}" \
    tags="${IMAGE_TAG}"
