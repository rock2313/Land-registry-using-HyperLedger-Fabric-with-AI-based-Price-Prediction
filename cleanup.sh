#!/bin/bash
# Cleanup script
# This script stops and removes all containers, networks, and generated files

set -e

echo "=== Cleaning up Hyperledger Fabric Network ==="

cd "$(dirname "$0")/.."

# Stop and remove containers
echo "Stopping and removing containers..."
docker-compose down -v

# Remove generated crypto materials
echo "Removing crypto materials..."
rm -rf crypto-config

# Remove generated config files
echo "Removing generated config files..."
rm -rf config

# Remove chaincode packages
echo "Removing chaincode packages..."
docker exec cli rm -f *.tar.gz 2>/dev/null || true

# Remove docker volumes
echo "Removing docker volumes..."
docker volume prune -f

echo "=== Cleanup complete ==="
echo "Run './scripts/1-setup-network.sh' to start fresh"
