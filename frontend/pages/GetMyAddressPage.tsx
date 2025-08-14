import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/ui/use-toast';

export default function GetMyAddressPage() {
  const { connected, account, connect, disconnect, wallets } = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleWalletAction = async () => {
    if (connected) {
      await disconnect();
    } else {
      const availableWallet = wallets.find(wallet => wallet.readyState === 'Installed');
      if (availableWallet) {
        await connect(availableWallet.name);
      }
    }
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: "Address Copied!",
        description: "Address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            📋 Get Your Wallet Address
          </h1>
          <p className="text-lg text-gray-600">
            Connect your wallet to get your address for admin setup
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Wallet Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {connected && account ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold mb-2">✅ Wallet Connected!</p>
                  <p className="text-green-700 text-sm">Copy this address to make yourself admin:</p>
                </div>
                
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono break-all flex-1 mr-4">
                      {account.address.toString()}
                    </code>
                    <Button
                      onClick={() => copyAddress(account.address.toString())}
                      size="sm"
                      variant="outline"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-semibold mb-2">📝 Next Steps:</p>
                  <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                    <li>Copy your address above</li>
                    <li>I'll update the constants.ts file to make you admin</li>
                    <li>Then you can create policy templates</li>
                    <li>Farmers can register and buy your policies</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-gray-600">Connect your wallet to see your address</p>
                <Button onClick={handleWalletAction}>
                  Connect Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
