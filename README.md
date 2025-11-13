# LandChain Registry - Blockchain-Based Land Registry System

A decentralized land registry system built with **Hyperledger Fabric** for data storage and **Sepolia Network** for transaction verification. This is a college project demonstrating blockchain integration for secure land ownership management.

## System Architecture

### Three-Entity System

1. **Buyer** - Makes offers to purchase land
2. **Seller** - Lists properties and accepts/rejects offers
3. **Admin** - Verifies transactions and transfers land ownership on Sepolia network

### Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Blockchain (Data Layer)**: Hyperledger Fabric
- **Blockchain (Transaction Layer)**: Sepolia Testnet (Ethereum)
- **Smart Contracts**: Go (Chaincode)
- **Wallet Integration**: MetaMask

## Features

### User Management
- KYC registration with role selection (Buyer/Seller/Admin)
- User credentials and documents stored on Hyperledger Fabric ledger
- Wallet integration for blockchain transactions

### Property Management
- Property registration by sellers
- Property verification by admin
- Complete property history tracking
- Transfer of ownership recorded on blockchain

### Offer System
- Buyers make offers on properties
- Sellers accept or reject offers
- Admin verifies accepted offers
- Transaction recorded on Sepolia network
- Land ownership transferred on blockchain

### Admin Dashboard
- View pending transaction verifications
- Record transactions on Sepolia testnet
- Transfer land ownership
- Complete transaction lifecycle management

## Project Structure

```
aura/
├── chaincode/                  # Hyperledger Fabric Smart Contracts
│   ├── property-contract/      # Property management chaincode
│   ├── user-contract/          # User and document management
│   ├── offer-contract/         # Offer and transaction management
│   └── escrow-contract/        # Escrow management
├── scripts/                    # Deployment and setup scripts
│   ├── 1-setup-network.sh
│   ├── 2-create-channel.sh
│   ├── 3-deploy-property-chaincode.sh
│   ├── 3-deploy-user-chaincode.sh
│   ├── 4-deploy-escrow-chaincode.sh
│   ├── 6-deploy-offer-chaincode.sh
│   └── deploy-all.sh
├── src/                        # Frontend application
│   ├── components/             # React components
│   ├── pages/                  # Application pages
│   │   ├── KYC.tsx            # User registration
│   │   ├── Dashboard.tsx      # User dashboard
│   │   ├── Properties.tsx     # Property listing
│   │   ├── AddProperty.tsx    # Seller: Add property
│   │   ├── AdminDashboard.tsx # Admin: Verify transactions
│   │   └── Transactions.tsx   # Transaction history
│   └── services/
│       └── fabricClient.ts    # Hyperledger Fabric & Sepolia integration
├── docker-compose.yaml         # Fabric network configuration
├── configtx.yaml              # Channel configuration
└── crypto-config.yaml         # MSP configuration
```

## Data Storage

### Hyperledger Fabric Ledger Stores:

1. **User Credentials**
   - Personal information (Name, Email, Phone)
   - KYC documents (Aadhar, PAN)
   - Wallet address
   - Password hash
   - Role (Buyer/Seller/Admin)

2. **Property Records**
   - Property details (Location, Area, Price)
   - Owner information
   - Property documents
   - Verification status
   - Complete ownership history

3. **Offers**
   - Offer details and status
   - Buyer and seller information
   - Admin verification status
   - Sepolia transaction hash

4. **Transactions**
   - Complete transaction history
   - Ownership transfers
   - Timestamps and participants

### Sepolia Network Records:

- Transaction verification by admin
- Payment transactions
- Immutable transaction hashes linked to Hyperledger records

## Workflow

### 1. User Registration (KYC)
```
User → Fills KYC form → Selects role (Buyer/Seller/Admin)
     → Connects MetaMask wallet → Data stored on Hyperledger Fabric
```

### 2. Property Listing (Seller)
```
Seller → Adds property details → Property registered on blockchain
      → Admin verifies property → Property becomes VERIFIED
```

### 3. Making an Offer (Buyer)
```
Buyer → Views properties → Makes offer → Offer stored on blockchain
     → Status: PENDING
```

### 4. Accepting Offer (Seller)
```
Seller → Views received offers → Accepts/Rejects offer
      → If accepted: Status → ACCEPTED → Sent to Admin
```

### 5. Admin Verification
```
Admin → Views pending offers → Connects to Sepolia network
     → Records transaction on Sepolia → Gets transaction hash
     → Updates offer with Sepolia TX hash → Transfers property ownership
     → Status → COMPLETED
```

## Setup Instructions

### Prerequisites

1. **Docker & Docker Compose**
2. **Node.js** (v16 or higher)
3. **Go** (v1.20 or higher)
4. **MetaMask** browser extension
5. **Sepolia Testnet ETH** (get from faucet)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd aura
```

2. **Setup Hyperledger Fabric Network**
```bash
# Navigate to scripts directory
cd scripts

