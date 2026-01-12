#!/usr/bin/env bash

echo "saving artifact image"
set -euo pipefail

echo "pwd"
pwd

echo "Login to ICR registry"
# Login to uk.icr.io with dev-applinx-icr namespace
# Using environment variables for credentials (not hardcoded)
docker login uk.icr.io -u "$(get_env applinx-icrio-docker-user)" -p "$(get_env dastscan-api-key)"

# Set branch/tag to pull
BRANCH=main

echo "docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH"
docker pull uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH

# Image details
IMAGE="uk.icr.io/dev-applinx-icr/applinx-web-emulation"
DIGEST="$(docker inspect --format='{{index .RepoDigests 0}}' uk.icr.io/dev-applinx-icr/applinx-web-emulation:$BRANCH | awk -F@ '{print $2}')"
IMAGE_TAG=$BRANCH

echo "save-artifact"
save_artifact app-image \
    type=image \
    name="uk.icr.io/dev-applinx-icr/applinx-web-emulation" \
    "digest=${DIGEST}" \
    "tags=${IMAGE_TAG}"

    ---------------------------------
