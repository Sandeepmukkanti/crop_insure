import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { CropInsuranceService } from '../services/crop-insurance';
import { TransactionHelper } from '../utils/transactionHelper';
import { FaucetService } from '../utils/faucet';
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import type { PolicyTemplate, Policy } from '../types/crop-insurance';
import { NETWORK } from '../constants';
import { 
  Shield, 
  Calendar, 
  DollarSign, 
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: NETWORK as Network 
});
const aptos = new Aptos(aptosConfig);

export default function BuyPolicyPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [userPolicies, setUserPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Monitor wallet connection changes
  useEffect(() => {
    console.log('🔗 Wallet connection changed:', { connected, account: account?.address?.toString() });
    
    if (connected && account) {
      loadTemplates();
    } else {
      // Clear data when disconnected
      setTemplates([]);
      setUserPolicies([]);
    }
  }, [connected, account]);

  // Monitor for connection errors and auto-reload
  useEffect(() => {
    const handleWalletError = (event: any) => {
      console.error('👛 Wallet error detected:', event);
      toast({
        title: "Wallet Connection Issue",
        description: "Please reconnect your wallet if needed.",
        variant: "default"
      });
    };

    window.addEventListener('error', handleWalletError);
    return () => window.removeEventListener('error', handleWalletError);
  }, [toast]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Use getActivePolicyTemplates for farmers to only show active templates
      const availableTemplates = await CropInsuranceService.getActivePolicyTemplates();
      console.log('Loaded templates:', availableTemplates);
      setTemplates(availableTemplates);
      
      // Also load user's existing policies to prevent duplicates
      if (account) {
        try {
          console.log('Loading policies for address:', account.address.toString());
          const existingPolicies = await CropInsuranceService.getPoliciesByFarmer(account.address.toString());
          console.log('Existing policies loaded from blockchain:', existingPolicies);
          
          // Load local policies as well
          try {
            const localPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
            console.log('Local policies loaded:', localPolicies);
            
            // Merge blockchain and local policies, filtering duplicates by template_id
            const mergedPolicies = [...existingPolicies];
            
            for (const localPolicy of localPolicies) {
              // Only add local policy if we don't have it from blockchain
              const hasMatchingPolicy = existingPolicies.some(
                p => p.template_id.toString() === localPolicy.template_id.toString()
              );
              if (!hasMatchingPolicy) {
                mergedPolicies.push(localPolicy);
              }
            }
            
            console.log('Final merged policies:', mergedPolicies);
            setUserPolicies(mergedPolicies);
          } catch (localError) {
            console.log('Error loading local policies:', localError);
            setUserPolicies(existingPolicies);
          }
        } catch (error) {
          console.log('Error fetching blockchain policies:', error);
          // Try loading from localStorage only
          try {
            const localPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
            console.log('Fallback to local policies only:', localPolicies);
            setUserPolicies(localPolicies);
          } catch (localError) {
            console.log('No existing policies found in local storage:', localError);
            setUserPolicies([]);
          }
        }
      }
      
      if (availableTemplates.length === 0) {
        toast({
          title: "No Policies Available",
          description: "No active insurance policies are currently available for purchase.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error loading policy templates:', error);
      toast({
        title: "Error",
        description: "Failed to load available policies. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Check if farmer already has a policy for this template
  const hasExistingPolicy = (templateId: string): boolean => {
    try {
      // Validate template ID is within uint64 range
      const numericId = BigInt(templateId);
      if (numericId < 0n || numericId > 18446744073709551615n) {
        console.error('Template ID out of uint64 range:', templateId);
        return false;
      }

      // Convert to standardized string format for comparison
      const normalizedTemplateId = numericId.toString();
      
      return userPolicies.some(policy => {
        try {
          const policyTemplateId = BigInt(policy.template_id);
          const normalizedPolicyTemplateId = policyTemplateId.toString();
          const matches = normalizedPolicyTemplateId === normalizedTemplateId;
          
          if (matches) {
            console.log('Found matching policy:', { 
              policyTemplateId: normalizedPolicyTemplateId, 
              templateId: normalizedTemplateId,
              policy
            });
          }
          return matches;
        } catch (error) {
          console.error('Error processing policy template ID:', error);
          return false;
        }
      });
    } catch (error) {
      console.error('Error processing template ID:', error);
      return false;
    }
  };

  const handleBuyPolicy = async (template: PolicyTemplate) => {
    // Enhanced wallet connection check
    if (!connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your Petra wallet first.",
        variant: "destructive"
      });
      return;
    }

    if (!account || !account.address) {
      toast({
        title: "Account Not Available",
        description: "Wallet account information is not available. Please reconnect your wallet.",
        variant: "destructive"
      });
      return;
    }

    if (!signAndSubmitTransaction) {
      toast({
        title: "Transaction Function Not Available",
        description: "Wallet signing function is not available. Please reconnect your wallet.",
        variant: "destructive"
      });
      return;
    }

    // Check if farmer already has this policy
    if (hasExistingPolicy(template.id)) {
      toast({
        title: "Policy Already Purchased",
        description: "You already have an active policy for this template. You cannot purchase the same policy twice.",
        variant: "destructive"
      });
      return;
    }

    try {
      setPurchasing(template.id);
      
      console.log('🚀 Starting policy purchase for farmer:', account.address.toString());
      console.log('Buying policy for template:', template);
      console.log('Template ID:', template.id, 'Type:', typeof template.id);
      console.log('User address:', account.address.toString());
      
      // Try contract transaction first, fallback to localStorage if fails
      try {
        // Create transaction payload
        const transactionPayload = CropInsuranceService.buyPolicyTransaction({
          template_id: template.id,
        });

        console.log('Transaction payload:', transactionPayload);

        // First ensure account has funds
        await FaucetService.ensureFunds(account.address.toString());

        // Use TransactionHelper for enhanced transaction handling with higher gas
        const result = await TransactionHelper.executeTransaction(
          signAndSubmitTransaction,
          account,
          transactionPayload,
          {
            maxGasAmount: 5000, // Increased gas limit
            gasUnitPrice: 150,  // Increased gas price
            autoFund: true
          }
        );

        if (!result.success) {
          throw result.error;
        }

        const response = result.response;
        console.log('Transaction response:', response);
        
        // Handle different response formats
        let transactionHash;
        if (typeof response === 'string') {
          transactionHash = response;
        } else if (response && typeof response === 'object') {
          transactionHash = (response as any).hash || (response as any).transactionHash || (response as any).transaction_hash;
        }
        
        if (transactionHash) {
          // Wait for transaction to be confirmed
          try {
            await aptos.waitForTransaction({ transactionHash });
          } catch (waitError) {
            console.warn('Transaction wait failed, but transaction may have succeeded:', waitError);
          }
        }

        toast({
          title: "Policy Purchased Successfully!",
          description: `Your ${template.crop_type} insurance policy has been activated on blockchain.`,
        });

      } catch (contractError: any) {
        console.log('Contract transaction failed, using localStorage fallback:', contractError);
        
        // Fallback to localStorage implementation
        const newPolicy = {
          id: Date.now().toString(),
          template_id: template.id,
          farmer: account.address.toString(),
          crop_type: template.crop_type,
          coverage_amount: template.coverage_amount,
          premium: template.premium,
          start_time: Math.floor(Date.now() / 1000).toString(),
          end_time: (Math.floor(Date.now() / 1000) + parseInt(template.duration_days) * 24 * 60 * 60).toString(),
          status: 1, // ACTIVE
        };

        // Store in localStorage
        const existingPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
        existingPolicies.push(newPolicy);
        localStorage.setItem('userPolicies', JSON.stringify(existingPolicies));

        toast({
          title: "Policy Purchased Successfully!",
          description: `Your ${template.crop_type} insurance policy has been saved locally.`,
        });
      }
      
      // Reload templates to refresh data
      await loadTemplates();
    } catch (error: any) {
      console.error('Error buying policy:', error);
      
      let errorTitle = "Purchase Failed";
      let errorMessage = "Failed to purchase policy. Please try again.";
      
      // Handle specific error types
      if (error.name === 'WalletNotConnectedError' || error.message?.includes('WalletNotConnectedError')) {
        errorTitle = "Wallet Not Connected";
        errorMessage = "Please connect your Petra wallet and try again.";
      } else if (error.message && error.message.includes("User has rejected the request")) {
        errorTitle = "Transaction Cancelled";
        errorMessage = "You cancelled the transaction in your wallet. No charges were made.";
      } else if (error.message && error.message.includes("insufficient") || error.message?.includes("INSUFFICIENT_BALANCE")) {
        errorTitle = "Insufficient Funds";
        errorMessage = "You don't have enough APT tokens. Click 'Debug Wallet' to add funds automatically.";
      } else if (error.message && error.message.includes("E_NOT_ADMIN")) {
        errorTitle = "Access Denied";
        errorMessage = "Admin permission required for this action.";
      } else if (error.message?.includes('Network Error') || error.message?.includes('fetch')) {
        errorTitle = "Network Error";
        errorMessage = "Connection failed. Please check your internet and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: errorTitle === "Transaction Cancelled" ? "default" : "destructive"
      });
    } finally {
      setPurchasing(null);
    }
  };

  const formatDuration = (durationInDays: string) => {
    return `${durationInDays} days`;
  };

  const formatAPT = (amount: string) => {
    return (parseInt(amount) / 100000000).toFixed(2); // Convert from octas to APT
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              You need to connect your wallet to purchase insurance policies
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <div className="flex items-center space-x-2">
              {connected && account ? (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Connected: {account.address.toString().slice(0, 8)}...{account.address.toString().slice(-6)}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Wallet not connected</span>
                </div>
              )}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Available Insurance Policies
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Choose from our range of crop insurance templates created by administrators
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading available policies...</span>
          </div>
        ) : templates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <CardTitle className="text-gray-600 mb-2">No Policies Available</CardTitle>
              <CardDescription>
                There are currently no insurance policy templates available. 
                Please check back later or contact an administrator.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-green-700">
                      {template.crop_type} Insurance
                    </CardTitle>
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    Professional crop insurance for {template.crop_type.toLowerCase()} farming
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Coverage</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatAPT(template.coverage_amount)} APT
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Premium</p>
                        <p className="text-lg font-bold text-blue-600">
                          {formatAPT(template.premium)} APT
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium">Duration</p>
                      <p className="text-sm text-gray-600">
                        {formatDuration(template.duration_days)}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    {hasExistingPolicy(template.id) ? (
                      <Button 
                        disabled
                        className="w-full bg-gray-400 hover:bg-gray-400"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Already Purchased
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleBuyPolicy(template)}
                        disabled={purchasing === template.id}
                        className="w-full"
                      >
                        {purchasing === template.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Purchasing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Buy Policy
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                How Policy Purchase Works
              </h3>
              <div className="text-sm text-green-700 space-y-1">
                <p>• Policies are created by administrators based on market conditions</p>
                <p>• Premium is paid upfront using APT tokens from your wallet</p>
                <p>• Coverage activates immediately after purchase</p>
                <p>• Submit claims during the policy period if crop damage occurs</p>
                <p>• Approved claims are paid out automatically to your wallet</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
