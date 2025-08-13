import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { CropInsuranceService } from '../services/crop-insurance';
import { CROP_TYPES } from '../constants';
import { Loader2, Shield, AlertCircle } from 'lucide-react';

export default function BuyPolicyPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cropType: '',
    coverageAmount: '',
    duration: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePremium = (coverageAmount: number): number => {
    return coverageAmount * 0.1; // 10% of coverage amount
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy a policy.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.cropType || !formData.coverageAmount || !formData.duration) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create transaction payload
      const transactionPayload = CropInsuranceService.createPolicyTransaction({
        crop_type: formData.cropType,
        coverage_amount: CropInsuranceService.aptToOctas(parseFloat(formData.coverageAmount)),
        duration_days: parseInt(formData.duration),
      });

      // Sign and submit transaction using wallet adapter
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: transactionPayload.function as `${string}::${string}::${string}`,
          functionArguments: transactionPayload.functionArguments,
        },
      });

      toast({
        title: "Policy Created Successfully!",
        description: `Transaction hash: ${response.hash.slice(0, 10)}...`,
      });

      // Reset form
      setFormData({
        cropType: '',
        coverageAmount: '',
        duration: '',
      });

    } catch (error) {
      console.error('Error creating policy:', error);
      toast({
        title: "Error Creating Policy",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const coverageAmount = parseFloat(formData.coverageAmount) || 0;
  const premium = calculatePremium(coverageAmount);

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
              You need to connect your wallet to buy a policy
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Buy Crop Insurance Policy</h1>
          <p className="mt-2 text-lg text-gray-600">
            Protect your crops with blockchain-powered insurance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Policy Form */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Details</CardTitle>
              <CardDescription>
                Fill in the details for your crop insurance policy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="cropType">Crop Type *</Label>
                  <select
                    id="cropType"
                    title="Select crop type"
                    value={formData.cropType}
                    onChange={(e) => handleInputChange('cropType', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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

                <div>
                  <Label htmlFor="coverageAmount">Coverage Amount (APT) *</Label>
                  <Input
                    id="coverageAmount"
                    type="number"
                    step="0.1"
                    min="1"
                    max="1000"
                    value={formData.coverageAmount}
                    onChange={(e) => handleInputChange('coverageAmount', e.target.value)}
                    placeholder="Enter coverage amount"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 1 APT, Maximum 1000 APT
                  </p>
                </div>

                <div>
                  <Label htmlFor="duration">Policy Duration (Days) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="30"
                    max="365"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="Enter duration in days"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Minimum 30 days, Maximum 365 days
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Policy...
                    </>
                  ) : (
                    'Buy Policy'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Policy Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Policy Summary</CardTitle>
                <CardDescription>
                  Review your policy details before purchase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Crop Type:</span>
                  <span className="font-medium">{formData.cropType || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage Amount:</span>
                  <span className="font-medium">{formData.coverageAmount || '0'} APT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{formData.duration || '0'} days</span>
                </div>
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Premium (10%):</span>
                  <span className="text-green-600">{premium.toFixed(2)} APT</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Important Information
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 space-y-2">
                      <p>• Premium is 10% of the coverage amount</p>
                      <p>• Policy becomes active immediately after purchase</p>
                      <p>• Claims can be submitted anytime during the policy period</p>
                      <p>• All transactions are recorded on the Aptos blockchain</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
