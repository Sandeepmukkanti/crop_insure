import { MODULE_ADDRESS, MODULE_NAME, ADMIN_ADDRESS } from "../constants";
import { aptosClient } from "../utils/aptosClient";
import type { 
  PolicyTemplate,
  Policy, 
  Claim, 
  PoolStats, 
  CreatePolicyTemplateParams,
  BuyPolicyParams, 
  SubmitClaimParams 
} from "../types/crop-insurance";

export class CropInsuranceService {
  
  // Create a policy template (returns transaction payload) - Admin only
  static createPolicyTemplateTransaction(params: CreatePolicyTemplateParams) {
    return {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_policy_template`,
      functionArguments: [
        params.name,
        params.crop_type,
        params.coverage_amount,
        params.premium,
        params.duration_days,
      ],
    };
  }

  // Deactivate a policy template (returns transaction payload) - Admin only
  static deactivatePolicyTemplateTransaction(templateId: string) {
    return {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::deactivate_policy_template`,
      functionArguments: [
        parseInt(templateId),
      ],
    };
  }

  // Check if deactivate function exists in the contract
  static async hasDeactivateFunction(): Promise<boolean> {
    try {
      // Try to get the function info
      const client = aptosClient();
      await client.view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::deactivate_policy_template`,
          functionArguments: [1], // dummy argument
        },
      });
      return true;
    } catch (error) {
      console.log('Deactivate function not available in current contract');
      return false;
    }
  }

  // Buy a policy from template (returns transaction payload) - Farmers
  static buyPolicyTransaction(params: BuyPolicyParams) {
    return {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::buy_policy`,
      functionArguments: [
        ADMIN_ADDRESS, // admin_addr - where premium goes
        parseInt(params.template_id),
      ],
    };
  }

  // Submit a claim (returns transaction payload)
  static submitClaimTransaction(params: SubmitClaimParams) {
    return {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::submit_claim`,
      functionArguments: [
        ADMIN_ADDRESS, // admin_addr
        parseInt(params.policy_id),
        params.reason,
      ],
    };
  }

  // Approve a claim (returns transaction payload)
  static approveClaimTransaction(claimId: string) {
    return {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::approve_claim`,
      functionArguments: [parseInt(claimId)],
    };
  }

  // Reject a claim (returns transaction payload)
  static rejectClaimTransaction(claimId: string) {
    return {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::reject_claim`,
      functionArguments: [parseInt(claimId)],
    };
  }

  // Initialize the insurance pool (returns transaction payload)
  static initializeTransaction() {
    return {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::initialize`,
      functionArguments: [],
    };
  }

  // View functions
  
