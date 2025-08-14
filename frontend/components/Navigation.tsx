import { Link, useLocation } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button } from './ui/button';
import { Wallet, Shield } from 'lucide-react';
import { CropInsuranceService } from '../services/crop-insurance';
import { useUser } from '../contexts/UserContext';

export default function Navigation() {
  const location = useLocation();
  const { userType } = useUser();
  const { 
    connected, 
    account, 
    connect, 
    disconnect, 
    wallets 
  } = useWallet();

  const handleWalletAction = async () => {
    if (connected) {
      await disconnect();
    } else {
      // Try to connect to the first available wallet
      const availableWallet = wallets.find(wallet => wallet.readyState === 'Installed');
      if (availableWallet) {
        await connect(availableWallet.name);
      }
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isAdmin = userType === 'admin';

  // Debug logging
  console.log('🧭 Navigation Debug:', {
    connected,
    userType,
    isAdmin,
    currentPath: location.pathname,
    account: account?.address.toString()
  });

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-600" />
              <span className="text-xl font-bold text-gray-900">CropInsure</span>
            </Link>
          </div>

          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition-colors hover:text-green-600 ${
                  isActive('/') ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                Home
              </Link>
              
              {/* Admin Navigation */}
              {connected && isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className={`text-sm font-medium transition-colors hover:text-green-600 ${
                      isActive('/admin') || isActive('/admin-dashboard') ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                </>
              )}

              {/* Farmer Navigation */}
              {connected && !isAdmin && (
                <>
                  <Link
                    to="/farmer-dashboard"
                    className={`text-sm font-medium transition-colors hover:text-green-600 ${
                      isActive('/farmer-dashboard') ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/buy-policy"
                    className={`text-sm font-medium transition-colors hover:text-green-600 ${
                      isActive('/buy-policy') ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    Buy Policy
                  </Link>
                  <Link
                    to="/my-policies"
                    className={`text-sm font-medium transition-colors hover:text-green-600 ${
                      isActive('/my-policies') ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    My Policies
                  </Link>
                  <Link
                    to="/claims"
                    className={`text-sm font-medium transition-colors hover:text-green-600 ${
                      isActive('/claims') ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    Claims
                  </Link>
                </>
              )}

              {/* Guest Navigation */}
              {!connected && (
                <Link
                  to="/register-farmer"
                  className={`text-sm font-medium transition-colors hover:text-green-600 ${
                    isActive('/register-farmer') || isActive('/farmer-registration') ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  Register as Farmer
                </Link>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {connected && account && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span>Connected:</span>
                  <span className="font-mono">
                    {CropInsuranceService.formatAddress(account.address.toString())}
                  </span>
                </div>
              )}
              
              <Button
                onClick={handleWalletAction}
                variant={connected ? "outline" : "default"}
                className={connected ? "" : "bg-green-600 hover:bg-green-700"}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {connected ? "Disconnect" : "Connect Wallet"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
