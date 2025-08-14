import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CropInsuranceService } from '../services/crop-insurance';
import { ADMIN_ADDRESS } from '../constants';
import { Shield, User, Wallet, CheckCircle, XCircle, AlertTriangle, Crown } from 'lucide-react';

export default function AdminTestPage() {
  const { connected, account, connect, disconnect, wallets } = useWallet();

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

  const userAddress = account?.address.toString();
  const isAdmin = account ? CropInsuranceService.isAdmin(userAddress!) : false;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔐 Admin Role Test Page
          </h1>
          <p className="text-lg text-gray-600">
            Connect your wallet to test if you have admin access
          </p>
        </div>

        {/* Wallet Connection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Wallet Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant={connected ? "default" : "secondary"}>
                  {connected ? "Connected" : "Not Connected"}
                </Badge>
                {connected && userAddress && (
                  <span className="text-sm text-gray-600 font-mono">
                    {CropInsuranceService.formatAddress(userAddress)}
                  </span>
                )}
              </div>
              <Button onClick={handleWalletAction} variant={connected ? "outline" : "default"}>
                <Wallet className="h-4 w-4 mr-2" />
                {connected ? "Disconnect" : "Connect Wallet"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Address Reference */}
        <Card className="mb-8 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <Crown className="h-5 w-5 mr-2" />
              Expected Admin Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-purple-700">
                The system expects this exact address to be the admin:
              </p>
              <div className="bg-white p-4 rounded-lg border">
                <code className="text-sm break-all text-purple-900 font-mono">
                  {ADMIN_ADDRESS}
                </code>
              </div>
              <p className="text-sm text-purple-600">
                💡 This is the address that deployed the smart contract
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {connected && userAddress ? (
          <Card className={`border-2 ${isAdmin ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${isAdmin ? 'text-green-800' : 'text-blue-800'}`}>
                {isAdmin ? (
                  <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
                ) : (
                  <XCircle className="h-6 w-6 mr-2 text-blue-600" />
                )}
                {isAdmin ? "🎉 ADMIN ACCESS DETECTED!" : "👨‍🌾 FARMER ACCESS ONLY"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Your Address */}
              <div>
                <p className="font-medium text-gray-900 mb-2">Your Connected Address:</p>
                <div className="bg-white p-4 rounded-lg border">
                  <code className="text-sm break-all text-gray-900 font-mono">
                    {userAddress}
                  </code>
                </div>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">Expected (Admin):</p>
                  <code className="text-xs bg-white p-2 rounded block break-all">
                    {ADMIN_ADDRESS.toLowerCase()}
                  </code>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">Your Address:</p>
                  <code className="text-xs bg-white p-2 rounded block break-all">
                    {userAddress.toLowerCase()}
                  </code>
                </div>
              </div>

              {/* Match Result */}
              <div className={`p-4 rounded-lg ${isAdmin ? 'bg-green-100 border border-green-300' : 'bg-blue-100 border border-blue-300'}`}>
                <div className="flex items-center space-x-2 mb-3">
                  {isAdmin ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-bold text-green-800">ADDRESSES MATCH! ✅</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-bold text-blue-800">ADDRESSES DO NOT MATCH ❌</span>
                    </>
                  )}
                </div>
                
                {isAdmin ? (
                  <div className="space-y-2">
                    <p className="text-green-800 font-semibold">🎉 Congratulations! You are the admin!</p>
                    <div className="text-sm text-green-700">
                      <p><strong>You can now:</strong></p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Create policy templates for farmers</li>
                        <li>Process insurance claims</li>
                        <li>Access the admin dashboard</li>
                        <li>Manage the entire insurance system</li>
                      </ul>
                    </div>
                    <div className="mt-4 space-x-3">
                      <Button className="bg-green-600 hover:bg-green-700" asChild>
                        <a href="/admin">Go to Admin Dashboard</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/buy-policy">View Policy Templates</a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-blue-800 font-semibold">👨‍🌾 You are a farmer</p>
                    <div className="text-sm text-blue-700">
                      <p><strong>You can:</strong></p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Buy insurance policies from available templates</li>
                        <li>Submit claims on your policies</li>
                        <li>View your policy and claim history</li>
                        <li>Access the farmer dashboard</li>
                      </ul>
                    </div>
                    <div className="mt-4 space-x-3">
                      <Button className="bg-blue-600 hover:bg-blue-700" asChild>
                        <a href="/farmer-dashboard">Go to Farmer Dashboard</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/buy-policy">Browse Policies</a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Details */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <p className="font-medium text-gray-900 mb-2">🔍 Technical Details:</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• Address comparison: Case-insensitive</p>
                  <p>• Admin check function: <code>CropInsuranceService.isAdmin()</code></p>
                  <p>• Result: <code>{isAdmin ? 'true' : 'false'}</code></p>
                  <p>• Contract admin address: <code>{CropInsuranceService.formatAddress(ADMIN_ADDRESS)}</code></p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center text-yellow-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Wallet Not Connected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-yellow-700">
                  Please connect your wallet to test admin access
                </p>
                <Button onClick={handleWalletAction} className="bg-yellow-600 hover:bg-yellow-700">
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-8 border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <Shield className="h-5 w-5 mr-2" />
              How to Test Admin Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>Step 1:</strong> Connect your wallet using the button above</p>
              <p><strong>Step 2:</strong> Check if your address matches the expected admin address</p>
              <p><strong>Step 3:</strong> If they match, you'll see "ADMIN ACCESS DETECTED!"</p>
              <p><strong>Step 4:</strong> If they don't match, you'll see "FARMER ACCESS ONLY"</p>
              <div className="mt-4 p-3 bg-white rounded border">
                <p className="font-medium text-gray-900">💡 Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Only ONE wallet address can be admin</li>
                  <li>The admin is whoever deployed the smart contract</li>
                  <li>Everyone else is automatically a farmer</li>
                  <li>You cannot "become" admin unless you deployed the contract</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
