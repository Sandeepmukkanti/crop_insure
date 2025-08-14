import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { CropInsuranceService } from '../services/crop-insurance';
import { POLICY_STATUS, CLAIM_STATUS } from '../constants';
import type { Policy, Claim } from '../types/crop-insurance';
import { 
  Shield, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  FileText,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function FarmerDashboardPage() {
  const { connected, account } = useWallet();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!connected || !account) return;

    setLoading(true);
    try {
      const [farmerPolicies, allClaims] = await Promise.all([
        CropInsuranceService.getPoliciesByFarmer(account.address.toString()),
        CropInsuranceService.getAllClaims()
      ]);
      
      setPolicies(farmerPolicies);
      // Filter claims for current farmer
      const farmerClaims = allClaims.filter(claim => 
        claim.farmer.toLowerCase() === account.address.toString().toLowerCase()
      );
      setClaims(farmerClaims);
    } catch (error) {
      console.error('Error fetching farmer data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load your dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [connected, account]);

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
  };

  const getStatusBadge = (status: number, type: 'policy' | 'claim') => {
    if (type === 'policy') {
      switch (status) {
        case POLICY_STATUS.ACTIVE:
          return <Badge>Active</Badge>;
        case POLICY_STATUS.EXPIRED:
          return <Badge variant="secondary">Expired</Badge>;
        case POLICY_STATUS.CLAIMED:
          return <Badge variant="warning">Claimed</Badge>;
        default:
          return <Badge variant="secondary">Unknown</Badge>;
      }
    } else {
      switch (status) {
        case CLAIM_STATUS.PENDING:
          return <Badge variant="warning">Pending</Badge>;
        case CLAIM_STATUS.APPROVED:
          return <Badge>Approved</Badge>;
        case CLAIM_STATUS.REJECTED:
          return <Badge variant="destructive">Rejected</Badge>;
        default:
          return <Badge variant="secondary">Unknown</Badge>;
      }
    }
  };

  const activePolicies = policies.filter(p => p.status === POLICY_STATUS.ACTIVE);
  const totalCoverage = activePolicies.reduce((sum, p) => sum + CropInsuranceService.octasToApt(p.coverage_amount), 0);
  const totalPremiumPaid = policies.reduce((sum, p) => sum + CropInsuranceService.octasToApt(p.premium), 0);
  const pendingClaims = claims.filter(c => c.status === CLAIM_STATUS.PENDING);

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
              You need to connect your wallet to access your farmer dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Farmer Dashboard</h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your crop insurance policies and claims
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex flex-wrap gap-4">
          <Link to="/buy-policy">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Buy New Policy
            </Button>
          </Link>
          <Link to="/claims">
            <Button variant="outline" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Submit Claim
            </Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Policies
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {activePolicies.length}
                  </dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Coverage
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalCoverage.toFixed(2)} APT
                  </dd>
                </dl>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Premium Paid
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {totalPremiumPaid.toFixed(2)} APT
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                My Policies
              </CardTitle>
              <CardDescription>
                Your current and past insurance policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading policies...</p>
                </div>
              ) : policies.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    You don't have any policies yet.
                  </p>
                  <Link to="/buy-policy">
                    <Button className="mt-4">Buy Your First Policy</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {policies.slice(0, 5).map((policy) => (
                    <div key={policy.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Policy #{policy.id}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {policy.crop_type}
                          </p>
                        </div>
                        {getStatusBadge(policy.status, 'policy')}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Coverage:</span>
                          <p className="font-medium">
                            {CropInsuranceService.octasToApt(policy.coverage_amount).toFixed(2)} APT
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Premium:</span>
                          <p className="font-medium">
                            {CropInsuranceService.octasToApt(policy.premium).toFixed(2)} APT
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mt-3">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(policy.start_time)} - {formatDate(policy.end_time)}
                      </div>
                    </div>
                  ))}
                  {policies.length > 5 && (
                    <Link to="/my-policies">
                      <Button variant="outline" className="w-full">
                        View All Policies ({policies.length})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Claims */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                My Claims
              </CardTitle>
              <CardDescription>
                Status of your insurance claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claims.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    No claims submitted yet.
                  </p>
                  {activePolicies.length > 0 && (
                    <Link to="/claims">
                      <Button className="mt-4">Submit a Claim</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {claims.slice(0, 5).map((claim) => (
                    <div key={claim.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">Claim #{claim.id}</p>
                          <p className="text-sm text-gray-600">
                            Policy #{claim.policy_id}
                          </p>
                        </div>
                        {getStatusBadge(claim.status, 'claim')}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Reason:</strong> {claim.reason}
                      </p>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Submitted: {formatDate(claim.submitted_at)}
                        {claim.processed_at && claim.processed_at !== "0" && (
                          <span className="ml-4">
                            Processed: {formatDate(claim.processed_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {claims.length > 5 && (
                    <Link to="/claims">
                      <Button variant="outline" className="w-full">
                        View All Claims ({claims.length})
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
