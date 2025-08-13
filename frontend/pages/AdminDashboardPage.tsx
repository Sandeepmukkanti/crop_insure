import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { CropInsuranceService } from '../services/crop-insurance';
import { CLAIM_STATUS } from '../constants';
import type { Claim, PoolStats } from '../types/crop-insurance';
import { 
  Shield, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Calendar
} from 'lucide-react';

// Create Badge component
const Badge = ({ children, variant }: { children: React.ReactNode, variant?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
    variant === 'secondary' ? 'bg-gray-100 text-gray-800' :
    variant === 'destructive' ? 'bg-red-100 text-red-800' :
    variant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
    'bg-green-100 text-green-800'
  }`}>
    {children}
  </span>
);

export default function AdminDashboardPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [allClaims, setAllClaims] = useState<Claim[]>([]);
  const [poolStats, setPoolStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingClaim, setProcessingClaim] = useState<string | null>(null);

  const isAdmin = account ? CropInsuranceService.isAdmin(account.address.toString()) : false;

  const fetchData = async () => {
    if (!connected || !account || !isAdmin) return;

    setLoading(true);
    try {
      const [pending, all, stats] = await Promise.all([
        CropInsuranceService.getPendingClaims(),
        CropInsuranceService.getAllClaims(),
        CropInsuranceService.getPoolStats()
      ]);
      
      setPendingClaims(pending);
      setAllClaims(all);
      setPoolStats(stats);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [connected, account, isAdmin]);

  const handleApproveClaim = async (claimId: string) => {
    setProcessingClaim(claimId);

    try {
      const transactionPayload = CropInsuranceService.approveClaimTransaction(claimId);

      const response = await signAndSubmitTransaction({
        sender: account!.address,
        data: {
          function: transactionPayload.function as `${string}::${string}::${string}`,
          functionArguments: transactionPayload.functionArguments,
        },
      });

      toast({
        title: "Claim Approved Successfully!",
        description: `Transaction hash: ${response.hash.slice(0, 10)}...`,
      });

      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Error approving claim:', error);
      toast({
        title: "Error Approving Claim",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingClaim(null);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    setProcessingClaim(claimId);

    try {
      const transactionPayload = CropInsuranceService.rejectClaimTransaction(claimId);

      const response = await signAndSubmitTransaction({
        sender: account!.address,
        data: {
          function: transactionPayload.function as `${string}::${string}::${string}`,
          functionArguments: transactionPayload.functionArguments,
        },
      });

      toast({
        title: "Claim Rejected",
        description: `Transaction hash: ${response.hash.slice(0, 10)}...`,
      });

      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Error rejecting claim:', error);
      toast({
        title: "Error Rejecting Claim",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingClaim(null);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const getClaimsByStatus = (status: number) => {
    return allClaims.filter(claim => claim.status === status);
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
              You need to connect your wallet to access the admin dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have admin privileges to access this page
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage claims and monitor insurance pool statistics
          </p>
        </div>

        {/* Statistics Cards */}
        {poolStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Premium Collected
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {CropInsuranceService.octasToApt(poolStats.total_premium_collected).toFixed(2)} APT
                    </dd>
                  </dl>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Claims Paid
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {CropInsuranceService.octasToApt(poolStats.total_claims_paid).toFixed(2)} APT
                    </dd>
                  </dl>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Policies
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {poolStats.total_policies}
                    </dd>
                  </dl>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Claims
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {pendingClaims.length}
                    </dd>
                  </dl>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Claims */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Claims
              </CardTitle>
              <CardDescription>
                Claims waiting for admin approval or rejection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Loading pending claims...</p>
                </div>
              ) : pendingClaims.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    No pending claims at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pendingClaims.map((claim) => (
                    <div key={claim.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Claim #{claim.id}</p>
                          <p className="text-sm text-gray-600">
                            Policy #{claim.policy_id}
                          </p>
                          <p className="text-xs text-gray-500">
                            Farmer: {CropInsuranceService.formatAddress(claim.farmer)}
                          </p>
                        </div>
                        <Badge variant="warning">Pending</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Reason:</strong> {claim.reason}
                      </p>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <Calendar className="h-3 w-3 mr-1" />
                        Submitted: {formatDate(claim.submitted_at)}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveClaim(claim.id)}
                          disabled={processingClaim === claim.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingClaim === claim.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRejectClaim(claim.id)}
                          disabled={processingClaim === claim.id}
                        >
                          {processingClaim === claim.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Claims History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Claims History
              </CardTitle>
              <CardDescription>
                Overview of all processed claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span>Approved</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {getClaimsByStatus(CLAIM_STATUS.APPROVED).length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-600 mr-2" />
                      <span>Rejected</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {getClaimsByStatus(CLAIM_STATUS.REJECTED).length}
                    </span>
                  </div>
                </div>

                <div className="mt-6 max-h-64 overflow-y-auto">
                  <h4 className="font-medium text-gray-900 mb-3">Recent Processed Claims</h4>
                  {allClaims
                    .filter(claim => claim.status !== CLAIM_STATUS.PENDING)
                    .slice(0, 10)
                    .map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="text-sm font-medium">Claim #{claim.id}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(claim.processed_at)}
                          </p>
                        </div>
                        <Badge variant={claim.status === CLAIM_STATUS.APPROVED ? 'default' : 'destructive'}>
                          {claim.status === CLAIM_STATUS.APPROVED ? 'Approved' : 'Rejected'}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
