const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// State
let fabricMode = false;
let gateway = null;
let contract = null;

// File-based persistence
const DATA_FILE = path.join(__dirname, 'data-store.json');

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      console.log('📂 Loaded data from file:', {
        users: parsed.users?.length || 0,
        properties: parsed.properties?.length || 0,
        offers: parsed.offers?.length || 0,
        transactions: parsed.transactions?.length || 0
      });
      return parsed;
    }
  } catch (error) {
    console.error('⚠️  Error loading data file:', error.message);
  }
  return {
    users: [],
    properties: [],
    offers: [],
    transactions: [],
    escrows: []
  };
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    console.log('💾 Data saved to file');
  } catch (error) {
    console.error('⚠️  Error saving data:', error.message);
  }
}

// Auto-save every 10 seconds
setInterval(saveData, 10000);

// In-memory fallback storage (now persisted to file)
const store = loadData();

// Helper to create transactions (mock mode)
function createTransaction(type, data) {
  const transaction = {
    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    propertyId: data.propertyId || '',
    fromOwner: data.fromOwner || '',
    toOwner: data.toOwner || '',
    amount: data.amount || 0,
    status: data.status || 'COMPLETED',
    offerId: data.offerId || '',
    timestamp: new Date().toISOString(),
    type: type
  };
  store.transactions.push(transaction);
  console.log('📝 Transaction created (mock):', type, transaction.transactionId);
  saveData(); // Save immediately after transaction
  return transaction;
}

// Initialize Fabric connection
async function initFabric() {
  try {
    console.log('🔗 Attempting to connect to Hyperledger Fabric...');

    const ccpPath = path.resolve(__dirname, 'connection-profile.json');
    if (!fs.existsSync(ccpPath)) {
      console.log('⚠️  Connection profile not found. Running in MOCK mode.');
      return false;
    }

    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin');
    if (!identity) {
      console.log('⚠️  Admin identity not found in wallet. Run: node enroll-admin.js');
      console.log('⚠️  Running in MOCK mode.');
      return false;
    }

    gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'admin',
      discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('landregistry');
    contract = network.getContract('property-contract');

    console.log('✅ Connected to Fabric network successfully!');
    fabricMode = true;
    return true;

  } catch (error) {
    console.log('⚠️  Failed to connect to Fabric:', error.message);
    console.log('⚠️  Running in MOCK mode.');
    fabricMode = false;
    return false;
  }
}

// Execute chaincode (Fabric mode) or mock operation
async function executeTransaction(contractName, functionName, ...args) {
  if (fabricMode) {
    try {
      console.log(`📤 Fabric: ${contractName}.${functionName}`, args);
      const result = await contract.submitTransaction(functionName, ...args);
      return { success: true, data: result.toString() ? JSON.parse(result.toString()) : {} };
    } catch (error) {
      console.error('❌ Fabric transaction failed:', error.message);
      throw error;
    }
  } else {
    // Mock mode - return success
    console.log(`[MOCK] ${contractName}.${functionName}`, args);
    return { success: true, data: args };
  }
}

// Query chaincode (Fabric mode) or mock query
async function queryChaincode(contractName, functionName, ...args) {
  if (fabricMode) {
    try {
      console.log(`🔍 Fabric Query: ${contractName}.${functionName}`, args);
      const result = await contract.evaluateTransaction(functionName, ...args);
      return { success: true, data: result.toString() ? JSON.parse(result.toString()) : {} };
    } catch (error) {
      console.error('❌ Fabric query failed:', error.message);
      throw error;
    }
  } else {
    // Mock mode - return from store
    console.log(`[MOCK Query] ${contractName}.${functionName}`, args);
    return { success: true, data: [] };
  }
}

// ============= API ROUTES =============

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    mode: fabricMode ? 'FABRIC' : 'MOCK',
    timestamp: new Date().toISOString(),
    stats: {
      users: store.users.length,
      properties: store.properties.length,
      offers: store.offers.length,
      transactions: store.transactions.length
    },
    fabricConnected: fabricMode
  });
});

