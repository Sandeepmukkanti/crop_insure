import { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { CROP_TYPES } from '../constants';
import { Plus, Send } from 'lucide-react';

interface TemplateRequest {
  name: string;
  crop_type: string;
  coverage_amount: number;
  premium: number;
  duration_days: number;
}

export default function RequestTemplatePage() {
  const { connected, account } = useWallet();
  const { toast } = useToast();
  const [templateRequest, setTemplateRequest] = useState<TemplateRequest>({
    name: '',
    crop_type: '',
    coverage_amount: 0,
    premium: 0,
    duration_days: 30
  });

  const isAuthorizedUser = account ? 
    account.address.toString().toLowerCase() === "0x43661a8960ff2e47316e1782036be6d44a904f04d9075ed3e7e0797ed68138fa".toLowerCase() 
    : false;

  const handleRequestTemplate = async () => {
    if (!templateRequest.name || !templateRequest.crop_type || templateRequest.coverage_amount <= 0 || templateRequest.premium <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show CLI command for now
      const coverage_octas = Math.floor(templateRequest.coverage_amount * 100_000_000);
      const premium_octas = Math.floor(templateRequest.premium * 100_000_000);
      
      const cliCommand = `aptos move run --function-id "0xc2cfcb9a1855d38256bb59a8f94cc12d3f6d58679e703636868d8b07d426ab90::crop_insurance_v3::create_policy_template" --args string:"${templateRequest.name}" string:"${templateRequest.crop_type}" u64:${coverage_octas} u64:${premium_octas} u64:${templateRequest.duration_days} --profile default --assume-yes`;

      // Copy to clipboard
      navigator.clipboard.writeText(cliCommand);

      toast({
        title: "Template Request Created! 📋",
        description: "CLI command copied to clipboard. The template will be created for you.",
      });

      console.log('CLI Command to create template:', cliCommand);

      // Reset form
      setTemplateRequest({
        name: '',
        crop_type: '',
        coverage_amount: 0,
        premium: 0,
        duration_days: 30
      });

    } catch (error) {
      console.error('Error creating template request:', error);
      toast({
        title: "Error",
        description: "Failed to create template request.",
        variant: "destructive",
      });
    }
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <Plus className="h-12 w-12 text-gray-400 mx-auto" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Connect Your Wallet
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Connect your wallet to request policy templates
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
            <Plus className="h-10 w-10 text-blue-600 mr-3" />
            Request Policy Template
          </h1>
          <p className="mt-2 text-xl text-gray-600">
            Request a new insurance policy template to be created
          </p>
          {isAuthorizedUser && (
            <div className="mt-2 text-sm text-green-600">
              ✅ You are authorized to create templates
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              Template Request Form
            </CardTitle>
            <CardDescription>
              Fill out the details for the policy template you'd like created
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={templateRequest.name}
                onChange={(e) => setTemplateRequest({...templateRequest, name: e.target.value})}
                placeholder="e.g., Premium Rice Insurance"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="crop_type">Crop Type *</Label>
              <select
                id="crop_type"
                title="Select crop type"
                value={templateRequest.crop_type}
                onChange={(e) => setTemplateRequest({...templateRequest, crop_type: e.target.value})}
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
                  value={templateRequest.coverage_amount}
                  onChange={(e) => setTemplateRequest({...templateRequest, coverage_amount: parseFloat(e.target.value) || 0})}
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
                  value={templateRequest.premium}
                  onChange={(e) => setTemplateRequest({...templateRequest, premium: parseFloat(e.target.value) || 0})}
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
                value={templateRequest.duration_days}
                onChange={(e) => setTemplateRequest({...templateRequest, duration_days: parseInt(e.target.value) || 30})}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Between 30-365 days
              </p>
            </div>

            <Button 
              onClick={handleRequestTemplate}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Create Template Request
            </Button>

            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
              <p><strong>How it works:</strong></p>
              <p>1. Fill out the form above</p>
              <p>2. Click "Create Template Request"</p>
              <p>3. The CLI command will be generated and copied</p>
              <p>4. The template will be created via admin CLI</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
