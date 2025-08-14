import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';

export default function AdminSetupPage() {
  const { connected, account, connect, wallets } = useWallet();
  const [adminAddress, setAdminAddress] = useState<string>('');

  useEffect(() => {
    if (connected && account) {
      const address = account.address.toString();
      setAdminAddress(address);
      
      // Log the address to console so I can see it
      console.log('🔑 ADMIN ADDRESS DETECTED:', address);
      console.log('🔑 Copy this address:', address);
      
      // Also store it temporarily
      localStorage.setItem('detected_admin_address', address);
    }
  }, [connected, account]);

  const handleConnect = async () => {
    if (wallets.length > 0) {
      const availableWallet = wallets.find(wallet => wallet.readyState === 'Installed') || wallets[0];
      await connect(availableWallet.name);
    }
  };

  const confirmAsAdmin = () => {
    if (adminAddress) {
      // This will trigger me to update the code with this address
      console.log('🚀 CONFIRMED ADMIN ADDRESS:', adminAddress);
      alert(`Admin address confirmed: ${adminAddress}\n\nI will now update the code to make this address the only admin!`);
      
      // Set temporary admin override
      localStorage.setItem('admin_override', adminAddress);
      
      // Reload to apply changes
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Admin Setup</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Admin Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600">Connect your wallet to set it as the admin address</p>
                <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700 w-full">
                  Connect My Admin Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Wallet Connected!</h3>
                  <p className="text-green-700 mb-2">Your wallet address:</p>
                  <code className="bg-white px-3 py-2 rounded border text-sm font-mono break-all block">
                    {adminAddress}
                  </code>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">🔧 Confirm Admin Setup</h3>
                  <p className="text-blue-700 mb-4">
                    Click below to confirm this address as the admin. All other addresses will be treated as farmers.
                  </p>
                  <Button 
                    onClick={confirmAsAdmin}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    ✅ Confirm This as Admin Address
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">📋 Address Details</h3>
                  <p className="text-yellow-700 text-sm">
                    <strong>Admin Address:</strong> {adminAddress}<br/>
                    <strong>Status:</strong> This will be the only admin<br/>
                    <strong>Others:</strong> All other addresses will be farmers
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
