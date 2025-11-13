// Hyperledger Fabric Client Interface
// This connects to your deployed Fabric network

interface FabricConfig {
  networkUrl: string;
  channelName: string;
  chaincodeName: string;
  mspId: string;
}

// Mock interface - replace with actual Fabric SDK in production
class FabricClient {
  private config: FabricConfig;
  private isConnected: boolean = false;

  constructor(config: FabricConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // In production: Initialize Fabric SDK gateway connection
    console.log('Connecting to Fabric network:', this.config.networkUrl);
    this.isConnected = true;

    // Auto-connect for demo
    if (!this.isConnected) {
      await this.connect();
    }
  }

  async invokeChaincode(
    chaincodeName: string,
    functionName: string,
    args: string[]
  ): Promise<any> {
    // Auto-connect if not connected
    if (!this.isConnected) {
      await this.connect();
    }

    // In production: Submit transaction to chaincode
    console.log(`✅ Invoking chaincode ${chaincodeName}: ${functionName}`, args);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock response - replace with actual transaction
    return {
      txId: `tx_${Date.now()}`,
      status: 'SUCCESS',
      payload: {
        message: 'Transaction submitted to Fabric network',
        data: args
      }
    };
  }

  async queryChaincode(
    chaincodeName: string,
    functionName: string,
    args: string[]
  ): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to Fabric network');
    }

    // In production: Query chaincode
    console.log(`Querying chaincode ${chaincodeName}: ${functionName}`, args);

    // Mock response
    return {
      status: 'SUCCESS',
      payload: { data: [] }
    };
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('Disconnected from Fabric network');
  }
}

// Fabric network configuration
const fabricConfig: FabricConfig = {
  networkUrl: 'http://localhost:7051', // Your peer URL
  channelName: 'landregistry',
  chaincodeName: 'property-contract',
  mspId: 'Org1MSP'
};

export const fabricClient = new FabricClient(fabricConfig);

// User chaincode functions
export const userChaincode = {
  // Register new user on blockchain with credentials and documents
  async registerUser(userData: {
    userId: string;
    name: string;
    email: string;
    phone: string;
    aadhar: string;
    pan: string;
    address: string;
    role: string; // BUYER, SELLER, ADMIN
    walletAddress: string;
    passwordHash: string;
  }) {
    return fabricClient.invokeChaincode('user-contract', 'RegisterUser', [
      userData.userId,
      userData.name,
      userData.email,
      userData.phone,
      userData.aadhar,
      userData.pan,
      userData.address,
      userData.role,
      userData.walletAddress,
      userData.passwordHash
    ]);
  },

  // Get user details
  async getUser(userId: string) {
    return fabricClient.queryChaincode('user-contract', 'GetUser', [userId]);
  },

  // Add document to user profile
  async addDocument(userId: string, documentId: string, documentType: string, documentHash: string) {
    return fabricClient.invokeChaincode('user-contract', 'AddDocument', [
      userId,
      documentId,
      documentType,
      documentHash
    ]);
  },

  // Verify user document (Admin only)
  async verifyDocument(userId: string, documentId: string, adminId: string) {
    return fabricClient.invokeChaincode('user-contract', 'VerifyDocument', [
      userId,
      documentId,
      adminId
    ]);
  },

  // Update last login
  async updateLastLogin(userId: string) {
    return fabricClient.invokeChaincode('user-contract', 'UpdateLastLogin', [userId]);
  },

  // Get users by role
  async getUsersByRole(role: string) {
    return fabricClient.queryChaincode('user-contract', 'GetUsersByRole', [role]);
  }
};

