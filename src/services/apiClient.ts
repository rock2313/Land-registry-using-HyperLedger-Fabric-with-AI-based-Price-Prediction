// API Client - Frontend calls to Backend Server
// This replaces direct fabricClient calls with HTTP API calls

const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private async request(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🌐 API Request: ${options?.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ API Error:', data);
        throw new Error(data.error || 'API request failed');
      }

      console.log('✅ API Response:', data);
      return data;
    } catch (error: any) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // User APIs
  async login(email: string, password: string) {
    return this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async registerUser(userData: {
    userId: string;
    name: string;
    email: string;
    phone: string;
    aadhar: string;
    pan: string;
    address: string;
    role: string;
    walletAddress: string;
    passwordHash: string;
  }) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(userId: string) {
    return this.request(`/users/${userId}`);
  }

  async getAllUsers() {
    return this.request('/users');
  }

  // Property APIs
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
    return this.request('/properties/register', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async getProperty(propertyId: string) {
    return this.request(`/properties/${propertyId}`);
  }

  async getAllProperties() {
    return this.request('/properties');
  }

  async getUserProperties(userId: string) {
    return this.request(`/properties/user/${userId}`);
  }

  async getMarketplace() {
    return this.request('/properties/marketplace/all');
  }

  async listPropertyForSale(propertyId: string) {
    return this.request(`/properties/${propertyId}/list-for-sale`, {
      method: 'PUT',
    });
  }

  async unlistProperty(propertyId: string) {
    return this.request(`/properties/${propertyId}/unlist`, {
      method: 'PUT',
    });
  }

  async verifyProperty(propertyId: string, adminId: string) {
    return this.request(`/properties/${propertyId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ adminId }),
    });
  }

  // Offer APIs
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
    return this.request('/offers/create', {
      method: 'POST',
      body: JSON.stringify(offerData),
    });
  }

  async getOffer(offerId: string) {
    return this.request(`/offers/${offerId}`);
  }

  async getAllOffers() {
    return this.request('/offers');
  }

  async acceptOffer(offerId: string) {
    return this.request(`/offers/${offerId}/accept`, {
      method: 'PUT',
    });
  }

  async rejectOffer(offerId: string) {
    return this.request(`/offers/${offerId}/reject`, {
      method: 'PUT',
    });
  }

  async verifyOffer(offerId: string, adminId: string, sepoliaTxHash: string) {
    return this.request(`/offers/${offerId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ adminId, sepoliaTxHash }),
    });
  }

  // Transaction APIs
  async getAllTransactions() {
    return this.request('/transactions');
  }

  async getTransaction(transactionId: string) {
    return this.request(`/transactions/${transactionId}`);
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export instance
const apiClient = new ApiClient();
export { apiClient };
export default apiClient;
