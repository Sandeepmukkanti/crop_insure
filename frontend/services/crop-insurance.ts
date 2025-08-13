import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { MODULE_ADDRESS, MODULE_NAME, ADMIN_ADDRESS, NETWORK } from "../constants";
import type { 
  Policy, 
  Claim, 
  PoolStats, 
  CreatePolicyParams, 
  SubmitClaimParams 
} from "../types/crop-insurance";

// Initialize Aptos client
const aptosConfig = new AptosConfig({ 
  network: NETWORK as Network 
});
const aptos = new Aptos(aptosConfig);

export class CropInsuranceService {
  
  // Create a new policy (returns transaction payload)
  static createPolicyTransaction(params: CreatePolicyParams) {
    return {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::create_policy`,
      functionArguments: [
        ADMIN_ADDRESS, // admin_addr
        params.crop_type,
        params.coverage_amount,
        params.duration_days,
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
  
  // Get policies by farmer
  static async getPoliciesByFarmer(farmerAddress: string): Promise<Policy[]> {
    try {
      const policies = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_policies_by_farmer`,
          functionArguments: [ADMIN_ADDRESS, farmerAddress],
        },
      });
      return policies[0] as Policy[];
    } catch (error) {
      console.error('Error fetching policies:', error);
      return [];
    }
  }

  // Get pending claims (admin view)
  static async getPendingClaims(): Promise<Claim[]> {
    try {
      const claims = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_pending_claims`,
          functionArguments: [ADMIN_ADDRESS],
        },
      });
      return claims[0] as Claim[];
    } catch (error) {
      console.error('Error fetching pending claims:', error);
      return [];
    }
  }

  // Get all claims (admin view)
  static async getAllClaims(): Promise<Claim[]> {
    try {
      const claims = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_all_claims`,
          functionArguments: [ADMIN_ADDRESS],
        },
      });
      return claims[0] as Claim[];
    } catch (error) {
      console.error('Error fetching all claims:', error);
      return [];
    }
  }

  // Get pool statistics
  static async getPoolStats(): Promise<PoolStats | null> {
    try {
      const stats = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_pool_stats`,
          functionArguments: [ADMIN_ADDRESS],
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

  // Check if address is admin
  static isAdmin(address: string): boolean {
    return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
  }

  // Format address for display
  static formatAddress(address: string): string {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Get account balance
  static async getAccountBalance(address: string): Promise<number> {
    try {
      const balance = await aptos.getAccountAPTAmount({ accountAddress: address });
      return this.octasToApt(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }
}