# Run all setup scripts
./deploy-all.sh
```

Or run scripts individually:
```bash
./1-setup-network.sh          # Start Fabric network
./2-create-channel.sh          # Create channel
./3-deploy-user-chaincode.sh  # Deploy user contract
./3-deploy-property-chaincode.sh  # Deploy property contract
./4-deploy-escrow-chaincode.sh    # Deploy escrow contract
./6-deploy-offer-chaincode.sh     # Deploy offer contract
```

3. **Install Frontend Dependencies**
```bash
cd ..
npm install
```

4. **Start Frontend Application**
```bash
npm run dev
```

5. **Configure MetaMask**
   - Add Sepolia Test Network
   - Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com/)

### Configuration

The Hyperledger Fabric network is configured with:
- **Organization**: Org1
- **Channel**: landregistry
- **Peers**: peer0.org1.example.com
- **Orderer**: orderer.example.com

## Usage Guide

### For Buyers

1. Register with role "BUYER"
2. Connect MetaMask wallet
3. Browse available properties
4. Make offers on properties
5. Track offer status (Pending/Accepted/Rejected/Completed)

### For Sellers

1. Register with role "SELLER"
2. Connect MetaMask wallet
3. Add properties for sale
4. View and manage incoming offers
5. Accept or reject buyer offers
6. Track property sales

### For Admins

1. Register with role "ADMIN"
2. Connect MetaMask wallet (with Sepolia ETH)
3. Access Admin Dashboard
4. View pending verifications
5. Verify transactions:
   - System switches to Sepolia network
   - Record transaction on Sepolia
   - Property ownership transferred
   - Transaction marked as complete

## Smart Contracts (Chaincode)

### User Contract (user-contract)
- `RegisterUser` - Register new user with credentials
- `GetUser` - Get user details
- `AddDocument` - Add document to user profile
- `VerifyDocument` - Admin verifies user documents
- `UpdateLastLogin` - Update user login time

### Property Contract (property-contract)
- `RegisterProperty` - Register new property
- `VerifyProperty` - Admin verifies property
- `TransferProperty` - Transfer ownership
- `GetProperty` - Get property details
- `GetPropertiesByOwner` - Get user's properties
- `GetPropertyHistory` - Get complete property history

### Offer Contract (offer-contract)
- `CreateOffer` - Buyer creates offer
- `AcceptOffer` - Seller accepts offer
- `RejectOffer` - Seller rejects offer
- `AdminVerifyOffer` - Admin verifies with Sepolia TX
- `CompleteOffer` - Mark offer as completed
- `GetPendingAdminVerifications` - Get offers awaiting admin

### Escrow Contract (escrow-contract)
- `CreateEscrow` - Create escrow account
- `FundEscrow` - Fund escrow with transaction
- `ReleaseEscrow` - Release funds to seller
- `CancelEscrow` - Cancel and refund buyer

## Important Notes

### Demo Project Limitations

This is a **demonstration project** for educational purposes:

1. **Not Production Ready**
   - Mock Fabric client (needs actual Fabric SDK)
   - Simplified authentication
   - Basic error handling

2. **Security Considerations**
   - Password hashing is basic (use bcrypt in production)
   - No JWT authentication
   - No rate limiting
   - No input sanitization

3. **Blockchain Integration**
   - Fabric client uses mock responses
   - Needs proper Fabric SDK implementation
   - Certificate management simplified

### What Was Removed

- ✅ Supabase integration (replaced with Hyperledger Fabric)
- ✅ Price predictor (removed as requested)
- ✅ All data now stored on Hyperledger Fabric ledger

### What Was Added

- ✅ Three-entity role system (Buyer/Seller/Admin)
- ✅ Offer management workflow
- ✅ Sepolia network integration for admin verification
- ✅ User contract with document storage on ledger
- ✅ Offer contract for transaction management
- ✅ Admin dashboard for verification
- ✅ Complete transaction lifecycle

## Testing the System

1. **Register three users** (one of each role):
   - Buyer: buyer@example.com
   - Seller: seller@example.com
   - Admin: admin@example.com

2. **As Seller**: Add a property

3. **As Buyer**: Make an offer on the property

4. **As Seller**: Accept the offer

5. **As Admin**:
   - Verify the accepted offer
   - Record on Sepolia network
   - Complete the transaction

## Troubleshooting

### Fabric Network Issues
```bash
# Stop and clean network
cd scripts
./cleanup.sh

# Restart network
./deploy-all.sh
```

### MetaMask Issues
- Ensure you're on Sepolia network
- Check you have test ETH
- Reset account if needed

### Frontend Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Future Enhancements

- Implement actual Fabric SDK integration
- Add proper authentication and authorization
- Implement document upload to IPFS
- Add real-time notifications
- Enhanced security measures
- Mobile application
- Multi-organization support

## License

This project is for educational purposes only.

## Contributors

Developed as a college project demonstrating blockchain integration for land registry management.

---

**Note**: This is a demonstration system. Do not use in production without proper security audits and enhancements.
