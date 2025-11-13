#!/bin/bash
# Setup Hyperledger Fabric Network
# This script generates crypto materials and starts the network

set -e

echo "=== Setting up Hyperledger Fabric Network ==="

# Check if fabric binaries are installed
if ! command -v cryptogen &> /dev/null; then
    echo "Error: Hyperledger Fabric binaries not found!"
    echo "Please run: curl -sSL https://bit.ly/2ysbOFE | bash -s"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if required config files exist
if [ ! -f "crypto-config.yaml" ]; then
    echo "Error: crypto-config.yaml not found!"
    exit 1
fi

if [ ! -f "configtx.yaml" ]; then
    echo "Error: configtx.yaml not found!"
    echo "This file is required for generating genesis block and channel configurations."
    exit 1
fi

# Clean up old artifacts if they exist
echo "Cleaning up old artifacts..."
rm -rf crypto-config
rm -rf config
docker-compose down -v 2>/dev/null || true

# Generate crypto materials
echo "Step 1: Generating crypto materials..."
cryptogen generate --config=./crypto-config.yaml --output="crypto-config"

if [ ! -d "crypto-config" ]; then
    echo "Error: Failed to generate crypto materials"
    exit 1
fi

echo "✓ Crypto materials generated successfully"

# Set FABRIC_CFG_PATH to current directory so configtxgen can find configtx.yaml
export FABRIC_CFG_PATH=$PWD

# Create config directory
mkdir -p config

# Generate genesis block
echo "Step 2: Generating genesis block..."
configtxgen -profile TwoOrgsOrdererGenesis \
    -channelID system-channel \
    -outputBlock ./config/genesis.block

if [ ! -f "./config/genesis.block" ]; then
    echo "Error: Failed to generate genesis block"
    exit 1
fi

echo "✓ Genesis block generated successfully"

# Generate channel configuration
echo "Step 3: Generating channel configuration..."
export CHANNEL_NAME=landregistry
configtxgen -profile TwoOrgsChannel \
    -outputCreateChannelTx ./config/${CHANNEL_NAME}.tx \
    -channelID $CHANNEL_NAME

if [ ! -f "./config/${CHANNEL_NAME}.tx" ]; then
    echo "Error: Failed to generate channel configuration"
    exit 1
fi

echo "✓ Channel configuration generated successfully"

# Generate anchor peer updates
echo "Step 4: Generating anchor peer updates..."
configtxgen -profile TwoOrgsChannel \
    -outputAnchorPeersUpdate ./config/Org1MSPanchors.tx \
    -channelID $CHANNEL_NAME \
    -asOrg Org1MSP

configtxgen -profile TwoOrgsChannel \
    -outputAnchorPeersUpdate ./config/Org2MSPanchors.tx \
    -channelID $CHANNEL_NAME \
    -asOrg Org2MSP

if [ ! -f "./config/Org1MSPanchors.tx" ] || [ ! -f "./config/Org2MSPanchors.tx" ]; then
    echo "Error: Failed to generate anchor peer updates"
    exit 1
fi

echo "✓ Anchor peer updates generated successfully"

# Verify all artifacts are created
echo ""
echo "Verifying generated artifacts..."
ls -lh config/
echo ""

# Start the network
echo "Step 5: Starting the network..."
docker-compose up -d

# Wait for containers to start
echo "Waiting for network to start..."
sleep 15

# Check if containers are running
echo "Checking container status..."
if ! docker ps | grep -q "peer0.org1.landregistry.com"; then
    echo "Error: Org1 peer not running"
    docker-compose logs peer0.org1.landregistry.com
    exit 1
fi

if ! docker ps | grep -q "peer0.org2.landregistry.com"; then
    echo "Error: Org2 peer not running"
    docker-compose logs peer0.org2.landregistry.com
    exit 1
fi

if ! docker ps | grep -q "orderer.landregistry.com"; then
    echo "Error: Orderer not running"
    docker-compose logs orderer.landregistry.com
    exit 1
fi

if ! docker ps | grep -q "cli"; then
    echo "Error: CLI container not running"
    docker-compose logs cli
    exit 1
fi

echo ""
echo "✓ All containers are running"
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "peer|orderer|cli"
echo ""

# Test orderer connectivity
echo "Testing orderer connectivity..."
sleep 5
docker exec cli peer channel list -o orderer.landregistry.com:7050 \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
    2>&1 | head -n 5

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║            Network setup complete successfully!            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Generated artifacts:"
echo "  ✓ Crypto materials in crypto-config/"
echo "  ✓ Genesis block: config/genesis.block"
echo "  ✓ Channel tx: config/landregistry.tx"
echo "  ✓ Anchor peer configs: config/Org*MSPanchors.tx"
echo ""
echo "Running containers:"
echo "  ✓ Orderer"
echo "  ✓ Org1 Peer"
echo "  ✓ Org2 Peer"
echo "  ✓ CLI"
echo ""
echo "Next step: Run './scripts/2-create-channel.sh' to create the channel"