#!/bin/bash
# Deploy All - Complete Deployment Script
# This script runs all deployment steps in sequence

set -e

SCRIPT_DIR="$(dirname "$0")"

echo "========================================="
echo "  Hyperledger Fabric Complete Deployment"
echo "========================================="
echo ""

# Step 1: Setup Network
echo "=== Step 1/5: Setting up network ==="
bash "$SCRIPT_DIR/1-setup-network.sh"
echo ""

# Step 2: Create Channel
echo "=== Step 2/5: Creating channel ==="
bash "$SCRIPT_DIR/2-create-channel.sh"
echo ""

# Step 3: Deploy Property Chaincode
echo "=== Step 3/5: Deploying property chaincode ==="
bash "$SCRIPT_DIR/3-deploy-property-chaincode.sh"
echo ""

# Step 4: Deploy Escrow Chaincode
echo "=== Step 4/5: Deploying escrow chaincode ==="
bash "$SCRIPT_DIR/4-deploy-escrow-chaincode.sh"
echo ""

# Step 5: Test Chaincodes
echo "=== Step 5/5: Testing chaincodes ==="
bash "$SCRIPT_DIR/5-test-chaincodes.sh"
echo ""

echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "Network is ready to use."
echo "You can now integrate with your frontend application."
echo ""
echo "To view logs: docker-compose logs -f"
echo "To cleanup: ./scripts/cleanup.sh"
