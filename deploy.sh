#!/bin/bash
set -e

echo "Pulling latest changes..."
git pull origin main

echo "Building and starting Docker containers..."
docker compose up -d --build

echo "Deployment finished! Run 'docker compose logs -f' to view logs."
