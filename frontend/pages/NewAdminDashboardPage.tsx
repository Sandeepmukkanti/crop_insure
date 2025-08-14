import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useToast } from '../components/ui/use-toast';
import { CropInsuranceService } from '../services/crop-insurance';
import { CROP_TYPES } from '../constants';
import type { PolicyTemplate, CreatePolicyTemplateParams } from '../types/crop-insurance';
import { 
  Shield, 
  Plus, 
  Settings,
  FileText,
  Users,
  AlertTriangle,
  Loader2,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

export default function NewAdminDashboardPage() {
  const { connected, account, signAndSubmitTransaction } = useWallet();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  const [policyTemplates, setPolicyTemplates] = useState<PolicyTemplate[]>([]);
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
  }, [connected, account, isAdmin]);

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.crop_type || templateForm.coverage_amount <= 0 || templateForm.premium <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    setCreatingTemplate(true);

    try {
      const transactionPayload = CropInsuranceService.createPolicyTemplateTransaction({
        ...templateForm,
        coverage_amount: CropInsuranceService.aptToOctas(templateForm.coverage_amount),
        premium: CropInsuranceService.aptToOctas(templateForm.premium),
      });

      await signAndSubmitTransaction({
        sender: account!.address,
        data: {
          function: transactionPayload.function as `${string}::${string}::${string}`,
          functionArguments: transactionPayload.functionArguments,
        },
      });

      toast({
        title: "Template Created Successfully! 🎉",
        description: "The policy template is now available for farmers to purchase.",
      });

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
                          {((templateForm.premium / templateForm.coverage_amount) * 100).toFixed(1)}%
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
                                {((CropInsuranceService.octasToApt(template.premium) / 
                                   CropInsuranceService.octasToApt(template.coverage_amount)) * 100).toFixed(1)}%
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
      </div>
    </div>
  );
}
