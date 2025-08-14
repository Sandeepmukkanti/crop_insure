import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CropInsuranceService } from '../services/crop-insurance';
import { ADMIN_ADDRESS } from '../constants';
import { Shield, User, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function AdminTest() {
  const { connected, account } = useWallet();

  if (!connected || !account) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center text-yellow-800">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Connect Wallet to Test Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-700">
            Connect your wallet to see if you have admin privileges.
          </p>
        </CardContent>
      </Card>
    );
  }

  const userAddress = account.address.toString();
  const isAdmin = CropInsuranceService.isAdmin(userAddress);
  const isExactMatch = userAddress.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  return (
    <Card className={`border-2 ${isAdmin ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'}`}>
      <CardHeader>
        <CardTitle className={`flex items-center ${isAdmin ? 'text-green-800' : 'text-blue-800'}`}>
          {isAdmin ? (
            <CheckCircle className="h-6 w-6 mr-2 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 mr-2 text-blue-600" />
          )}
          Admin Access Test Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address Comparison */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Expected Admin Address:</p>
              <code className="text-xs bg-white p-2 rounded block mt-1 break-all">
                {ADMIN_ADDRESS}
              </code>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">Your Wallet Address:</p>
              <code className="text-xs bg-white p-2 rounded block mt-1 break-all">
                {userAddress}
              </code>
            </div>
          </div>
        </div>

        {/* Match Status */}
        <div className={`p-4 rounded-lg ${isAdmin ? 'bg-green-100 border border-green-300' : 'bg-blue-100 border border-blue-300'}`}>
          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-blue-600" />
            )}
            <span className={`font-semibold ${isAdmin ? 'text-green-800' : 'text-blue-800'}`}>
              {isAdmin ? 'ADMIN ACCESS GRANTED' : 'FARMER ACCESS ONLY'}
            </span>
          </div>
          <p className={`text-sm mt-2 ${isAdmin ? 'text-green-700' : 'text-blue-700'}`}>
            {isAdmin ? (
              <>
                🎉 <strong>You are the admin!</strong> You have full system access and can:
                <br />• Create policy templates
                <br />• Process insurance claims  
                <br />• Access admin dashboard
              </>
            ) : (
              <>
                👨‍🌾 <strong>You are a farmer.</strong> You can:
                <br />• Buy insurance policies from available templates
                <br />• Submit insurance claims
                <br />• View your policies and claims history
              </>
            )}
          </p>
        </div>

        {/* Address Match Details */}
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <p><strong>Technical Details:</strong></p>
          <p>• Exact match: {isExactMatch ? '✅ Yes' : '❌ No'}</p>
          <p>• Case-insensitive match: {isAdmin ? '✅ Yes' : '❌ No'}</p>
          <p>• Admin check result: {isAdmin ? '✅ true' : '❌ false'}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {isAdmin ? (
            <Button className="bg-green-600 hover:bg-green-700" asChild>
              <a href="/admin">Go to Admin Dashboard</a>
            </Button>
          ) : (
            <Button className="bg-blue-600 hover:bg-blue-700" asChild>
              <a href="/farmer-dashboard">Go to Farmer Dashboard</a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
