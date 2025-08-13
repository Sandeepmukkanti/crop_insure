import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CropInsuranceService } from '../services/crop-insurance';
import { POLICY_STATUS } from '../constants';
import type { Policy } from '../types/crop-insurance';
import { Calendar, Shield, DollarSign, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';

// Create Badge component if it doesn't exist
const Badge = ({ children, variant }: { children: React.ReactNode, variant?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
    variant === 'destructive' ? 'bg-red-100 text-red-800' :
    'bg-green-100 text-green-800'
  }`}>
    {children}
  </span>
);

export default function MyPoliciesPage() {
  const { connected, account } = useWallet();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPolicies = async () => {
    if (!connected || !account) return;

    setLoading(true);
    try {
      const userPolicies = await CropInsuranceService.getPoliciesByFarmer(
        account.address.toString()
      );
      setPolicies(userPolicies);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [connected, account]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case POLICY_STATUS.ACTIVE:
        return <Badge>Active</Badge>;
      case POLICY_STATUS.EXPIRED:
        return <Badge variant="secondary">Expired</Badge>;
      case POLICY_STATUS.CLAIMED:
        return <Badge variant="destructive">Claimed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const isExpired = (endTime: string) => {
    return Date.now() > parseInt(endTime) * 1000;
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Connect Your Wallet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You need to connect your wallet to view your policies
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">My Policies</h1>
            <p className="mt-2 text-lg text-gray-600">
              View and manage your crop insurance policies
            </p>
          </div>
          <Button
            onClick={fetchPolicies}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">Loading your policies...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No policies found</h3>
            <p className="mt-2 text-gray-600">
              You haven't purchased any policies yet. Get started by buying your first policy.
            </p>
            <Button className="mt-6 bg-green-600 hover:bg-green-700">
              <a href="/buy-policy">Buy Your First Policy</a>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {policies.map((policy) => (
              <Card key={policy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {policy.crop_type}
                    </CardTitle>
                    {getStatusBadge(policy.status)}
                  </div>
                  <CardDescription>
                    Policy #{policy.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-500">Coverage</p>
                        <p className="font-semibold">
                          {CropInsuranceService.octasToApt(policy.coverage_amount).toFixed(2)} APT
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Premium</p>
                        <p className="font-semibold">
                          {CropInsuranceService.octasToApt(policy.premium).toFixed(2)} APT
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <span className="text-gray-500">Start:</span>{' '}
                        <span>{formatDate(policy.start_time)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">
                        <span className="text-gray-500">End:</span>{' '}
                        <span className={isExpired(policy.end_time) ? 'text-red-600' : ''}>
                          {formatDate(policy.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {policy.status === POLICY_STATUS.ACTIVE && !isExpired(policy.end_time) && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-green-600 font-medium">
                        ✓ Policy is active and eligible for claims
                      </p>
                    </div>
                  )}

                  {policy.status === POLICY_STATUS.CLAIMED && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-red-600 font-medium">
                        ⚠ This policy has been claimed
                      </p>
                    </div>
                  )}

                  {isExpired(policy.end_time) && policy.status === POLICY_STATUS.ACTIVE && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-orange-600 font-medium">
                        ⏰ This policy has expired
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
