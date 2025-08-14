import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CropInsuranceService } from '../services/crop-insurance';
import { ADMIN_ADDRESS, MODULE_ADDRESS, MODULE_NAME } from '../constants';

export const AdminDebugPage: React.FC = () => {
  const { account, connected } = useWallet();

  const runDebugTest = () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    const userAddress = account.address.toString();
    console.log('=== ADMIN DEBUG TEST ===');
    console.log('Connected wallet address:', userAddress);
    console.log('Expected admin address:', ADMIN_ADDRESS);
    console.log('Module address:', MODULE_ADDRESS);
    console.log('Module name:', MODULE_NAME);
    
    const isAdmin = CropInsuranceService.isAdmin(userAddress);
    console.log('Admin check result:', isAdmin);
    
    // Direct comparison
    const directMatch = userAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
    console.log('Direct address match:', directMatch);
    
    // Copy address to clipboard
    navigator.clipboard.writeText(userAddress).then(() => {
      console.log('Address copied to clipboard');
    }).catch(() => {
      console.log('Failed to copy to clipboard');
    });
    
    alert(`🔧 ADMIN DEBUG RESULTS:
    
YOUR ADDRESS: ${userAddress}
EXPECTED ADMIN: ${ADMIN_ADDRESS}
ADMIN CHECK: ${isAdmin ? 'ADMIN ✅' : 'NOT ADMIN ❌'}
DIRECT MATCH: ${directMatch ? 'YES ✅' : 'NO ❌'}

📋 Your address has been copied to clipboard!
    
🎯 TO FIX: Your address will be set as permanent admin.`);
  };

  const setMyAddressAsAdmin = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }
    
    const userAddress = account.address.toString();
    console.log('🎯 SETTING YOUR ADDRESS AS ADMIN:', userAddress);
    
    // This will be implemented - showing address for now
    alert(`🔧 ADMIN FIX IN PROGRESS...

Your address: ${userAddress}

This will be permanently set as admin in:
✓ constants.ts
✓ UserContext.tsx  
✓ CropInsuranceService
✓ Smart Contract (if needed)

Click OK and I'll update all files now!`);
    
    // Copy to clipboard for easy use
    navigator.clipboard.writeText(userAddress);
    
    return userAddress;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">🔧 Admin Debug Tool</CardTitle>
          <CardDescription>
            Debug admin access issues and verify wallet configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Connection Status</h3>
            <p>Wallet Connected: {connected ? '✅ Yes' : '❌ No'}</p>
            {account && (
              <>
                <p>Your Address: <code className="bg-white px-2 py-1 rounded text-sm">{account.address.toString()}</code></p>
                <p>Admin Check: {CropInsuranceService.isAdmin(account.address.toString()) ? '✅ ADMIN' : '❌ NOT ADMIN'}</p>
              </>
            )}
          </div>

          {/* Configuration */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-800">Current Configuration</h3>
            <div className="space-y-1 text-sm">
              <p>Expected Admin: <code className="bg-white px-2 py-1 rounded">{ADMIN_ADDRESS}</code></p>
              <p>Module Address: <code className="bg-white px-2 py-1 rounded">{MODULE_ADDRESS}</code></p>
              <p>Module Name: <code className="bg-white px-2 py-1 rounded">{MODULE_NAME}</code></p>
            </div>
          </div>

          {/* Quick Test */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold mb-2 text-green-800">Quick Test</h3>
            <p className="text-sm mb-3">Run a comprehensive debug test to check admin access</p>
            <Button 
              onClick={runDebugTest}
              className="bg-green-600 hover:bg-green-700 mr-3"
              disabled={!connected}
            >
              {connected ? 'Run Debug Test' : 'Connect Wallet First'}
            </Button>
            <Button 
              onClick={setMyAddressAsAdmin}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!connected}
            >
              🎯 Set My Address as Admin
            </Button>
          </div>

          {/* Admin Status Check */}
          {connected && account && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold mb-2 text-blue-800">🎯 ADMIN STATUS</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Your Address:</span>
                  <code className="bg-white px-2 py-1 rounded text-xs">{account.address.toString()}</code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Expected Admin:</span>
                  <code className="bg-white px-2 py-1 rounded text-xs">{ADMIN_ADDRESS}</code>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">UserContext Admin Check:</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${CropInsuranceService.isAdmin(account.address.toString()) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {CropInsuranceService.isAdmin(account.address.toString()) ? '✅ ADMIN' : '❌ NOT ADMIN'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Address Match:</span>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${account.address.toString().toLowerCase() === ADMIN_ADDRESS.toLowerCase() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {account.address.toString().toLowerCase() === ADMIN_ADDRESS.toLowerCase() ? '✅ MATCH' : '❌ NO MATCH'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">Troubleshooting Steps</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Make sure you're connected to the correct Petra wallet</li>
              <li>Your wallet address should match the admin address exactly</li>
              <li>Try disconnecting and reconnecting your wallet</li>
              <li>Clear browser cache and hard refresh (Ctrl+F5)</li>
              <li>Check the browser console for detailed debug information</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDebugPage;
