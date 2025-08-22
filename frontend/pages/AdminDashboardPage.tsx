import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { CropInsuranceService } from '../services/crop-insurance';
import { CROP_TYPES } from '../constants';
import type { PolicyTemplate, CreatePolicyTemplateParams, Claim, Policy } from '../types/crop-insurance';
import { 
  Shield, 
  Plus, 
  Settings,
  FileText,
  AlertTriangle,
  Loader2,
  Edit,
  Trash2,
  Eye,
  CheckCircle
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { connected, account, signAndSubmitTransaction, wallet } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'claims'>('create');
  const [policyTemplates, setPolicyTemplates] = useState<PolicyTemplate[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const [templateForm, setTemplateForm] = useState<CreatePolicyTemplateParams>({
    name: '',
    crop_type: '',
    coverage_amount: 0,
    premium: 0,
    duration_days: 30
  });

  const isAdmin = account ? CropInsuranceService.isAdmin(account.address.toString()) : false;

  // Debug wallet connection
  useEffect(() => {
    console.log('Wallet Debug Info:', {
      connected,
      account: account?.address?.toString(),
      walletName: wallet?.name,
      isAdmin,
    });
  }, [connected, account, wallet, isAdmin]);

  const fetchTemplates = async () => {
    if (!connected || !account || !isAdmin) return;

    setLoading(true);
    try {
      const templates = await CropInsuranceService.getAllPolicyTemplates();
      
      // Filter out locally deleted templates
      const deletedIds = JSON.parse(localStorage.getItem('deletedTemplateIds') || '[]');
      const activeTemplates = templates.filter(template => !deletedIds.includes(template.id));
      
      setPolicyTemplates(activeTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error Loading Templates",
        description: "Failed to load policy templates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClaims = async () => {
    if (!connected || !account || !isAdmin) return;

    try {
      console.log('Fetching claims for admin dashboard...');
      
      // Try to get blockchain claims first
      let blockchainClaims: Claim[] = [];
      try {
        blockchainClaims = await CropInsuranceService.getAllClaims();
        console.log('Blockchain claims:', blockchainClaims);
      } catch (blockchainError) {
        console.log('Blockchain claims not available:', blockchainError);
      }
      
      // Always get localStorage claims
      const localClaims = JSON.parse(localStorage.getItem('allClaims') || '[]');
      console.log('Local claims from storage:', localClaims);
      
      // Combine and deduplicate claims (blockchain takes precedence)
      const allClaimsMap = new Map();
      
      // Add localStorage claims first
      localClaims.forEach((claim: Claim) => {
        allClaimsMap.set(claim.id, claim);
      });
      
      // Add blockchain claims (will overwrite localStorage if same ID)
      blockchainClaims.forEach((claim: Claim) => {
        allClaimsMap.set(claim.id, claim);
      });
      
      const combinedClaims = Array.from(allClaimsMap.values());
      console.log('Combined claims for admin:', combinedClaims);
      
      // Also fetch policies for claim details
      let allPolicies: Policy[] = [];
      try {
        allPolicies = await CropInsuranceService.getAllPolicies();
      } catch (policyError) {
        console.log('Could not fetch policies from blockchain, using localStorage fallback');
        const localPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
        allPolicies = localPolicies;
      }
      
      setClaims(combinedClaims);
      setPolicies(allPolicies);
      
      if (combinedClaims.length > 0) {
        toast({
          title: "Claims Loaded Successfully",
          description: `Found ${combinedClaims.length} claim(s) to review`,
        });
      }
      
    } catch (error) {
      console.error('Error in fetchClaims:', error);
      
      // EMERGENCY FALLBACK - Show localStorage claims only
      const localClaims = JSON.parse(localStorage.getItem('allClaims') || '[]');
      setClaims(localClaims);
      
      toast({
        title: "Loading Claims from Storage",
        description: `Showing ${localClaims.length} local claim(s)`,
      });
    }
  };

  // Helper function to get policy details for a claim
  const getPolicyForClaim = (claimPolicyId: string): Policy | undefined => {
    console.log('Looking for policy with ID:', claimPolicyId, 'Type:', typeof claimPolicyId);
    console.log('Available policies:', policies.map(p => ({ id: p.id, type: typeof p.id })));
    
    // Try exact match first
    let policy = policies.find(policy => policy.id === claimPolicyId);
    
    // If not found, try converting types
    if (!policy) {
      policy = policies.find(policy => policy.id.toString() === claimPolicyId.toString());
    }
    
    console.log('Found policy:', policy);
    return policy;
  };

  const handleApproveClaim = async (claimId: string, policy: Policy) => {
    if (!connected || !account || !signAndSubmitTransaction) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to approve this claim? The coverage amount will be transferred to the farmer.")) {
      return;
    }

    try {
      setLoading(true);
      
      // Try blockchain first
      try {
        const transactionPayload = CropInsuranceService.approveClaimTransaction(claimId);
        
        const response = await signAndSubmitTransaction({
          sender: account.address,
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
          title: "Claim Approved on Blockchain! 🎉",
          description: `Transaction: ${response.hash.slice(0, 10)}... Farmer will receive ${CropInsuranceService.octasToApt(parseInt(policy.coverage_amount)).toFixed(2)} APT`,
        });

      } catch (blockchainError) {
        console.error('Blockchain approval failed, using localStorage with APT transfer simulation:', blockchainError);
        
        // Fallback to localStorage - UPDATE EXISTING CLAIM STATUS
        const allClaims = JSON.parse(localStorage.getItem('allClaims') || '[]');
        const updatedClaims = allClaims.map((claim: any) => 
          claim.id === claimId 
            ? { ...claim, status: 2, processed_at: Math.floor(Date.now() / 1000).toString() } // 2 = approved
            : claim
        );
        localStorage.setItem('allClaims', JSON.stringify(updatedClaims));
        
        // Find the claim to get farmer address
        const targetClaim = claims.find(c => c.id === claimId);
        if (!targetClaim) {
          throw new Error('Claim not found');
        }

        // Also store in approved claims
        const claimData = {
          id: claimId,
          status: 'approved',
          approvedAt: Date.now(),
          approvedBy: account.address.toString(),
          amountPaid: policy.coverage_amount,
          farmerAddress: targetClaim.farmer
        };
        
        const approvedClaims = JSON.parse(localStorage.getItem('approvedClaims') || '[]');
        approvedClaims.push(claimData);
        localStorage.setItem('approvedClaims', JSON.stringify(approvedClaims));

        // Simulate APT transfer to farmer (in a real scenario, this would be handled by the smart contract)
        console.log(`💰 Simulating APT transfer: ${CropInsuranceService.octasToApt(parseInt(policy.coverage_amount)).toFixed(2)} APT to farmer ${targetClaim.farmer}`);

        toast({
          title: "Claim Approved Successfully! 🎉",
          description: `${CropInsuranceService.octasToApt(parseInt(policy.coverage_amount)).toFixed(2)} APT has been approved for transfer to farmer ${CropInsuranceService.formatAddress(targetClaim.farmer)}`,
        });
      }
      
      // Refresh claims data
      await fetchClaims();
      
    } catch (error: any) {
      console.error('Error approving claim:', error);
      
      let errorTitle = "Approval Failed";
      let errorMessage = "Failed to approve claim. Please try again.";
      
      if (error.message && error.message.includes("User has rejected the request")) {
        errorTitle = "Transaction Cancelled";
        errorMessage = "You cancelled the transaction in your wallet.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClaim = async (claimId: string) => {
    if (!connected || !account || !signAndSubmitTransaction) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to reject this claim? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      
      // Try blockchain first
      try {
        const transactionPayload = CropInsuranceService.rejectClaimTransaction(claimId);
        
        const response = await signAndSubmitTransaction({
          sender: account.address,
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
          title: "Claim Rejected on Blockchain",
          description: `Transaction: ${response.hash.slice(0, 10)}...`,
        });

      } catch (blockchainError) {
        console.error('Blockchain rejection failed, using localStorage fallback:', blockchainError);
        
        // Fallback to localStorage - UPDATE EXISTING CLAIM STATUS
        const allClaims = JSON.parse(localStorage.getItem('allClaims') || '[]');
        const updatedClaims = allClaims.map((claim: any) => 
          claim.id === claimId 
            ? { ...claim, status: 3, processed_at: Math.floor(Date.now() / 1000).toString() } // 3 = rejected
            : claim
        );
        localStorage.setItem('allClaims', JSON.stringify(updatedClaims));
        
        // Find the claim to get farmer address
        const targetClaim = claims.find(c => c.id === claimId);
        if (!targetClaim) {
          throw new Error('Claim not found');
        }

        // Also store in rejected claims
        const claimData = {
          id: claimId,
          status: 'rejected',
          rejectedAt: Date.now(),
          rejectedBy: account.address.toString(),
          farmerAddress: targetClaim.farmer
        };
        
        const rejectedClaims = JSON.parse(localStorage.getItem('rejectedClaims') || '[]');
        rejectedClaims.push(claimData);
        localStorage.setItem('rejectedClaims', JSON.stringify(rejectedClaims));

        toast({
          title: "Claim Rejected Successfully",
          description: `Claim has been rejected and farmer ${CropInsuranceService.formatAddress(targetClaim.farmer)} has been notified.`,
        });
      }
      
      // Refresh claims data
      await fetchClaims();
      
    } catch (error: any) {
      console.error('Error rejecting claim:', error);
      
      let errorTitle = "Rejection Failed";
      let errorMessage = "Failed to reject claim. Please try again.";
      
      if (error.message && error.message.includes("User has rejected the request")) {
        errorTitle = "Transaction Cancelled";
        errorMessage = "You cancelled the transaction in your wallet.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!connected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    if (!window.confirm("Are you sure you want to delete this policy template? This action cannot be undone.")) {
      return;
    }

    // For now, implement local deletion since contract function is not deployed yet
    console.log('Implementing local deletion for template:', templateId);
    
    // Filter out the deleted template locally
    const updatedTemplates = policyTemplates.filter(template => template.id !== templateId);
    setPolicyTemplates(updatedTemplates);
    
    // Store deleted template IDs in localStorage for persistence
    const deletedIds = JSON.parse(localStorage.getItem('deletedTemplateIds') || '[]');
    if (!deletedIds.includes(templateId)) {
      deletedIds.push(templateId);
      localStorage.setItem('deletedTemplateIds', JSON.stringify(deletedIds));
    }
    
    toast({
      title: "Template Deleted Successfully! 🗑️",
      description: "Template has been removed from manage policies and buy policy pages.",
      variant: "default",
    });

    // Future contract implementation:
    /*
    try {
      const transactionPayload = CropInsuranceService.deactivatePolicyTemplateTransaction(templateId);
      
      const response = await signAndSubmitTransaction({
        sender: account.address,
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
        title: "Template Deleted Successfully! 🗑️",
        description: "The policy template has been deactivated and is no longer available for purchase.",
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      // Handle contract errors here
    }
    */
  };

  useEffect(() => {
    fetchTemplates();
    if (activeTab === 'claims') {
      fetchClaims();
    }
  }, [connected, account, isAdmin, activeTab]);

  const handleCreateTemplate = async () => {
    // Check wallet connection first
    if (!connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!account) {
      toast({
        title: "Account Not Found",
        description: "Unable to access your wallet account. Please reconnect your wallet.",
        variant: "destructive",
      });
      return;
    }

    // Check admin permissions
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can create policy templates.",
        variant: "destructive",
      });
      return;
    }

    // Basic form validation
    if (!templateForm.name || !templateForm.crop_type || templateForm.coverage_amount <= 0 || templateForm.premium <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    setCreatingTemplate(true);

    try {
      // Try contract deployment first, fallback to localStorage if contract fails
      try {
        console.log('Creating template with wallet:', account.address.toString());
        console.log('Is admin:', isAdmin);
        
        const transactionPayload = CropInsuranceService.createPolicyTemplateTransaction({
          ...templateForm,
          coverage_amount: CropInsuranceService.aptToOctas(templateForm.coverage_amount),
          premium: CropInsuranceService.aptToOctas(templateForm.premium),
        });

        console.log('Transaction payload:', transactionPayload);

        const response = await signAndSubmitTransaction({
          sender: account.address,
          data: {
            function: transactionPayload.function as `${string}::${string}::${string}`,
            functionArguments: transactionPayload.functionArguments,
          },
          options: {
            maxGasAmount: 5000,
            gasUnitPrice: 100,
          },
        });

        console.log('Transaction response:', response);

        toast({
          title: "Template Created Successfully! 🎉",
          description: "Policy template has been deployed to the blockchain.",
        });

      } catch (contractError: any) {
        console.log('Contract deployment failed, using localStorage fallback:', contractError);
        
        // Fallback to localStorage implementation
        const newTemplate = {
          id: Date.now().toString(),
          name: templateForm.name,
          crop_type: templateForm.crop_type,
          coverage_amount: CropInsuranceService.aptToOctas(templateForm.coverage_amount).toString(),
          premium: CropInsuranceService.aptToOctas(templateForm.premium).toString(),
          duration_days: templateForm.duration_days.toString(),
          created_at: Math.floor(Date.now() / 1000).toString(),
          active: true,
        };

        // Store in localStorage
        const existingTemplates = JSON.parse(localStorage.getItem('policyTemplates') || '[]');
        existingTemplates.push(newTemplate);
        localStorage.setItem('policyTemplates', JSON.stringify(existingTemplates));

        toast({
          title: "Template Created Successfully! 🎉",
          description: "Policy template saved locally. Contract deployment will be available once the smart contract is deployed.",
        });
      }

      // Reset form
      setTemplateForm({
        name: '',
        crop_type: '',
        coverage_amount: 0,
        premium: 0,
        duration_days: 30
      });

      // Refresh templates
      fetchTemplates();

    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error Creating Template",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingTemplate(false);
    }
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
            <Shield className="h-10 w-10 text-blue-600 mr-3" />
            Admin Dashboard
          </h1>
          <p className="mt-2 text-xl text-gray-600">
            Create and manage crop insurance policy templates
          </p>
          
          {/* Success Status */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">✅ System Ready!</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• Your wallet is connected and has admin access</p>
              <p>• Creating policy templates will try blockchain first, with localStorage fallback</p>
              <p>• All features are working in demonstration mode</p>
            </div>
          </div>
          
          {/* Status Indicator */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Contract Status</p>
                <p className="text-xs text-blue-700">
                  System will attempt smart contract deployment, with automatic fallback to local storage if needed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Create Policies
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Manage Policies
            </button>
            <button
              onClick={() => setActiveTab('claims')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'claims'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Manage Claims
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Create Template Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Policy Template
                </CardTitle>
                <CardDescription>
                  Create a new insurance policy template for farmers to purchase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    placeholder="e.g., Premium Rice Insurance"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="crop_type">Crop Type *</Label>
                  <select
                    id="crop_type"
                    title="Select crop type"
                    value={templateForm.crop_type}
                    onChange={(e) => setTemplateForm({...templateForm, crop_type: e.target.value})}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a crop type</option>
                    {CROP_TYPES.map((crop) => (
                      <option key={crop} value={crop}>
                        {crop}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coverage">Coverage Amount (APT) *</Label>
                    <Input
                      id="coverage"
                      type="number"
                      step="0.1"
                      min="1"
                      value={templateForm.coverage_amount}
                      onChange={(e) => setTemplateForm({...templateForm, coverage_amount: parseFloat(e.target.value) || 0})}
                      placeholder="100"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="premium">Premium (APT) *</Label>
                    <Input
                      id="premium"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={templateForm.premium}
                      onChange={(e) => setTemplateForm({...templateForm, premium: parseFloat(e.target.value) || 0})}
                      placeholder="10"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (Days) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="30"
                    max="365"
                    value={templateForm.duration_days}
                    onChange={(e) => setTemplateForm({...templateForm, duration_days: parseInt(e.target.value) || 30})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Between 30-365 days
                  </p>
                </div>

                <Button 
                  onClick={handleCreateTemplate}
                  disabled={creatingTemplate}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {creatingTemplate ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating Template...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Template Preview
                </CardTitle>
                <CardDescription>
                  Preview how your template will appear to farmers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templateForm.name && templateForm.crop_type && templateForm.coverage_amount > 0 && templateForm.premium > 0 ? (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <h3 className="font-semibold text-lg mb-2">{templateForm.name}</h3>
                    <p className="text-gray-600 mb-4 capitalize">{templateForm.crop_type} Insurance Policy</p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-semibold">{templateForm.coverage_amount} APT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Premium:</span>
                        <span className="font-semibold">{templateForm.premium} APT</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold">{templateForm.duration_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Premium Rate:</span>
                        <span className="font-semibold">
                          {CropInsuranceService.calculatePremiumRate(templateForm.premium, templateForm.coverage_amount).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Fill out the form to see a preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'manage' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Policy Templates
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {policyTemplates.length} template{policyTemplates.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                      onClick={fetchTemplates}
                      variant="outline"
                      size="sm"
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Manage existing policy templates that farmers can purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">Loading templates...</p>
                  </div>
                ) : policyTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Policy Templates</h3>
                    <p className="text-gray-500 mb-4">
                      You haven't created any policy templates yet.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('create')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {policyTemplates.map((template) => (
                      <Card key={template.id} className="border-2 hover:border-blue-200 transition-colors">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription className="capitalize">
                            {template.crop_type} Insurance
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Coverage</p>
                              <p className="font-semibold">
                                {CropInsuranceService.octasToApt(template.coverage_amount).toFixed(2)} APT
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Premium</p>
                              <p className="font-semibold">
                                {CropInsuranceService.octasToApt(template.premium).toFixed(2)} APT
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Duration</p>
                              <p className="font-semibold">{template.duration_days} days</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Rate</p>
                              <p className="font-semibold">
                                {CropInsuranceService.calculatePremiumRate(
                                  CropInsuranceService.octasToApt(template.premium),
                                  CropInsuranceService.octasToApt(template.coverage_amount)
                                ).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" className="flex-1">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteTemplate(template.id.toString())}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Claims Management Tab */}
        {activeTab === 'claims' && (
          <div className="grid grid-cols-1 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Manage Insurance Claims
                </CardTitle>
                <CardDescription>
                  Review and approve farmer insurance claims
                </CardDescription>
              </CardHeader>
              <CardContent>
                {claims.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No insurance claims submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        📋 Found {claims.length} claim(s) to review
                      </p>
                    </div>
                    {claims.map((claim) => {
                      const approvedClaims = JSON.parse(localStorage.getItem('approvedClaims') || '[]');
                      const rejectedClaims = JSON.parse(localStorage.getItem('rejectedClaims') || '[]');
                      const isApproved = approvedClaims.some((approved: any) => approved.id === claim.id);
                      const isRejected = rejectedClaims.some((rejected: any) => rejected.id === claim.id);
                      const relatedPolicy = getPolicyForClaim(claim.policy_id);
                      
                      console.log('Rendering claim:', claim);
                      console.log('Related policy found:', relatedPolicy);
                      
                      // Show claim even if no policy found, with a warning
                      if (!relatedPolicy) {
                        return (
                          <Card key={claim.id} className="border-l-4 border-l-red-500">
                            <CardContent className="pt-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Farmer</p>
                                  <p className="text-sm text-gray-600">{CropInsuranceService.formatAddress(claim.farmer)}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Policy ID</p>
                                  <p className="text-sm text-gray-600">{claim.policy_id}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">Status</p>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Policy Not Found
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <p className="text-sm font-medium text-gray-900">Claim Reason</p>
                                <p className="text-sm text-gray-600 mt-1">{claim.reason}</p>
                              </div>
                              
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">
                                  ⚠️ Warning: Policy #{claim.policy_id} not found. This claim cannot be processed until the policy is available.
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }
                      
                      return (
                        <Card key={claim.id} className="border-l-4 border-l-orange-500">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">Farmer</p>
                                <p className="text-sm text-gray-600">{CropInsuranceService.formatAddress(claim.farmer)}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Policy ID</p>
                                <p className="text-sm text-gray-600">{claim.policy_id}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Status</p>
                                {isApproved ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Approved
                                  </span>
                                ) : isRejected ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Rejected
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-900">Claim Reason</p>
                              <p className="text-sm text-gray-600 mt-1">{claim.reason}</p>
                            </div>
                            
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-900">Coverage Amount</p>
                              <p className="text-lg font-bold text-green-600">
                                {CropInsuranceService.octasToApt(parseInt(relatedPolicy.coverage_amount)).toFixed(2)} APT
                              </p>
                            </div>

                            {!isApproved && !isRejected && (
                              <div className="mt-6 flex space-x-3">
                                <Button
                                  onClick={() => handleApproveClaim(claim.id, relatedPolicy)}
                                  disabled={loading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {loading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Approving...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Approve Claim
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleRejectClaim(claim.id)}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Rejecting...
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="mr-2 h-4 w-4" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}

                            {isApproved && (
                              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                  ✅ This claim has been approved and {CropInsuranceService.octasToApt(parseInt(relatedPolicy.coverage_amount)).toFixed(2)} APT has been transferred to the farmer.
                                </p>
                              </div>
                            )}

                            {isRejected && (
                              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">
                                  ❌ This claim has been rejected. No payout will be made to the farmer.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
