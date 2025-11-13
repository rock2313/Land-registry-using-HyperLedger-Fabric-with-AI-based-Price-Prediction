// Enroll Admin User - Creates wallet identity for connecting to Fabric
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function enrollAdmin() {
  try {
    console.log('🔐 Enrolling admin user...');

    // Load connection profile
    const ccpPath = path.resolve(__dirname, 'connection-profile.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create CA client
    const caURL = ccp.certificateAuthorities['ca.org1.landregistry.com'].url;
    const ca = new FabricCAServices(caURL);

    // Create wallet
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if admin already exists
    const adminExists = await wallet.get('admin');
    if (adminExists) {
      console.log('✅ Admin identity already exists in wallet');
      return;
    }

    // Read admin cert and key from crypto-config
    const adminCertPath = path.resolve(__dirname, '../crypto-config/peerOrganizations/org1.landregistry.com/users/Admin@org1.landregistry.com/msp/signcerts/Admin@org1.landregistry.com-cert.pem');
    const adminKeyPath = path.resolve(__dirname, '../crypto-config/peerOrganizations/org1.landregistry.com/users/Admin@org1.landregistry.com/msp/keystore');

    if (!fs.existsSync(adminCertPath)) {
      console.error('❌ Admin certificate not found at:', adminCertPath);
      console.log('Make sure crypto-config is generated. Run: ./scripts/1-setup-network.sh');
      return;
    }

    const cert = fs.readFileSync(adminCertPath).toString();

    // Get private key (first file in keystore directory)
    const keyFiles = fs.readdirSync(adminKeyPath);
    const keyFile = keyFiles[0];
    const keyPath = path.join(adminKeyPath, keyFile);
    const key = fs.readFileSync(keyPath).toString();

    // Create identity
    const identity = {
      credentials: {
        certificate: cert,
        privateKey: key,
      },
      mspId: 'Org1MSP',
      type: 'X.509',
    };

    await wallet.put('admin', identity);
    console.log('✅ Admin identity imported to wallet');
    console.log('📁 Wallet location:', walletPath);

  } catch (error) {
    console.error('❌ Failed to enroll admin:', error);
    process.exit(1);
  }
}

enrollAdmin();