  // Get active policy templates for buying
  static async getActivePolicyTemplates(): Promise<PolicyTemplate[]> {
    try {
      // Try to fetch from smart contract first
      const templates = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_active_templates`,
          functionArguments: [MODULE_ADDRESS],
        },
      });
      
      const allTemplates = templates[0] as PolicyTemplate[];
      
      // Filter out locally deleted templates (temporary solution)
      const deletedIds = JSON.parse(localStorage.getItem('deletedTemplateIds') || '[]');
      const activeTemplates = allTemplates.filter(template => 
        template.active && !deletedIds.includes(template.id)
      );
      
      return activeTemplates;
    } catch (error) {
      console.log('Contract not available, using localStorage fallback:', error);
      
      // Fallback to localStorage
      try {
        const localTemplates = JSON.parse(localStorage.getItem('policyTemplates') || '[]');
        // Filter out locally deleted templates and only return active ones
        const deletedIds = JSON.parse(localStorage.getItem('deletedTemplateIds') || '[]');
        const activeTemplates = localTemplates.filter((template: PolicyTemplate) => 
          template.active && !deletedIds.includes(template.id)
        );
        return activeTemplates as PolicyTemplate[];
      } catch (localError) {
        console.error('Error reading from localStorage:', localError);
        return [];
      }
    }
  }

  // Get all policy templates (admin view) with improved error handling
  static async getAllPolicyTemplates(): Promise<PolicyTemplate[]> {
    try {
      // Try to fetch from smart contract first
      const templates = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_all_templates`,
          functionArguments: [MODULE_ADDRESS],
        },
      });
      
      const allTemplates = templates[0] as PolicyTemplate[];
      
      // Filter out locally deleted templates (temporary solution)
      const deletedIds = JSON.parse(localStorage.getItem('deletedTemplateIds') || '[]');
      const activeTemplates = allTemplates.filter(template => !deletedIds.includes(template.id));
      
      return activeTemplates;
    } catch (error) {
      console.log('Contract not available, using localStorage fallback:', error);
      
      // Fallback to localStorage
      try {
        const localTemplates = JSON.parse(localStorage.getItem('policyTemplates') || '[]');
        // Filter out locally deleted templates
        const deletedIds = JSON.parse(localStorage.getItem('deletedTemplateIds') || '[]');
        const activeTemplates = localTemplates.filter((template: PolicyTemplate) => !deletedIds.includes(template.id));
        return activeTemplates as PolicyTemplate[];
      } catch (localError) {
        console.error('Error reading from localStorage:', localError);
        return [];
      }
    }
  }

  // Get policies by farmer
  static async getPoliciesByFarmer(farmerAddress: string): Promise<Policy[]> {
    try {
      // Try to fetch from smart contract first
      const policies = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_policies_by_farmer`,
          functionArguments: [MODULE_ADDRESS, farmerAddress],
        },
      });
      return policies[0] as Policy[];
    } catch (error) {
      console.log('Contract not available, using localStorage fallback for policies:', error);
      
      // Fallback to localStorage
      try {
        const localPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
        // Filter policies for this specific farmer
        const farmerPolicies = localPolicies.filter((policy: Policy) => 
          policy.farmer.toLowerCase() === farmerAddress.toLowerCase()
        );
        return farmerPolicies as Policy[];
      } catch (localError) {
        console.error('Error reading policies from localStorage:', localError);
        return [];
      }
    }
  }

  // Get all policies (admin view)
  static async getAllPolicies(): Promise<Policy[]> {
    try {
      // Try blockchain first
      const policies = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_all_policies`,
          functionArguments: [MODULE_ADDRESS],
        },
      });
      return policies[0] as Policy[];
    } catch (error) {
      console.error('Error fetching all policies from blockchain, using localStorage fallback:', error);
      
      // Fallback to localStorage
      try {
        const localPolicies = JSON.parse(localStorage.getItem('userPolicies') || '[]');
        console.log('All policies from localStorage:', localPolicies);
        return localPolicies as Policy[];
      } catch (localError) {
        console.error('Error reading policies from localStorage:', localError);
        return [];
      }
    }
  }

  // Get pending claims (admin view)
  static async getPendingClaims(): Promise<Claim[]> {
    try {
      const claims = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_pending_claims`,
          functionArguments: [MODULE_ADDRESS],
        },
      });
      const blockchainClaims = claims[0] as any[];
      
      // Convert blockchain format to frontend format
      const formattedClaims = blockchainClaims.map((claim: any) => ({
        id: claim.id,
        policy_id: claim.policy_id,
        farmer: claim.farmer,
        reason: claim.reason,
        submitted_at: claim.submitted_at,
        status: claim.status,
        processed_at: claim.processed_at || "0",
      }));
      
      return formattedClaims;
    } catch (error) {
      console.error('Error fetching pending claims from contract:', error);
      // Fallback to localStorage
      try {
        const localClaims = localStorage.getItem('allClaims');
        const allClaims = localClaims ? JSON.parse(localClaims) : [];
        // Filter only pending claims (status 1)
        return allClaims.filter((claim: any) => claim.status === 1);
      } catch (localError) {
        console.error('Error reading claims from localStorage:', localError);
        return [];
      }
    }
  }

  // Get all claims (admin view)
  static async getAllClaims(): Promise<Claim[]> {
    try {
      const claims = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_all_claims`,
          functionArguments: [MODULE_ADDRESS],
        },
      });
      console.log('Claims from blockchain:', claims[0]);
      const blockchainClaims = claims[0] as any[];
      
      // Convert blockchain format to frontend format
      const formattedClaims = blockchainClaims.map((claim: any) => ({
        id: claim.id,
        policy_id: claim.policy_id,
        farmer: claim.farmer,
        reason: claim.reason,
        submitted_at: claim.submitted_at,
        status: claim.status,
        processed_at: claim.processed_at || "0",
      }));
      
      console.log('Formatted claims:', formattedClaims);
      return formattedClaims;
    } catch (error) {
      console.error('Error fetching all claims from contract:', error);
      // Fallback to localStorage
      try {
        const localClaims = localStorage.getItem('allClaims');
        const parsedClaims = localClaims ? JSON.parse(localClaims) : [];
        console.log('Claims from localStorage:', parsedClaims);
        return parsedClaims;
      } catch (localError) {
        console.error('Error reading claims from localStorage:', localError);
        return [];
      }
    }
  }

  // Get pool statistics
  static async getPoolStats(): Promise<PoolStats | null> {
    try {
      const stats = await aptosClient().view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_pool_stats`,
          functionArguments: [MODULE_ADDRESS],
        },
      });
      
      const [totalPremium, totalClaims, totalPolicies, totalClaimsCount] = stats as [string, string, string, string];
      
      return {
        total_premium_collected: totalPremium,
        total_claims_paid: totalClaims,
        total_policies: totalPolicies,
        total_claims: totalClaimsCount,
      };
    } catch (error) {
      console.error('Error fetching pool stats:', error);
      return null;
    }
  }

  // Utility functions
  
  // Convert APT to Octas (1 APT = 100,000,000 Octas)
  static aptToOctas(apt: number): number {
    return Math.floor(apt * 100_000_000);
  }

  // Convert Octas to APT
  static octasToApt(octas: string | number): number {
    return Number(octas) / 100_000_000;
  }

  // Check if address is admin - YOUR SPECIFIC WALLET ONLY
  static isAdmin(address: string): boolean {
    // YOUR PERMANENT ADMIN ADDRESS
    const adminAddress = "0x43661a8960ff2e47316e1782036be6d44a904f04d9075ed3e7e0797ed68138fa";
    
    // Normalize both addresses for comparison
    const userAddr = address.toLowerCase().replace(/^0x/, '');
    const targetAddr = adminAddress.toLowerCase().replace(/^0x/, '');
    
    const isMatch = userAddr === targetAddr;
    
    console.log('CropInsuranceService Admin Check:', {
      userAddress: userAddr,
      adminAddress: targetAddr,
      isAdmin: isMatch
    });
    
    return isMatch;
  }

  // Format address for display
  static formatAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get account balance
  static async getAccountBalance(address: string): Promise<number> {
    try {
      const balance = await aptosClient().getAccountAPTAmount({ accountAddress: address });
      return this.octasToApt(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  // Calculate premium rate (needed for AdminDashboard display)
  static calculatePremiumRate(premium: number, coverage: number): number {
    if (coverage === 0) return 0;
    return (premium / coverage) * 100;
  }
}