// Property chaincode functions
export const propertyChaincode = {
  // Register new property on blockchain
  async registerProperty(propertyData: {
    propertyId: string;
    owner: string;
    ownerName: string;
    location: string;
    area: number;
    price: number;
    propertyType: string;
    description: string;
    latitude: number;
    longitude: number;
  }) {
    return fabricClient.invokeChaincode('property-contract', 'RegisterProperty', [
      propertyData.propertyId,
      propertyData.owner,
      propertyData.ownerName,
      propertyData.location,
      propertyData.area.toString(),
      propertyData.price.toString(),
      propertyData.propertyType,
      propertyData.description,
      propertyData.latitude.toString(),
      propertyData.longitude.toString()
    ]);
  },

  // Verify property (Admin only)
  async verifyProperty(propertyId: string, verifierId: string) {
    return fabricClient.invokeChaincode('property-contract', 'VerifyProperty', [
      propertyId,
      verifierId
    ]);
  },

  // Transfer property ownership
  async transferProperty(propertyId: string, newOwner: string, newOwnerName: string, transactionId: string) {
    return fabricClient.invokeChaincode('property-contract', 'TransferProperty', [
      propertyId,
      newOwner,
      newOwnerName,
      transactionId
    ]);
  },

  // Get property details
  async getProperty(propertyId: string) {
    return fabricClient.queryChaincode('property-contract', 'GetProperty', [propertyId]);
  },

  // Get properties by owner
  async getPropertiesByOwner(owner: string) {
    return fabricClient.queryChaincode('property-contract', 'GetPropertiesByOwner', [owner]);
  },

  // Get properties by status
  async getPropertiesByStatus(status: string) {
    return fabricClient.queryChaincode('property-contract', 'GetPropertiesByStatus', [status]);
  },

  // Get all properties
  async getAllProperties() {
    return fabricClient.queryChaincode('property-contract', 'GetAllProperties', []);
  },

  // Get property history
  async getPropertyHistory(propertyId: string) {
    return fabricClient.queryChaincode('property-contract', 'GetPropertyHistory', [propertyId]);
  },

  // Update property status
  async updatePropertyStatus(propertyId: string, status: string) {
    return fabricClient.invokeChaincode('property-contract', 'UpdatePropertyStatus', [
      propertyId,
      status
    ]);
  }
};

// Offer chaincode functions
export const offerChaincode = {
  // Create new offer (Buyer)
  async createOffer(offerData: {
    offerId: string;
    propertyId: string;
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    offerAmount: number;
    message: string;
  }) {
    return fabricClient.invokeChaincode('offer-contract', 'CreateOffer', [
      offerData.offerId,
      offerData.propertyId,
      offerData.buyerId,
      offerData.buyerName,
      offerData.sellerId,
      offerData.sellerName,
      offerData.offerAmount.toString(),
      offerData.message
    ]);
  },

  // Accept offer (Seller)
  async acceptOffer(offerId: string) {
    return fabricClient.invokeChaincode('offer-contract', 'AcceptOffer', [offerId]);
  },

  // Reject offer (Seller)
  async rejectOffer(offerId: string) {
    return fabricClient.invokeChaincode('offer-contract', 'RejectOffer', [offerId]);
  },

  // Admin verify offer and record Sepolia transaction
  async adminVerifyOffer(offerId: string, adminId: string, sepoliaTxHash: string) {
    return fabricClient.invokeChaincode('offer-contract', 'AdminVerifyOffer', [
      offerId,
      adminId,
      sepoliaTxHash
    ]);
  },

  // Complete offer after land transfer
  async completeOffer(offerId: string) {
    return fabricClient.invokeChaincode('offer-contract', 'CompleteOffer', [offerId]);
  },

  // Cancel offer
  async cancelOffer(offerId: string) {
    return fabricClient.invokeChaincode('offer-contract', 'CancelOffer', [offerId]);
  },

  // Get offer details
  async getOffer(offerId: string) {
    return fabricClient.queryChaincode('offer-contract', 'GetOffer', [offerId]);
  },

  // Get offers by property
  async getOffersByProperty(propertyId: string) {
    return fabricClient.queryChaincode('offer-contract', 'GetOffersByProperty', [propertyId]);
  },

  // Get offers by buyer
  async getOffersByBuyer(buyerId: string) {
    return fabricClient.queryChaincode('offer-contract', 'GetOffersByBuyer', [buyerId]);
  },

  // Get offers by seller
  async getOffersBySeller(sellerId: string) {
    return fabricClient.queryChaincode('offer-contract', 'GetOffersBySeller', [sellerId]);
  },

  // Get offers by status
  async getOffersByStatus(status: string) {
    return fabricClient.queryChaincode('offer-contract', 'GetOffersByStatus', [status]);
  },

  // Get pending admin verifications (Admin only)
  async getPendingAdminVerifications() {
    return fabricClient.queryChaincode('offer-contract', 'GetPendingAdminVerifications', []);
  },

  // Get offer history
  async getOfferHistory(offerId: string) {
    return fabricClient.queryChaincode('offer-contract', 'GetOfferHistory', [offerId]);
  }
};

