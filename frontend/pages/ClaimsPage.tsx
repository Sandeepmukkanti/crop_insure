import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { CropInsuranceService } from '../services/crop-insurance';
import { POLICY_STATUS, CLAIM_STATUS } from '../constants';
import type { Policy, Claim } from '../types/crop-insurance';
import { FileText, Shield, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Calendar } from 'lucide-react';

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

export default function ClaimsPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<string>('');
  const [claimReason, setClaimReason] = useState('');

  const fetchData = async () => {
    if (!connected || !account) return;

    setLoading(true);
    try {
      // Try blockchain first, fallback to localStorage
      let userPolicies: Policy[] = [];
      let allClaims: Claim[] = [];
      
      try {
        userPolicies = await CropInsuranceService.getPoliciesByFarmer(account.address.toString());
        allClaims = await CropInsuranceService.getAllClaims();
      } catch (blockchainError) {
        console.log('Blockchain not available, using localStorage fallback');
        
        // Get policies from localStorage
        const localPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
        userPolicies = localPolicies.filter((policy: Policy) => 
          policy.farmer.toLowerCase() === account.address.toString().toLowerCase()
        );
        
        // Get claims from localStorage
        const localClaims = JSON.parse(localStorage.getItem('allClaims') || '[]');
        allClaims = localClaims;
      }
      
      setPolicies(userPolicies);
      
      // Filter claims for this user and update status from approved claims
      const approvedClaims = JSON.parse(localStorage.getItem('approvedClaims') || '[]');
      const rejectedClaims = JSON.parse(localStorage.getItem('rejectedClaims') || '[]');
      
      const userClaims = allClaims.filter(claim => 
        claim.farmer.toLowerCase() === account.address.toString().toLowerCase()
      ).map(claim => {
        // Check if this claim has been approved
        const approved = approvedClaims.find((approved: any) => approved.id === claim.id);
        if (approved) {
          return { ...claim, status: 2, processed_at: Math.floor(approved.approvedAt / 1000).toString() };
        }
        
        // Check if this claim has been rejected
        const rejected = rejectedClaims.find((rejected: any) => rejected.id === claim.id);
        if (rejected) {
          return { ...claim, status: 3, processed_at: Math.floor(rejected.rejectedAt / 1000).toString() };
        }
        
        return claim;
      });
      
      setClaims(userClaims);
      
      console.log('Fetched user policies:', userPolicies);
      console.log('Fetched user claims:', userClaims);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load your policies and claims.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [connected, account]);

  const getEligiblePolicies = () => {
    return policies.filter(policy => 
      policy.status === POLICY_STATUS.ACTIVE &&
      Date.now() <= parseInt(policy.end_time) * 1000
    );
  };

  const getClaimStatus = (status: number) => {
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
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPolicy || !claimReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a policy and provide a claim reason.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingClaim(true);

    try {
      const transactionPayload = CropInsuranceService.submitClaimTransaction({
        policy_id: selectedPolicy,
        reason: claimReason.trim(),
      });

      const response = await signAndSubmitTransaction({
        sender: account!.address,
        data: {
          function: transactionPayload.function as `${string}::${string}::${string}`,
          functionArguments: transactionPayload.functionArguments,
        },
        options: {
          maxGasAmount: 5000,
          gasUnitPrice: 100,
        },
      });

      toast({
        title: "Claim Submitted Successfully!",
        description: `Transaction hash: ${response.hash.slice(0, 10)}...`,
      });

      // Reset form
      setSelectedPolicy('');
      setClaimReason('');
      
      // Refresh data
      fetchData();

    } catch (error) {
      console.error('Error submitting claim to blockchain:', error);
      
      // Fallback to localStorage
      try {
        const claim = {
          id: Date.now().toString(),
          policy_id: selectedPolicy,
          farmer: account!.address.toString(),
          reason: claimReason.trim(),
          submitted_at: Math.floor(Date.now() / 1000).toString(), // Convert to seconds like blockchain
          status: 1, // Pending status
          processed_at: "0",
        };

        const existingClaims = JSON.parse(localStorage.getItem('allClaims') || '[]');
        existingClaims.push(claim);
        localStorage.setItem('allClaims', JSON.stringify(existingClaims));
        
        console.log('Claim saved to localStorage:', claim);
        console.log('All claims in localStorage:', existingClaims);

        toast({
          title: "Claim Submitted Successfully!",
          description: "Claim saved (blockchain currently unavailable)",
        });

        // Reset form
        setSelectedPolicy('');
        setClaimReason('');
        
        // Refresh data
        fetchData();

      } catch (storageError) {
        console.error('Error saving claim to localStorage:', storageError);
        toast({
          title: "Error Submitting Claim",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmittingClaim(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
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
              You need to connect your wallet to submit claims
            </p>
          </div>
        </div>
      </div>
    );
  }

  const eligiblePolicies = getEligiblePolicies();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Claims Management</h1>
          <p className="mt-2 text-lg text-gray-600">
            Submit new claims and track existing ones
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Submit New Claim */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Submit New Claim
              </CardTitle>
              <CardDescription>
                Submit a claim for damages to your insured crops
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eligiblePolicies.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-orange-500 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    No eligible policies found. You need an active policy to submit a claim.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitClaim} className="space-y-4">
                  <div>
                    <Label htmlFor="policySelect">Select Policy *</Label>
                    <select
                      id="policySelect"
                      title="Select policy for claim"
                      value={selectedPolicy}
                      onChange={(e) => setSelectedPolicy(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                      required
                    >
                      <option value="">Select a policy</option>
                      {eligiblePolicies.map((policy) => (
                        <option key={policy.id} value={policy.id}>
                          Policy #{policy.id} - {policy.crop_type} ({CropInsuranceService.octasToApt(policy.coverage_amount).toFixed(2)} APT)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="claimReason">Claim Reason *</Label>
                    <Input
                      id="claimReason"
                      value={claimReason}
                      onChange={(e) => setClaimReason(e.target.value)}
                      placeholder="Describe the damage to your crops..."
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Provide details about what happened to your crops
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={submittingClaim}
                  >
                    {submittingClaim ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Claim...
                      </>
                    ) : (
                      'Submit Claim'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Existing Claims */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Claims
              </CardTitle>
              <CardDescription>
                Track the status of your submitted claims
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">Loading claims...</p>
                </div>
              ) : claims.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    No claims submitted yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => (
                    <div key={claim.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">Claim #{claim.id}</p>
                          <p className="text-sm text-gray-600">Policy #{claim.policy_id}</p>
                        </div>
                        {getClaimStatus(claim.status)}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Reason:</strong> {claim.reason}
                      </p>
                      
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-3 w-3 mr-1" />
                        Submitted: {formatDate(claim.submitted_at)}
                        {claim.processed_at !== '0' && (
                          <>
                            {' • '}
                            Processed: {formatDate(claim.processed_at)}
                          </>
                        )}
                      </div>

                      {claim.status === CLAIM_STATUS.APPROVED && (
                        <div className="mt-2 flex items-center text-sm text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Claim approved and payout processed
                        </div>
                      )}

                      {claim.status === CLAIM_STATUS.REJECTED && (
                        <div className="mt-2 flex items-center text-sm text-red-600">
                          <XCircle className="h-4 w-4 mr-1" />
                          Claim was rejected
                        </div>
                      )}

                      {claim.status === CLAIM_STATUS.PENDING && (
                        <div className="mt-2 flex items-center text-sm text-yellow-600">
                          <Clock className="h-4 w-4 mr-1" />
                          Under review by admin team
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
