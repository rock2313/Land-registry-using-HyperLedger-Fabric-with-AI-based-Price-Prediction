#!/bin/bash
# Create and join channel
# This script creates the landregistry channel and joins peers

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          Creating and Joining Channel                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

export CHANNEL_NAME=landregistry
export FABRIC_CFG_PATH=$PWD/config

# Verify prerequisites
echo "Checking prerequisites..."

# Check if artifacts exist
if [ ! -f "./config/${CHANNEL_NAME}.tx" ]; then
    echo "Error: Channel transaction file not found!"
    echo "Please run './scripts/1-setup-network.sh' first"
    exit 1
fi

if [ ! -f "./config/Org1MSPanchors.tx" ] || [ ! -f "./config/Org2MSPanchors.tx" ]; then
    echo "Error: Anchor peer configuration files not found!"
    echo "Please run './scripts/1-setup-network.sh' first"
    exit 1
fi

# Check if containers are running
if ! docker ps | grep -q "cli"; then
    echo "Error: CLI container not running"
    echo "Please run './scripts/1-setup-network.sh' first"
    exit 1
fi

echo "✓ All prerequisites met"
echo ""

# Test orderer connectivity
echo "Testing orderer connectivity..."
if ! docker exec cli peer channel list -o orderer.landregistry.com:7050 \
    --tls \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
    2>&1 | grep -q "Channels peers has joined:"; then
    echo "Warning: Unable to connect to orderer. Waiting 10 more seconds..."
    sleep 10
fi

echo "✓ Orderer is accessible"
echo ""

# Create channel
echo "Step 1: Creating channel '$CHANNEL_NAME'..."
docker exec cli peer channel create \
  -o orderer.landregistry.com:7050 \
  -c $CHANNEL_NAME \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/config/${CHANNEL_NAME}.tx \
  --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/${CHANNEL_NAME}.block \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem

if [ $? -ne 0 ]; then
    echo ""
    echo "Error: Failed to create channel"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check orderer logs: docker logs orderer.landregistry.com"
    echo "2. Verify genesis block exists: ls -lh config/genesis.block"
    echo "3. Check if orderer is properly initialized"
    echo "4. Verify configtx.yaml has both Org1 and Org2 in TwoOrgsChannel profile"
    exit 1
fi

echo "✓ Channel created successfully"
echo ""
sleep 5

# Join Org1 peer to channel
echo "Step 2: Joining Org1 peer to channel..."
docker exec cli peer channel join -b ${CHANNEL_NAME}.block

if [ $? -ne 0 ]; then
    echo "Error: Failed to join Org1 peer to channel"
    docker logs peer0.org1.landregistry.com 2>&1 | tail -n 20
    exit 1
fi

echo "✓ Org1 peer joined channel"
echo ""

# Verify Org1 joined
echo "Verifying Org1 channel membership..."
docker exec cli peer channel list
echo ""

# Join Org2 peer to channel
echo "Step 3: Joining Org2 peer to channel..."
docker exec \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/users/Admin@org2.landregistry.com/msp \
  -e CORE_PEER_ADDRESS=peer0.org2.landregistry.com:9051 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  cli peer channel join -b ${CHANNEL_NAME}.block

if [ $? -ne 0 ]; then
    echo "Error: Failed to join Org2 peer to channel"
    docker logs peer0.org2.landregistry.com 2>&1 | tail -n 20
    exit 1
fi

echo "✓ Org2 peer joined channel"
echo ""

# Verify Org2 joined
echo "Verifying Org2 channel membership..."
docker exec \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/users/Admin@org2.landregistry.com/msp \
  -e CORE_PEER_ADDRESS=peer0.org2.landregistry.com:9051 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  cli peer channel list
echo ""

sleep 3

# Update anchor peers for Org1
echo "Step 4: Updating anchor peers for Org1..."
docker exec cli peer channel update \
  -o orderer.landregistry.com:7050 \
  -c $CHANNEL_NAME \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/config/Org1MSPanchors.tx \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem

if [ $? -ne 0 ]; then
    echo "Warning: Failed to update Org1 anchor peers (this may not be critical)"
else
    echo "✓ Org1 anchor peers updated"
fi
echo ""

sleep 2

# Update anchor peers for Org2
echo "Step 5: Updating anchor peers for Org2..."
docker exec \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/users/Admin@org2.landregistry.com/msp \
  -e CORE_PEER_ADDRESS=peer0.org2.landregistry.com:9051 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  cli peer channel update \
  -o orderer.landregistry.com:7050 \
  -c $CHANNEL_NAME \
  -f /opt/gopath/src/github.com/hyperledger/fabric/peer/config/Org2MSPanchors.tx \
  --tls \
  --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem

if [ $? -ne 0 ]; then
    echo "Warning: Failed to update Org2 anchor peers (this may not be critical)"
else
    echo "✓ Org2 anchor peers updated"
fi
echo ""

# Final verification
echo "═══════════════════════════════════════════════════════════"
echo "Final Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Org1 channels:"
docker exec cli peer channel list

echo ""
echo "Org2 channels:"
docker exec \
  -e CORE_PEER_ADDRESS=peer0.org2.landregistry.com:9051 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  cli peer channel list

echo ""
echo "Channel info:"
docker exec cli peer channel getinfo -c $CHANNEL_NAME

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Channel Setup Complete Successfully!              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary:"
echo "  ✓ Channel '$CHANNEL_NAME' created"
echo "  ✓ Org1 peer joined channel"
echo "  ✓ Org2 peer joined channel"
echo "  ✓ Anchor peers configured"
echo ""
echo "Next step: Run './scripts/3-deploy-property-chaincode.sh'"
echo ""
echo "To verify anytime, run:"
echo "  docker exec cli peer channel list"