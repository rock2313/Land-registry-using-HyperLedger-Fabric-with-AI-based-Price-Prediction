import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Home, Tag, Store, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/services/apiClient';

interface Property {
  propertyId: string;
  owner: string;
  ownerName: string;
  location: string;
  area: number;
  price: number;
  status: string;
  propertyType: string;
  description: string;
  registeredAt: string;
  listedForSale?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export const Properties = () => {
  const { toast } = useToast();
  const [marketplace, setMarketplace] = useState<Property[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('marketplace');

  useEffect(() => {
    // Load current user
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);

    // Load data
    loadMarketplace();
    if (user.userId) {
      loadMyProperties(user.userId);
    }

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadMarketplace();
      if (user.userId) {
        loadMyProperties(user.userId);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMarketplace = async () => {
    try {
      const result = await apiClient.getMarketplace();
      if (result.success && result.data) {
        setMarketplace(result.data);
      }
    } catch (error) {
      console.error('Failed to load marketplace:', error);
    }
  };

  const loadMyProperties = async (userId: string) => {
    try {
      const result = await apiClient.getUserProperties(userId);
      if (result.success && result.data) {
        setMyProperties(result.data);
      }
    } catch (error) {
      console.error('Failed to load my properties:', error);
    }
  };

  const handleListForSale = async (propertyId: string) => {
    setLoading(true);
    try {
      await apiClient.listPropertyForSale(propertyId);
      toast({
        title: 'Property Listed! 🎉',
        description: 'Your property is now visible in the marketplace',
      });
      loadMarketplace();
      if (currentUser?.userId) {
        loadMyProperties(currentUser.userId);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to List Property',
        description: error?.message || 'Property must be verified first',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlist = async (propertyId: string) => {
    setLoading(true);
    try {
      await apiClient.unlistProperty(propertyId);
      toast({
        title: 'Property Unlisted',
        description: 'Your property has been removed from the marketplace',
      });
      loadMarketplace();
      if (currentUser?.userId) {
        loadMyProperties(currentUser.userId);
      }
    } catch (error: any) {
      toast({
        title: 'Failed to Unlist',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMakeOffer = (property: Property) => {
    if (!currentUser?.userId) {
      toast({
        title: 'Login Required',
        description: 'Please register/login to make an offer',
        variant: 'destructive',
      });
      return;
    }

    setSelectedProperty(property);
    setOfferAmount(property.price.toString());
    setOfferMessage('');
    setShowOfferModal(true);
  };

  const handleSubmitOffer = async () => {
    if (!selectedProperty || !currentUser) return;

    const amount = parseFloat(offerAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid offer amount',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const offerId = `OFFER_${Date.now()}`;

      await apiClient.createOffer({
        offerId,
        propertyId: selectedProperty.propertyId,
        buyerId: currentUser.userId,
        buyerName: currentUser.name,
        sellerId: selectedProperty.owner,
        sellerName: selectedProperty.ownerName,
        offerAmount: amount,
        message: offerMessage,
      });

      toast({
        title: 'Offer Submitted! 🎉',
        description: 'Your offer has been submitted. The seller will review it.',
        duration: 5000,
      });

      setShowOfferModal(false);
      setSelectedProperty(null);
      setOfferAmount('');
      setOfferMessage('');
    } catch (error: any) {
      toast({
        title: 'Failed to Submit Offer',
        description: error?.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'TRANSFERRED':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const PropertyCard = ({ property, isOwner = false }: { property: Property; isOwner?: boolean }) => (
    <Card key={property.propertyId} className="hover:shadow-lg transition-shadow border-primary/20">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <Badge className={getStatusColor(property.status)}>
            {property.status}
          </Badge>
          <div className="flex gap-2">
            <Badge variant="outline">{property.propertyType}</Badge>
            {property.listedForSale && (
              <Badge className="bg-blue-500">For Sale</Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-lg">{property.location}</CardTitle>
        <p className="text-xs text-muted-foreground font-mono">
          ID: {property.propertyId.substring(0, 20)}...
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{property.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag className="h-4 w-4 text-primary" />
            <span>{property.area} sq ft</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-lg font-bold">{formatCurrency(property.price)}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-2">
            <p>Owner: {property.ownerName}</p>
            <p>Registered: {new Date(property.registeredAt).toLocaleDateString()}</p>
            {property.verifiedBy && (
              <p className="text-green-600">✓ Verified by Admin</p>
            )}
          </div>
          {property.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {property.description}
            </p>
          )}
        </div>

        {/* Actions for marketplace view */}
        {!isOwner && (
          <Button
            className="w-full bg-gradient-to-r from-primary to-blue-600"
            onClick={() => handleMakeOffer(property)}
          >
            Make an Offer
          </Button>
        )}

        {/* Actions for owner's properties */}
        {isOwner && (
          <div className="space-y-2">
            {property.status === 'PENDING' && (
              <div className="text-center text-sm text-yellow-600 py-2 bg-yellow-50 rounded">
                ⏳ Awaiting Admin Verification
              </div>
            )}
            {property.status === 'VERIFIED' && !property.listedForSale && (
              <Button
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                onClick={() => handleListForSale(property.propertyId)}
                disabled={loading}
              >
                List for Sale in Marketplace
              </Button>
            )}
            {property.listedForSale && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUnlist(property.propertyId)}
                disabled={loading}
              >
                Remove from Marketplace
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Property Registry</h1>
          <p className="text-muted-foreground">
            Browse marketplace listings or manage your properties
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Marketplace ({marketplace.length})
            </TabsTrigger>
            <TabsTrigger value="my-properties" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              My Properties ({myProperties.length})
            </TabsTrigger>
          </TabsList>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="mt-6">
            {marketplace.length === 0 ? (
              <Card className="border-primary/20">
                <CardContent className="text-center py-12">
                  <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Properties in Marketplace</h3>
                  <p className="text-muted-foreground mb-6">
                    Properties will appear here once owners list them for sale.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplace.map((property) => (
                  <PropertyCard key={property.propertyId} property={property} isOwner={false} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Properties Tab */}
          <TabsContent value="my-properties" className="mt-6">
            {!currentUser?.userId ? (
              <Card className="border-primary/20">
                <CardContent className="text-center py-12">
                  <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Login Required</h3>
                  <p className="text-muted-foreground mb-6">
                    Please login to view and manage your properties.
                  </p>
                  <Button onClick={() => window.location.href = '/'}>
                    Go to Registration
                  </Button>
                </CardContent>
              </Card>
            ) : myProperties.length === 0 ? (
              <Card className="border-primary/20">
                <CardContent className="text-center py-12">
                  <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    You haven't registered any properties. Start by adding your first property.
                  </p>
                  <Button onClick={() => window.location.href = '/add-property'}>
                    Register Your Property
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Managing {myProperties.length} propert{myProperties.length === 1 ? 'y' : 'ies'}
                  </p>
                  <Button onClick={() => window.location.href = '/add-property'} variant="outline">
                    + Add New Property
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProperties.map((property) => (
                    <PropertyCard key={property.propertyId} property={property} isOwner={true} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Make Offer Modal */}
        <Dialog open={showOfferModal} onOpenChange={setShowOfferModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Make an Offer</DialogTitle>
              <DialogDescription>
                Submit your offer for this property. The seller will review and respond.
              </DialogDescription>
            </DialogHeader>

            {selectedProperty && (
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">{selectedProperty.location}</p>
                  <p className="text-xs text-muted-foreground">
                    Listed Price: {formatCurrency(selectedProperty.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Owner: {selectedProperty.ownerName}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offerAmount">Your Offer Amount (₹)</Label>
                  <Input
                    id="offerAmount"
                    type="number"
                    placeholder="Enter your offer amount"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offerMessage">Message (Optional)</Label>
                  <Textarea
                    id="offerMessage"
                    placeholder="Add a message to the seller..."
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowOfferModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleSubmitOffer} disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Offer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};