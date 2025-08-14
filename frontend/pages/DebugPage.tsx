import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { CropInsuranceService } from '../services/crop-insurance';
import { ADMIN_ADDRESS } from '../constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function DebugPage() {
  const { connected, account } = useWallet();

  const runAdminTest = () => {
    if (connected && account) {
      const address = account.address.toString();
      console.log('=== ADMIN TEST TRIGGERED ===');
      console.log('Your wallet address:', address);
      console.log('Expected admin address:', ADMIN_ADDRESS);
      
      // Test the admin function
      const isAdmin = CropInsuranceService.isAdmin(address);
      console.log('Admin test result:', isAdmin);
      
      // Also test direct comparison
      const normalized1 = address.toLowerCase().replace(/^0x/, '');
      const normalized2 = ADMIN_ADDRESS.toLowerCase().replace(/^0x/, '');
      console.log('Direct comparison result:', normalized1 === normalized2);
      
      alert(`Admin test complete. Check console for details. Result: ${isAdmin ? 'ADMIN' : 'NOT ADMIN'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Information</h1>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Wallet Information */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Information</CardTitle>
            </CardHeader>
            <CardContent>
              {connected && account ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold">Address:</span>
                      <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                        {account.address.toString()}
                      </code>
                    </div>
                    <div>
                      <span className="font-semibold">Admin Status:</span>
                      <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                        {CropInsuranceService.isAdmin(account.address.toString()) ? 'ADMIN ✅' : 'Not Admin ❌'}
                      </code>
                    </div>
                  </div>
                  <Button onClick={runAdminTest} className="w-full bg-blue-600 hover:bg-blue-700">
                    🔍 Run Detailed Admin Test
                  </Button>
                </div>
              ) : (
                <p className="text-gray-600">Wallet not connected</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Wallet Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Connected:</strong> {connected ? 'Yes' : 'No'}</p>
                <p><strong>Account Address:</strong> {account?.address?.toString() || 'Not available'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Expected Admin Address:</strong></p>
                <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                  {ADMIN_ADDRESS}
                </code>
                
                <p><strong>Current Address (if connected):</strong></p>
                <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                  {account?.address?.toString() || 'Not connected'}
                </code>

                <p><strong>Address Match:</strong> {
                  connected && account 
                    ? (account.address.toString().toLowerCase() === ADMIN_ADDRESS.toLowerCase() ? 'YES ✅' : 'NO ❌')
                    : 'Cannot check - not connected'
                }</p>

                <p><strong>Is Admin (Service Check):</strong> {
                  connected && account 
                    ? (CropInsuranceService.isAdmin(account.address.toString()) ? 'YES ✅' : 'NO ❌')
                    : 'Cannot check - not connected'
                }</p>
              </div>
            </CardContent>
          </Card>

          {connected && account && (
            <Card>
              <CardHeader>
                <CardTitle>Address Comparison Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Current Address (lowercase):</strong></p>
                  <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                    {account.address.toString().toLowerCase()}
                  </code>
                  
                  <p><strong>Admin Address (lowercase):</strong></p>
                  <code className="block bg-gray-100 p-2 rounded text-sm break-all">
                    {ADMIN_ADDRESS.toLowerCase()}
                  </code>

                  <p><strong>Exact Match:</strong> {
                    account.address.toString().toLowerCase() === ADMIN_ADDRESS.toLowerCase() ? 'YES ✅' : 'NO ❌'
                  }</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
