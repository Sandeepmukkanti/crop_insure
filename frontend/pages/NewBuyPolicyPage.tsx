import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useToast } from '../components/ui/use-toast';
import { CropInsuranceService } from '../services/crop-insurance';
import type { PolicyTemplate, BuyPolicyParams } from '../types/crop-insurance';
import { 
  Shield, 
  Clock, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  Loader2,
  CheckCircle,
  ShoppingCart
} from 'lucide-react';

export default function BuyPolicyPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<PolicyTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const activeTemplates = await CropInsuranceService.getActivePolicyTemplates();
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error Loading Templates",
        description: "Failed to load available insurance policies.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleBuyPolicy = async (template: PolicyTemplate) => {
    if (!connected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy a policy.",
        variant: "destructive",
      });
      return;
    }

    setPurchasing(template.id);

    try {
      const transactionPayload = CropInsuranceService.buyPolicyTransaction({
        template_id: template.id
      });

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
        title: "Policy Purchased Successfully! 🎉",
        description: `Transaction hash: ${response.hash.slice(0, 10)}... You can now view your policy in the dashboard.`,
      });

    } catch (error) {
      console.error('Error buying policy:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const formatDuration = (days: string) => {
    const numDays = parseInt(days);
    if (numDays >= 365) {
      return `${Math.floor(numDays / 365)} year${Math.floor(numDays / 365) > 1 ? 's' : ''}`;
    } else if (numDays >= 30) {
      return `${Math.floor(numDays / 30)} month${Math.floor(numDays / 30) > 1 ? 's' : ''}`;
    } else {
      return `${numDays} day${numDays > 1 ? 's' : ''}`;
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
              You need to connect your wallet to purchase insurance policies
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Buy Crop Insurance
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Protect your crops with our comprehensive insurance policies
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-gray-400" />
            <p className="mt-4 text-lg text-gray-600">Loading available policies...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-16 w-16 text-gray-400 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Insurance Policies Available
            </h3>
            <p className="mt-2 text-gray-600">
              There are currently no insurance policies available for purchase.
              Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map((template) => (
              <Card key={template.id} className="relative hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                  <CardTitle className="text-xl">{template.name}</CardTitle>
                  <CardDescription className="text-base capitalize">
                    {template.crop_type} Insurance Policy
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Coverage Details */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                        <span className="font-medium text-gray-700">Coverage</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        {CropInsuranceService.octasToApt(template.coverage_amount).toFixed(2)} APT
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-700">Premium</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {CropInsuranceService.octasToApt(template.premium).toFixed(2)} APT
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-purple-600 mr-2" />
                        <span className="font-medium text-gray-700">Duration</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">
                        {formatDuration(template.duration_days)}
                      </span>
                    </div>
                  </div>

                  {/* Premium Ratio */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Premium Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {((CropInsuranceService.octasToApt(template.premium) / CropInsuranceService.octasToApt(template.coverage_amount)) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">of coverage amount</p>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <Button 
                    onClick={() => handleBuyPolicy(template)}
                    disabled={purchasing === template.id}
                    className="w-full h-12 text-lg font-medium"
                  >
                    {purchasing === template.id ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Buy Policy
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Benefits Section */}
        {templates.length > 0 && (
          <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Why Choose Our Crop Insurance?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Fast Claims Processing
                </h4>
                <p className="text-gray-600">
                  Quick and efficient claim processing with blockchain transparency
                </p>
              </div>
              <div className="text-center">
                <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Comprehensive Coverage
                </h4>
                <p className="text-gray-600">
                  Protection against weather damage, pests, and crop failures
                </p>
              </div>
              <div className="text-center">
                <DollarSign className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Competitive Rates
                </h4>
                <p className="text-gray-600">
                  Affordable premiums with transparent pricing and instant payouts
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
