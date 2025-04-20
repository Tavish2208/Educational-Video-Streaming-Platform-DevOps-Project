#!/bin/bash

# Get previous working version
PREV_VERSION=$(aws ecr describe-images --repository-name your-repo --query 'imageDetails[?!contains(imageTags[0], `latest`)].[imageTags[0]]' --output text | head -n 1)

# Rollback to previous version
docker-compose down
sed -i "s/latest/$PREV_VERSION/g" docker-compose.yml
docker-compose up -d