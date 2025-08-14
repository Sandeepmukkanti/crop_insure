import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CropInsuranceService } from '../services/crop-insurance';
import { ADMIN_ADDRESS } from '../constants';
import { Shield, User, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from './ui/use-toast';
import AdminTest from './AdminTest';

export default function AdminInfo() {
  const { connected, account } = useWallet();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const isAdmin = account ? CropInsuranceService.isAdmin(account.address.toString()) : false;
  
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
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Admin Information
          </CardTitle>
          <CardDescription>
            Admin role identification and current status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Single Admin Notice */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center mb-2">
              <Shield className="h-5 w-5 text-orange-600 mr-2" />
              <span className="font-semibold text-orange-800">Single Admin System</span>
            </div>
            <p className="text-sm text-orange-700">
              This system has <strong>exactly ONE admin</strong> and <strong>unlimited farmers</strong>:
            </p>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="text-orange-800 font-medium">👑 Admin (1)</div>
                <div className="text-orange-600 text-xs">Contract Publisher Only</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-blue-800 font-medium">👨‍🌾 Farmers (∞)</div>
                <div className="text-blue-600 text-xs">Everyone Else</div>
              </div>
            </div>
          </div>

          {/* Admin Address Info */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">Admin Address:</span>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Contract Publisher
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                {ADMIN_ADDRESS}
              </code>
              <button
                onClick={() => copyAddress(ADMIN_ADDRESS)}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Copy admin address"
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* Current User Status */}
          {connected && account ? (
            <div className="p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-700">Your Address:</span>
                <Badge 
                  variant={isAdmin ? "default" : "secondary"}
                  className={isAdmin ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  <User className="h-3 w-3 mr-1" />
                  {isAdmin ? "Admin" : "Farmer"}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                  {account.address.toString()}
                </code>
                <button
                  onClick={() => copyAddress(account.address.toString())}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Copy your address"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              </div>
              
              {isAdmin ? (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✅ <strong>You are the admin!</strong> You can:
                  </p>
                  <ul className="text-sm text-green-700 mt-1 ml-4 space-y-1">
                    <li>• Create policy templates</li>
                    <li>• Manage existing templates</li>
                    <li>• Process insurance claims</li>
                    <li>• Access admin dashboard</li>
                  </ul>
                </div>
              ) : (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    👤 <strong>You are a farmer.</strong> You can:
                  </p>
                  <ul className="text-sm text-blue-700 mt-1 ml-4 space-y-1">
                    <li>• Buy insurance policies from available templates</li>
                    <li>• File claims on your policies</li>
                    <li>• View your policy and claim history</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Connect your wallet</strong> to see your role and access the system.
              </p>
            </div>
          )}

          {/* How to become admin */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-medium text-gray-900 mb-2">⚠️ Single Admin System:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Only ONE admin exists</strong> - the contract publisher/deployer</li>
              <li>• Currently set to: <code className="bg-white px-1 rounded">{CropInsuranceService.formatAddress(ADMIN_ADDRESS)}</code></li>
              <li>• Admin can create policy templates and process claims</li>
              <li>• All other wallet addresses are treated as farmers</li>
              <li>• To be admin, you must connect the wallet that deployed this contract</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Live Admin Test */}
      <AdminTest />
    </div>
  );
}
