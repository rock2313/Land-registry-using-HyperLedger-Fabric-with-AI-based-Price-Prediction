#!/bin/bash
# Test All Chaincodes
# This script runs comprehensive tests on all deployed chaincodes

set -e

echo "=== Testing All Chaincodes ==="

export CHANNEL_NAME=landregistry

# First, check what chaincodes are installed
echo "===== Checking installed chaincodes ====="
docker exec cli peer lifecycle chaincode querycommitted -C $CHANNEL_NAME

echo ""
echo "============================================"
echo "1. Testing User Chaincode"
echo "============================================"

# Register a user
echo ""
echo "1.1 Registering a user..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n user-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"RegisterUser","Args":["USER001","Alice Smith","alice@example.com","9876543210","1234-5678-9012","ABCDE1234F","123 Main Street","USER","0x1234567890abcdef","hashedpassword123"]}'

echo "Waiting for transaction to be committed..."
sleep 5

# Query the user
echo ""
echo "1.2 Querying user..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n user-contract \
  -c '{"function":"GetUser","Args":["USER001"]}'

echo ""
echo "============================================"
echo "2. Testing Property Chaincode"
echo "============================================"

# Register a property
echo ""
echo "2.1 Registering a property..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n property-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"RegisterProperty","Args":["PROP001","USER001","Alice Smith","Tirupati, Andhra Pradesh","1500.5","2500000","RESIDENTIAL","Beautiful residential plot","13.6288","79.4192"]}'

echo "Waiting for transaction to be committed..."
sleep 5

# Query the property
echo ""
echo "2.2 Querying property..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n property-contract \
  -c '{"function":"GetProperty","Args":["PROP001"]}'

# Verify property (as admin)
echo ""
echo "2.3 Verifying property..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n property-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"VerifyProperty","Args":["PROP001","ADMIN001"]}'

sleep 5

# Query all properties
echo ""
echo "2.4 Querying all properties..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n property-contract \
  -c '{"function":"GetAllProperties","Args":[]}'

echo ""
echo "============================================"
echo "3. Testing Offer Chaincode"
echo "============================================"

# Create an offer
echo ""
echo "3.1 Creating offer..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n offer-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"CreateOffer","Args":["OFFER001","PROP001","USER002","Bob Johnson","USER001","Alice Smith","2400000","Interested in buying this property"]}'

echo "Waiting for transaction to be committed..."
sleep 5

# Query the offer
echo ""
echo "3.2 Querying offer..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n offer-contract \
  -c '{"function":"GetOffer","Args":["OFFER001"]}'

# Accept the offer
echo ""
echo "3.3 Accepting offer (seller)..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n offer-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"AcceptOffer","Args":["OFFER001"]}'

sleep 5

# Admin verify the offer
echo ""
echo "3.4 Admin verifying offer..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n offer-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"AdminVerifyOffer","Args":["OFFER001","ADMIN001","0xabcdef1234567890"]}'

sleep 5

# Query updated offer
echo ""
echo "3.5 Querying updated offer..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n offer-contract \
  -c '{"function":"GetOffer","Args":["OFFER001"]}'

# Get pending admin verifications
echo ""
echo "3.6 Querying pending admin verifications..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n offer-contract \
  -c '{"function":"GetPendingAdminVerifications","Args":[]}'

echo ""
echo "============================================"
echo "4. Testing Escrow Chaincode"
echo "============================================"

# Create escrow
echo ""
echo "4.1 Creating escrow..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n escrow-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"CreateEscrow","Args":["ESC001","PROP001","USER002","USER001","2400000"]}'

echo "Waiting for transaction to be committed..."
sleep 5

# Query escrow status
echo ""
echo "4.2 Querying escrow status..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n escrow-contract \
  -c '{"function":"GetEscrow","Args":["ESC001"]}'

# Fund escrow
echo ""
echo "4.3 Funding escrow..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n escrow-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"FundEscrow","Args":["ESC001","0x1234567890abcdef"]}'

sleep 5

# Release escrow
echo ""
echo "4.4 Releasing escrow..."
docker exec cli peer chaincode invoke \
  -o orderer.landregistry.com:7050 \
  -C $CHANNEL_NAME \
  -n escrow-contract \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/landregistry.com/orderers/orderer.landregistry.com/msp/tlscacerts/tlsca.landregistry.com-cert.pem \
  --peerAddresses peer0.org1.landregistry.com:7051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.landregistry.com/peers/peer0.org1.landregistry.com/tls/ca.crt \
  --peerAddresses peer0.org2.landregistry.com:9051 \
  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.landregistry.com/peers/peer0.org2.landregistry.com/tls/ca.crt \
  -c '{"function":"ReleaseEscrow","Args":["ESC001","0xfedcba0987654321"]}'

sleep 5

# Query final escrow status
echo ""
echo "4.5 Querying final escrow status..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n escrow-contract \
  -c '{"function":"GetEscrow","Args":["ESC001"]}'

# Get all escrows
echo ""
echo "4.6 Querying all escrows..."
docker exec cli peer chaincode query \
  -C $CHANNEL_NAME \
  -n escrow-contract \
  -c '{"function":"GetAllEscrows","Args":[]}'

echo ""
echo "============================================"
echo "✅ All Chaincode Tests Completed Successfully!"
echo "============================================"
echo ""
echo "Summary:"
echo "- User Chaincode: ✅ User registered and queried"
echo "- Property Chaincode: ✅ Property registered, verified, and queried"
echo "- Offer Chaincode: ✅ Offer created, accepted, and admin verified"
echo "- Escrow Chaincode: ✅ Escrow created, funded, and released"
echo ""
echo "The system is ready for use!"