#!/bin/bash
# Deploy Escrow Chaincode
# This script packages, installs, approves and commits the escrow chaincode

set -e

echo "=== Deploying Escrow Chaincode ==="

export CHANNEL_NAME=landregistry
export CHAINCODE_NAME=escrow-contract
export CHAINCODE_VERSION=1.0
export SEQUENCE=1

# Package chaincode
echo "Step 1: Packaging chaincode..."
docker exec cli peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
  --path /opt/gopath/src/github.com/chaincode/escrow-contract \
  --lang golang \
  --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}

# Install on Org1 peer
echo "Step 2: Installing on Org1 peer..."
docker exec cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Install on Org2 peer
echo "Step 3: Installing on Org2 peer..."
docker exec \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/users/Admin@org2.landregistry.com/msp \
  -e CORE_PEER_ADDRESS=peer0.org2.landregistry.com:9051 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Get package ID
echo "Step 4: Getting package ID..."
export PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME}_${CHAINCODE_VERSION} | awk '{print $3}' | sed 's/,$//')
echo "Package ID: $PACKAGE_ID"

# Approve for Org1
echo "Step 5: Approving for Org1..."
docker exec cli peer lifecycle chaincode approveformyorg \
  -o orderer.landregistry.com:7050 \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $SEQUENCE \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem

# Approve for Org2
echo "Step 6: Approving for Org2..."
docker exec \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/users/Admin@org2.landregistry.com/msp \
  -e CORE_PEER_ADDRESS=peer0.org2.landregistry.com:9051 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  cli peer lifecycle chaincode approveformyorg \
  -o orderer.landregistry.com:7050 \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $SEQUENCE \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem

# Check commit readiness
echo "Step 7: Checking commit readiness..."
docker exec cli peer lifecycle chaincode checkcommitreadiness \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence $SEQUENCE

# Commit chaincode
echo "Step 8: Committing chaincode..."
docker exec cli peer lifecycle chaincode commit \
  -o orderer.landregistry.com:7050 \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --sequence $SEQUENCE \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt

echo "=== Escrow chaincode deployed successfully ==="
echo "Run './scripts/5-test-chaincodes.sh' to test the deployment"
