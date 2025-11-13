import { FileText, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  isLoggedIn: boolean;
  userName?: string;
  userId?: string;
  onLogout: () => void;
}

export const Navbar = ({ isLoggedIn, userName, userId, onLogout }: NavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get current user to show admin-specific links
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

  // All users can access all features (buy and sell)
  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/properties', label: 'Properties' },
    { path: '/add-property', label: 'Add Property' },
    { path: '/offers', label: 'Offers' },
    { path: '/price-prediction', label: 'Price Prediction' },
    { path: '/transactions', label: 'Transactions' },
    ...(currentUser.role === 'ADMIN' ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="bg-gradient-to-r from-primary to-[hsl(221,83%,53%)] text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="bg-background p-2 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">LandChain Registry</span>
          </div>

          {isLoggedIn && (
            <div className="flex items-center gap-4">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  onClick={() => navigate(item.path)}
                  className={`text-primary-foreground hover:bg-white/20 ${
                    location.pathname === item.path ? 'bg-white/20' : ''
                  }`}
                >
                  {item.label}
                </Button>
              ))}
              <div className="border-l border-white/30 pl-4 ml-4">
                <div className="text-sm font-semibold">{userName || 'User'}</div>
                <div className="text-xs opacity-80">
                  ID: {userId?.substring(5, 17) || 'N/A'}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                className="text-primary-foreground hover:bg-white/20"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};