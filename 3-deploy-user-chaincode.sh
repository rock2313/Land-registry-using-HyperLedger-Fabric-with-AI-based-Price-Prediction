#!/bin/bash
set -e

echo "=== Deploying User Chaincode ==="

export CHANNEL_NAME=landregistry
export CHAINCODE_NAME=user-contract
export CHAINCODE_VERSION=1.0
export SEQUENCE=1

# Package
docker exec cli peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz \
  --path /opt/gopath/src/github.com/chaincode/user-contract \
  --lang golang \
  --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}

# Install on Org1
docker exec cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Install on Org2
docker exec \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/users/Admin@org2.landregistry.com/msp \
  -e CORE_PEER_ADDRESS=peer0.org2.landregistry.com:9051 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  cli peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Get package ID
export PACKAGE_ID=$(docker exec cli peer lifecycle chaincode queryinstalled | grep ${CHAINCODE_NAME}_${CHAINCODE_VERSION} | awk '{print $3}' | sed 's/,$//')

# Approve for Org1
docker exec cli peer lifecycle chaincode approveformyorg \
  -o orderer.landregistry.com:7050 \
  --channelID $CHANNEL_NAME \
  --name $CHAINCODE_NAME \
  --version $CHAINCODE_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $SEQUENCE \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem

# Approve for Org2
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

# Commit
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

echo "✅ User chaincode deployed!"
