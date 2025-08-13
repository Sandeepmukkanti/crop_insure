export interface Policy {
  id: string;
  farmer: string;
  crop_type: string;
  coverage_amount: string;
  premium: string;
  start_time: string;
  end_time: string;
  status: number;
}

export interface Claim {
  id: string;
  policy_id: string;
  farmer: string;
  reason: string;
  submitted_at: string;
  status: number;
  processed_at: string;
}

export interface PoolStats {
  total_premium_collected: string;
  total_claims_paid: string;
  total_policies: string;
  total_claims: string;
}

export type PolicyStatus = 1 | 2 | 3; // ACTIVE | EXPIRED | CLAIMED
export type ClaimStatus = 1 | 2 | 3; // PENDING | APPROVED | REJECTED

export interface CreatePolicyParams {
  crop_type: string;
  coverage_amount: number;
  duration_days: number;
}

export interface SubmitClaimParams {
  policy_id: string;
  reason: string;
}
