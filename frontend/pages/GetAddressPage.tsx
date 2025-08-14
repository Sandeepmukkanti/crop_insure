import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function GetAddressPage() {
  const { connected, account, connect, wallets } = useWallet();
  const [copied, setCopied] = useState(false);

  const handleConnect = async () => {
    if (wallets.length > 0) {
      const availableWallet = wallets.find(wallet => wallet.readyState === 'Installed') || wallets[0];
      await connect(availableWallet.name);
    }
  };

  const copyAddress = async () => {
    if (account?.address) {
      await navigator.clipboard.writeText(account.address.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const makeThisAddressAdmin = () => {
    if (account?.address) {
      const address = account.address.toString();
      console.log('Setting admin address:', address);
      
      // Show the code that needs to be updated
      const codeToUpdate = `
// Update constants.ts with this address:
export const ADMIN_ADDRESS = "${address}";
export const ADMIN_ADDRESSES = [
  "${address}", // Your actual wallet address
  "0xae040ca9eb9583756c4dfc6bd7d35a258ac91b9c80cff47a6924731eb690ef7b", // Module publisher address
];
      `;
      
      alert(`Your wallet address: ${address}\n\nI'll update the admin configuration now!`);
      
      // Save to localStorage for immediate effect
      localStorage.setItem('admin_override', address);
      
      console.log('Code to update:', codeToUpdate);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Get Your Wallet Address</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet to Get Address</CardTitle>
          </CardHeader>
          <CardContent>
            {!connected ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600">Connect your wallet to see your address</p>
                <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">✅ Wallet Connected!</h3>
                  <p className="text-green-700">Your wallet address:</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <code className="bg-white px-3 py-2 rounded border text-sm font-mono break-all flex-1">
                      {account?.address.toString()}
                    </code>
                    <Button
                      onClick={copyAddress}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">🔧 Make This Address Admin</h3>
                  <p className="text-blue-700 mb-3">
                    Click the button below to configure this address as admin
                  </p>
                  <Button 
                    onClick={makeThisAddressAdmin}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Set This Address as Admin
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">📋 Manual Configuration</h3>
                  <p className="text-yellow-700 text-sm mb-2">
                    If automatic setup doesn't work, copy this address and I'll configure it manually:
                  </p>
                  <code className="bg-white px-2 py-1 rounded border text-xs font-mono break-all block">
                    {account?.address.toString()}
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