// Escrow chaincode functions
export const escrowChaincode = {
  // Create escrow for property transaction
  async createEscrow(escrowData: {
    escrowId: string;
    propertyId: string;
    buyer: string;
    seller: string;
    amount: number;
  }) {
    return fabricClient.invokeChaincode('escrow-contract', 'CreateEscrow', [
      escrowData.escrowId,
      escrowData.propertyId,
      escrowData.buyer,
      escrowData.seller,
      escrowData.amount.toString()
    ]);
  },

  // Fund escrow with transaction hash
  async fundEscrow(escrowId: string, txHash: string) {
    return fabricClient.invokeChaincode('escrow-contract', 'FundEscrow', [
      escrowId,
      txHash
    ]);
  },

  // Release escrow funds
  async releaseEscrow(escrowId: string, releaseTxHash: string) {
    return fabricClient.invokeChaincode('escrow-contract', 'ReleaseEscrow', [
      escrowId,
      releaseTxHash
    ]);
  },

  // Cancel escrow and refund
  async cancelEscrow(escrowId: string, refundTxHash: string) {
    return fabricClient.invokeChaincode('escrow-contract', 'CancelEscrow', [
      escrowId,
      refundTxHash
    ]);
  },

  // Get escrow status
  async getEscrowStatus(escrowId: string) {
    return fabricClient.queryChaincode('escrow-contract', 'GetEscrow', [escrowId]);
  },

  // Get all escrows
  async getAllEscrows() {
    return fabricClient.queryChaincode('escrow-contract', 'GetAllEscrows', []);
  }
};

// Sepolia Network Service for Admin Verification
export const sepoliaService = {
  async connectWallet(): Promise<string | null> {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        return accounts[0];
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
        return null;
      }
    } else {
      alert('Please install MetaMask!');
      return null;
    }
  },

  async switchToSepoliaTestnet(): Promise<boolean> {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia testnet
      });
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              nativeCurrency: {
                name: 'SepoliaETH',
                symbol: 'ETH',
                decimals: 18
              },
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }],
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          return false;
        }
      }
      return false;
    }
  },

  async sendPayment(to: string, amount: string): Promise<string | null> {
    try {
      const transactionHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: window.ethereum.selectedAddress,
          to: to,
          value: (parseFloat(amount) * 1e18).toString(16), // Convert ETH to Wei
        }],
      });
      return transactionHash;
    } catch (error) {
      console.error('Payment failed:', error);
      return null;
    }
  },

  // Admin records transaction on Sepolia network
  async recordTransaction(offerId: string, buyerAddress: string, sellerAddress: string, amount: string): Promise<string | null> {
    try {
      // This would typically call a smart contract on Sepolia
      // For now, we'll just send a transaction with the offer ID in the data field
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: window.ethereum.selectedAddress,
          to: sellerAddress,
          value: (parseFloat(amount) * 1e18).toString(16),
          data: '0x' + Buffer.from(offerId).toString('hex') // Encode offerId in transaction data
        }],
      });
      return txHash;
    } catch (error) {
      console.error('Transaction recording failed:', error);
      return null;
    }
  },

  async getTransactionStatus(txHash: string): Promise<any> {
    try {
      const receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash],
      });
      return receipt;
    } catch (error) {
      console.error('Error fetching transaction status:', error);
      return null;
    }
  }
};

// TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
