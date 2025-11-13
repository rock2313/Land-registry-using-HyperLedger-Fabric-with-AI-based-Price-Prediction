# LandChain Backend Server

This is the **missing piece** - the backend server that connects the React frontend to Hyperledger Fabric.

## Architecture

```
Frontend (React :5173)
    ↓ HTTP API calls
Backend Server (Node.js :3001)
    ↓ Fabric SDK
Hyperledger Fabric Network
    ↓
Chaincodes (Go)
```

## Features

- ✅ REST API for frontend
- ✅ Connects to Hyperledger Fabric using Fabric SDK
- ✅ **Automatic fallback to MOCK MODE** if Fabric is not running
- ✅ CORS enabled for frontend
- ✅ Transaction tracking
- ✅ Automatic chaincode invocation

## Installation

```bash
cd backend
npm install
```

## Running the Server

### Option 1: With Fabric Network Running
```bash
# Make sure Fabric network is running first
cd ..
./1-start-network.sh

# Then start backend
cd backend
npm start
```

Server will connect to Fabric and show:
```
✅ Connected to Fabric network successfully!
Mode: ✅ FABRIC CONNECTED
```

### Option 2: Without Fabric (Mock Mode)
```bash
cd backend
npm start
```

Server will automatically run in MOCK MODE:
```
⚠️  Running in MOCK MODE
Mode: ⚠️  MOCK (no Fabric)
```

In mock mode:
- Data is stored in memory
- Transactions are simulated
- Perfect for frontend development/testing
- No blockchain required

## API Endpoints

### Health Check
```bash
GET http://localhost:3001/api/health
```

### User APIs
```bash
# Register user
POST http://localhost:3001/api/users/register
Body: {
  userId, name, email, phone, aadhar, pan,
  address, role, walletAddress, passwordHash
}

# Get user
GET http://localhost:3001/api/users/:userId
```

### Property APIs
```bash
# Register property
POST http://localhost:3001/api/properties/register
Body: {
  propertyId, owner, ownerName, location, area,
  price, propertyType, description, latitude, longitude
}

# Get all properties
GET http://localhost:3001/api/properties

# Get specific property
GET http://localhost:3001/api/properties/:propertyId
```

### Offer APIs
```bash
# Create offer
POST http://localhost:3001/api/offers/create
Body: {
  offerId, propertyId, buyerId, buyerName,
  sellerId, sellerName, offerAmount, message
}

# Get all offers
GET http://localhost:3001/api/offers

# Accept offer
PUT http://localhost:3001/api/offers/:offerId/accept
```

### Transaction APIs
```bash
# Get all transactions
GET http://localhost:3001/api/transactions
```

## Testing the Server

### 1. Check if server is running
```bash
curl http://localhost:3001/api/health
```

### 2. Register a test property
```bash
curl -X POST http://localhost:3001/api/properties/register \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "PROP_TEST_001",
    "owner": "USER_001",
    "ownerName": "Test User",
    "location": "Mumbai, Maharashtra",
    "area": 2500,
    "price": 5000000,
    "propertyType": "Residential",
    "description": "Test property",
    "latitude": 0,
    "longitude": 0
  }'
```

### 3. Get all properties
```bash
curl http://localhost:3001/api/properties
```

### 4. Get all transactions
```bash
curl http://localhost:3001/api/transactions
```

## Configuration

Edit `server.js` to configure:
- Port (default: 3001)
- Fabric connection profile path
- Wallet path
- Channel name
- Chaincode name

## Development Mode

For auto-restart on file changes:
```bash
npm run dev
```

## Troubleshooting

### Server runs but shows "MOCK MODE"
This means Fabric network is not running or connection failed. This is NORMAL and expected for development. The server will work in mock mode.

### Cannot connect to Fabric
1. Ensure Fabric network is running: `docker ps`
2. Check connection profile exists: `ls ../network/connection-org1.json`
3. Check wallet exists: `ls wallet/`
4. Check Fabric is accessible: `docker logs peer0.org1.example.com`

### Port already in use
Change the PORT in server.js or kill the process:
```bash
lsof -ti:3001 | xargs kill -9
```

## Next Steps

1. Start the backend server
2. Update frontend to call backend APIs
3. Test complete flow: register → property → offer → transaction

The backend will handle ALL Fabric communication. Frontend just needs to make HTTP calls!
