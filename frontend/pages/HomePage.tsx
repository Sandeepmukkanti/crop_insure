import { Link } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Users, Clock, TrendingUp, FileText, CheckCircle } from 'lucide-react';
import { CropInsuranceService } from '../services/crop-insurance';

export default function HomePage() {
  const { connected, connect, wallets, account } = useWallet();

  const isAdmin = account ? CropInsuranceService.isAdmin(account.address.toString()) : false;

  // Debug information
  console.log('🏠 HomePage Debug:', {
    connected,
    accountAddress: account?.address.toString(),
    isAdmin,
    expectedAdminAddress: '0xc2cfcb9a1855d38256bb59a8f94cc12d3f6d58679e703636868d8b07d426ab90'
  });

  const handleAdminConnect = async () => {
    try {
      if (wallets.length > 0) {
        const availableWallet = wallets.find(wallet => wallet.readyState === 'Installed') || wallets[0];
        await connect(availableWallet.name);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Protect Your Crops with</span>{' '}
                  <span className="block text-green-600 xl:inline">Blockchain Insurance</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Secure, transparent, and fair crop insurance powered by Aptos blockchain. 
                  Get instant coverage for your agricultural investments with automated claims processing.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/register-farmer"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 md:py-4 md:text-lg md:px-10"
                    >
                      🌾 Register as Farmer
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    {connected && isAdmin ? (
                      <Link
                        to="/admin"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                      >
                        👨‍💼 Admin Dashboard
                      </Link>
                    ) : (
                      <button
                        onClick={handleAdminConnect}
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 md:py-4 md:text-lg md:px-10"
                      >
                        🔐 Connect Wallet (Admin)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full sm:h-72 md:h-96 lg:w-full lg:h-full bg-green-500 flex items-center justify-center">
            <div className="text-center text-white">
              <Shield className="h-24 w-24 mx-auto mb-4" />
              <p className="text-lg font-semibold">Secure • Transparent • Fair</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Statistics</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Trusted by farmers worldwide
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Policies</dt>
                      <dd className="text-lg font-medium text-gray-900">1,247</dd>
                    </dl>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Coverage Amount</dt>
                      <dd className="text-lg font-medium text-gray-900">₹2.5M APT</dd>
                    </dl>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Avg. Claim Time</dt>
                      <dd className="text-lg font-medium text-gray-900">24 hours</dd>
                    </dl>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center p-6">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Claims Settled</dt>
                      <dd className="text-lg font-medium text-gray-900">98.5%</dd>
                    </dl>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Process</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              How It Works
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Simple steps to protect your crops with blockchain-powered insurance
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                      <span className="text-2xl font-bold text-green-600">1</span>
                    </div>
                  </div>
                  <CardTitle>Buy Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Choose your crop type, coverage amount, and duration. 
                    Pay premium using APT tokens through your connected wallet.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                      <span className="text-2xl font-bold text-green-600">2</span>
                    </div>
                  </div>
                  <CardTitle>Submit Claim</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    If your crops are damaged, submit a claim with details. 
                    Our automated system will process your request quickly.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="flex justify-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                      <span className="text-2xl font-bold text-green-600">3</span>
                    </div>
                  </div>
                  <CardTitle>Get Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Once approved by our admin team, receive instant payout 
                    directly to your wallet. No paperwork, no delays.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to protect your crops?</span>
            <span className="block">Start with your first policy.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-green-200">
            Join thousands of farmers who trust our blockchain-powered insurance platform.
          </p>
          <div className="mt-8">
            {connected ? (
              <Link
                to="/buy-policy"
                className="w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-green-600 bg-white hover:bg-green-50 sm:w-auto"
              >
                Buy Your First Policy
              </Link>
            ) : (
              <div className="space-y-2">
                <p className="text-green-200 text-sm">Connect your wallet to get started</p>
                <Button variant="outline" className="bg-white text-green-600 hover:bg-green-50">
                  <FileText className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}