// User APIs
app.post('/api/users/register', async (req, res) => {
  try {
    console.log('👤 Register user:', req.body.name);
    const userData = req.body;

    if (fabricMode) {
      await executeTransaction(
        'user-contract',
        'RegisterUser',
        userData.userId, userData.name, userData.email, userData.phone,
        userData.aadhar, userData.pan, userData.address, userData.role,
        userData.walletAddress, userData.passwordHash
      );
    }

    // Always store in mock store for quick queries
    store.users.push({ ...userData, registeredAt: new Date().toISOString() });
    saveData(); // Save immediately
    res.json({ success: true, userId: userData.userId, data: userData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', (req, res) => {
  res.json({ success: true, data: store.users });
});

// Property APIs
app.post('/api/properties/register', async (req, res) => {
  try {
    console.log('🏠 Register property:', req.body.location);
    const propertyData = req.body;

    if (fabricMode) {
      await executeTransaction(
        'property-contract',
        'RegisterProperty',
        propertyData.propertyId, propertyData.owner, propertyData.ownerName,
        propertyData.location, propertyData.area.toString(), propertyData.price.toString(),
        propertyData.propertyType, propertyData.description,
        propertyData.latitude.toString(), propertyData.longitude.toString()
      );
    }

    const fullPropertyData = {
      ...propertyData,
      status: 'PENDING',
      documents: [],
      verifiedBy: '',
      verifiedAt: '',
      registeredAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      views: 0
    };
    store.properties.push(fullPropertyData);

    // Create transaction
    createTransaction('PROPERTY_REGISTERED', {
      propertyId: propertyData.propertyId,
      toOwner: propertyData.owner,
      amount: propertyData.price,
      status: 'COMPLETED'
    });

    res.json({ success: true, propertyId: propertyData.propertyId, data: fullPropertyData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/properties', (req, res) => {
  res.json({ success: true, data: store.properties });
});

app.get('/api/properties/:propertyId', (req, res) => {
  const property = store.properties.find(p => p.propertyId === req.params.propertyId);
  res.json({ success: true, data: property });
});

// Offer APIs
app.post('/api/offers/create', async (req, res) => {
  try {
    console.log('💰 Create offer:', req.body.offerId);
    const offerData = req.body;

    if (fabricMode) {
      await executeTransaction(
        'offer-contract',
        'CreateOffer',
        offerData.offerId, offerData.propertyId, offerData.buyerId,
        offerData.buyerName, offerData.sellerId, offerData.sellerName,
        offerData.offerAmount.toString(), offerData.message
      );
    }

    const fullOfferData = {
      ...offerData,
      status: 'PENDING',
      adminVerified: false,
      adminId: '',
      verifiedAt: '',
      sepoliaTxHash: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    store.offers.push(fullOfferData);

    // Create transaction
    createTransaction('OFFER_CREATED', {
      propertyId: offerData.propertyId,
      fromOwner: offerData.buyerId,
      toOwner: offerData.sellerId,
      amount: offerData.offerAmount,
      status: 'PENDING',
      offerId: offerData.offerId
    });

    res.json({ success: true, offerId: offerData.offerId, data: fullOfferData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/offers', (req, res) => {
  res.json({ success: true, data: store.offers });
});

app.put('/api/offers/:offerId/accept', async (req, res) => {
  try {
    const { offerId } = req.params;

    if (fabricMode) {
      await executeTransaction('offer-contract', 'AcceptOffer', offerId);
    }

    const offer = store.offers.find(o => o.offerId === offerId);
    if (offer) {
      offer.status = 'ACCEPTED';
      offer.updatedAt = new Date().toISOString();

      createTransaction('OFFER_ACCEPTED', {
        propertyId: offer.propertyId,
        fromOwner: offer.sellerId,
        toOwner: offer.buyerId,
        amount: offer.offerAmount,
        status: 'PENDING',
        offerId: offer.offerId
      });
    }

    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/offers/:offerId/verify', async (req, res) => {
  try {
    const { offerId } = req.params;
    const { adminId, sepoliaTxHash } = req.body;

    if (fabricMode) {
      await executeTransaction('offer-contract', 'AdminVerifyOffer', offerId, adminId, sepoliaTxHash);
    }

    const offer = store.offers.find(o => o.offerId === offerId);
    if (offer) {
      offer.status = 'ADMIN_VERIFIED';
      offer.adminVerified = true;
      offer.adminId = adminId;
      offer.verifiedAt = new Date().toISOString();
      offer.sepoliaTxHash = sepoliaTxHash;
      offer.updatedAt = new Date().toISOString();

      createTransaction('OFFER_VERIFIED', {
        propertyId: offer.propertyId,
        fromOwner: offer.sellerId,
        toOwner: offer.buyerId,
        amount: offer.offerAmount,
        status: 'VERIFIED',
        offerId: offer.offerId
      });
    }

    res.json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transaction APIs
app.get('/api/transactions', (req, res) => {
  res.json({ success: true, data: store.transactions });
});

// Start server
app.listen(PORT, async () => {
  console.log('='.repeat(70));
  console.log('🚀 LandChain Backend Server Started');
  console.log('='.repeat(70));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(70));

  await initFabric();

  console.log('\n✅ Server ready to handle requests');
  console.log(`📊 Mode: ${fabricMode ? '✅ FABRIC CONNECTED' : '⚠️  MOCK (In-Memory)'}`);
  console.log('\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  saveData(); // Save data before exit
  if (gateway) {
    await gateway.disconnect();
  }
  process.exit(0);
});