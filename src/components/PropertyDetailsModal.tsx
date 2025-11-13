import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText, TrendingUp, ArrowRight } from 'lucide-react';

interface Transaction {
  from: string;
  to: string;
  amount: string;
}

interface PropertyDetails {
  id: string;
  title: string;
  state: string;
  mandal: string;
  village: string;
  surveyNo: string;
  lastSale: string;
  propertyIds: string[];
  area: string;
  currentBid: string;
  transactions: Transaction[];
  status: string;
  type: string;
}

interface PropertyDetailsModalProps {
  property: PropertyDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onBid: () => void;
}

export const PropertyDetailsModal = ({
  property,
  isOpen,
  onClose,
  onBid,
}: PropertyDetailsModalProps) => {
  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>{property.title}</span>
            <Badge
              variant={property.status === 'Verified' ? 'default' : 'secondary'}
              className={
                property.status === 'Verified'
                  ? 'bg-green-100 text-green-800 hover:bg-green-100'
                  : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
              }
            >
              {property.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Left Column - Property Info */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Property Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">State:</span>
                  <span className="font-medium">{property.state}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Mandal:</span>
                  <span className="font-medium">{property.mandal}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Village:</span>
                  <span className="font-medium">{property.village}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Survey No:</span>
                  <span className="font-medium">{property.surveyNo}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Last Sale:</span>
                  <span className="font-medium">{property.lastSale}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Property IDs</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="space-y-1 text-sm text-red-900">
                  {property.propertyIds.map((id, index) => (
                    <div key={index}>{id}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Previous Transactions
              </h3>
              <div className="space-y-3">
                {property.transactions.map((transaction, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-medium text-sm">{transaction.from}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{transaction.to}</span>
                    </div>
                    <span className="font-semibold text-sm">{transaction.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Map & Bidding */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Property Map
              </h3>
              <div className="border-2 border-green-500 bg-green-50 rounded-lg p-8 h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 border-2 border-green-600 bg-white/50 rounded transform rotate-12"></div>
                  <p className="text-sm font-medium text-green-900">
                    Area: <span className="font-bold">{property.area}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Current Bidding</h3>
              <div className="border-2 border-primary rounded-lg p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Current Bid</p>
                  <p className="text-3xl font-bold text-primary">{property.currentBid}</p>
                </div>
                <Button
                  onClick={onBid}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  size="lg"
                >
                  Place Bid
                </Button>
              </div>
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-semibold mb-2">Property Type</h4>
              <Badge variant="outline" className="text-base">
                {property.type}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-gradient-to-r from-primary to-[hsl(221,83%,53%)]">
            Download Documents
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
