module crop_insurance1::crop_insurance_petra_admin_v2 {
    use std::signer;
    use std::vector;
    use std::string::String;
    use aptos_framework::timestamp;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;

    // Error codes
    const E_NOT_ADMIN: u64 = 1;
    const E_POLICY_NOT_FOUND: u64 = 2;
    const E_CLAIM_NOT_FOUND: u64 = 3;
    const E_POLICY_EXPIRED: u64 = 4;
    const E_POLICY_ALREADY_CLAIMED: u64 = 5;
    const E_INSUFFICIENT_FUNDS: u64 = 6;
    const E_CLAIM_ALREADY_PROCESSED: u64 = 7;

    // Hardcoded admin addresses - YOUR WALLETS (Petra wallet address as main admin)
    const ADMIN_ADDRESS: address = @0x43661a8960ff2e47316e1782036be6d44a904f04d9075ed3e7e0797ed68138fa;

    // Policy Status
    const POLICY_ACTIVE: u8 = 1;
    const POLICY_EXPIRED: u8 = 2;
    const POLICY_CLAIMED: u8 = 3;

    // Claim Status
    const CLAIM_PENDING: u8 = 1;
    const CLAIM_APPROVED: u8 = 2;
    const CLAIM_REJECTED: u8 = 3;

    // Structs
    struct PolicyTemplate has store, copy, drop {
        id: u64,
        name: String,
        crop_type: String,
        coverage_amount: u64,
        premium: u64,
        duration_days: u64,
        created_at: u64,
        active: bool,
    }

    struct Policy has store, copy, drop {
        id: u64,
        template_id: u64,
        farmer: address,
        crop_type: String,
        coverage_amount: u64,
        premium: u64,
        start_time: u64,
        end_time: u64,
        status: u8,
    }

    struct Claim has store, copy, drop {
        id: u64,
        policy_id: u64,
        farmer: address,
        reason: String,
        submitted_at: u64,
        status: u8,
        processed_at: u64,
    }

    struct InsurancePool has key {
        admin: address,
        total_premium_collected: u64,
        total_claims_paid: u64,
        policy_templates: vector<PolicyTemplate>,
        policies: vector<Policy>,
        claims: vector<Claim>,
        template_counter: u64,
        policy_counter: u64,
        claim_counter: u64,
    }

    // Events
    #[event]
    struct PolicyTemplateCreated has drop, store {
        template_id: u64,
        name: String,
        crop_type: String,
        coverage_amount: u64,
        premium: u64,
    }

    #[event]
    struct PolicyCreated has drop, store {
        policy_id: u64,
        template_id: u64,
        farmer: address,
        crop_type: String,
        coverage_amount: u64,
        premium: u64,
    }

    #[event]
    struct ClaimSubmitted has drop, store {
        claim_id: u64,
        policy_id: u64,
        farmer: address,
        reason: String,
    }

    #[event]
    struct ClaimProcessed has drop, store {
        claim_id: u64,
        policy_id: u64,
        farmer: address,
        status: u8,
        payout: u64,
    }

    // Initialize the insurance pool (called once by admin)
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        // Store the InsurancePool at the deployer's address
        if (!exists<InsurancePool>(admin_addr)) {
            move_to(admin, InsurancePool {
                admin: ADMIN_ADDRESS, // Use hardcoded admin address
                total_premium_collected: 0,
                total_claims_paid: 0,
                policy_templates: vector::empty(),
                policies: vector::empty(),
                claims: vector::empty(),
                template_counter: 0,
                policy_counter: 0,
                claim_counter: 0,
            });
        }
    }

    // Create a policy template (admin only)
    public entry fun create_policy_template(
        admin: &signer,
        name: String,
        crop_type: String,
        coverage_amount: u64,
        premium: u64,
        duration_days: u64,
    ) acquires InsurancePool {
        let admin_addr = signer::address_of(admin);
        // Check if signer is the hardcoded admin
        assert!(admin_addr == ADMIN_ADDRESS, E_NOT_ADMIN);
        
        // Access InsurancePool from the deployer's address
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global_mut<InsurancePool>(deployer_addr);
        
        pool.template_counter = pool.template_counter + 1;
        
        let template = PolicyTemplate {
            id: pool.template_counter,
            name,
            crop_type,
            coverage_amount,
            premium,
            duration_days,
            created_at: timestamp::now_seconds(),
            active: true,
        };
        
        vector::push_back(&mut pool.policy_templates, template);
        
        // Emit event
        event::emit(PolicyTemplateCreated {
            template_id: pool.template_counter,
            name: template.name,
            crop_type: template.crop_type,
            coverage_amount,
            premium,
        });
    }

    // Deactivate a policy template (admin only)
    public entry fun deactivate_policy_template(
        admin: &signer,
        template_id: u64,
    ) acquires InsurancePool {
        let admin_addr = signer::address_of(admin);
        // Check if signer is the hardcoded admin
        assert!(admin_addr == ADMIN_ADDRESS, E_NOT_ADMIN);
        
        // Access InsurancePool from the deployer's address
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global_mut<InsurancePool>(deployer_addr);
        
        // Find template and deactivate it
        let template_index = find_template_index(&pool.policy_templates, template_id);
        assert!(template_index < vector::length(&pool.policy_templates), E_POLICY_NOT_FOUND);
        
        let template = vector::borrow_mut(&mut pool.policy_templates, template_index);
        template.active = false;
    }

    // Buy a policy from template (farmers only)
    public entry fun buy_policy(
        farmer: &signer,
        admin_addr: address,
        template_id: u64,
    ) acquires InsurancePool {
        let farmer_addr = signer::address_of(farmer);
        let deployer_addr = @crop_insurance1; // Use contract address
        let pool = borrow_global_mut<InsurancePool>(deployer_addr);
        
        // Find template
        let template_index = find_template_index(&pool.policy_templates, template_id);
        assert!(template_index < vector::length(&pool.policy_templates), E_POLICY_NOT_FOUND);
        
        let template = vector::borrow(&pool.policy_templates, template_index);
        assert!(template.active, E_POLICY_NOT_FOUND);
        
        // Transfer premium to admin
        coin::transfer<AptosCoin>(farmer, admin_addr, template.premium);
        
        let current_time = timestamp::now_seconds();
        let end_time = current_time + (template.duration_days * 24 * 60 * 60);
        
        pool.policy_counter = pool.policy_counter + 1;
        
        let policy = Policy {
            id: pool.policy_counter,
            template_id: template.id,
            farmer: farmer_addr,
            crop_type: template.crop_type,
            coverage_amount: template.coverage_amount,
            premium: template.premium,
            start_time: current_time,
            end_time,
            status: POLICY_ACTIVE,
        };
        
        vector::push_back(&mut pool.policies, policy);
        pool.total_premium_collected = pool.total_premium_collected + template.premium;
        
        // Emit event
        event::emit(PolicyCreated {
            policy_id: pool.policy_counter,
            template_id: template.id,
            farmer: farmer_addr,
            crop_type: policy.crop_type,
            coverage_amount: template.coverage_amount,
            premium: template.premium,
        });
    }

    // Submit a claim
    public entry fun submit_claim(
        farmer: &signer,
        admin_addr: address,
        policy_id: u64,
        reason: String,
    ) acquires InsurancePool {
        let farmer_addr = signer::address_of(farmer);
        let deployer_addr = @crop_insurance1; // Use contract address
        let pool = borrow_global_mut<InsurancePool>(deployer_addr);
        
        // Find and validate policy
        let policy_index = find_policy_index(&pool.policies, policy_id);
        assert!(policy_index < vector::length(&pool.policies), E_POLICY_NOT_FOUND);
        
        let policy = vector::borrow(&pool.policies, policy_index);
        assert!(policy.farmer == farmer_addr, E_NOT_ADMIN);
        assert!(policy.status == POLICY_ACTIVE, E_POLICY_EXPIRED);
        assert!(timestamp::now_seconds() <= policy.end_time, E_POLICY_EXPIRED);
        
        pool.claim_counter = pool.claim_counter + 1;
        
        let claim = Claim {
            id: pool.claim_counter,
            policy_id,
            farmer: farmer_addr,
            reason,
            submitted_at: timestamp::now_seconds(),
            status: CLAIM_PENDING,
            processed_at: 0,
        };
        
        vector::push_back(&mut pool.claims, claim);
        
        // Emit event
        event::emit(ClaimSubmitted {
            claim_id: pool.claim_counter,
            policy_id,
            farmer: farmer_addr,
            reason,
        });
    }

    // Approve a claim (admin only)
    public entry fun approve_claim(
        admin: &signer,
        claim_id: u64,
    ) acquires InsurancePool {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == ADMIN_ADDRESS, E_NOT_ADMIN); // Use hardcoded admin check
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global_mut<InsurancePool>(deployer_addr);
        
        let claim_index = find_claim_index(&pool.claims, claim_id);
        assert!(claim_index < vector::length(&pool.claims), E_CLAIM_NOT_FOUND);
        
        let claim = vector::borrow_mut(&mut pool.claims, claim_index);
        assert!(claim.status == CLAIM_PENDING, E_CLAIM_ALREADY_PROCESSED);
        
        // Update claim status
        claim.status = CLAIM_APPROVED;
        claim.processed_at = timestamp::now_seconds();
        
        // Find and update policy
        let policy_index = find_policy_index(&pool.policies, claim.policy_id);
        let policy = vector::borrow_mut(&mut pool.policies, policy_index);
        let payout = policy.coverage_amount;
        policy.status = POLICY_CLAIMED;
        
        // Transfer payout to farmer
        coin::transfer<AptosCoin>(admin, claim.farmer, payout);
        pool.total_claims_paid = pool.total_claims_paid + payout;
        
        // Emit event
        event::emit(ClaimProcessed {
            claim_id,
            policy_id: claim.policy_id,
            farmer: claim.farmer,
            status: CLAIM_APPROVED,
            payout,
        });
    }

    // Reject a claim (admin only)
    public entry fun reject_claim(
        admin: &signer,
        claim_id: u64,
    ) acquires InsurancePool {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == ADMIN_ADDRESS, E_NOT_ADMIN); // Use hardcoded admin check
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global_mut<InsurancePool>(deployer_addr);
        
        let claim_index = find_claim_index(&pool.claims, claim_id);
        assert!(claim_index < vector::length(&pool.claims), E_CLAIM_NOT_FOUND);
        
        let claim = vector::borrow_mut(&mut pool.claims, claim_index);
        assert!(claim.status == CLAIM_PENDING, E_CLAIM_ALREADY_PROCESSED);
        
        // Update claim status
        claim.status = CLAIM_REJECTED;
        claim.processed_at = timestamp::now_seconds();
        
        // Emit event
        event::emit(ClaimProcessed {
            claim_id,
            policy_id: claim.policy_id,
            farmer: claim.farmer,
            status: CLAIM_REJECTED,
            payout: 0,
        });
    }

    // View functions
    #[view]
    public fun get_active_templates(admin_addr: address): vector<PolicyTemplate> acquires InsurancePool {
        let deployer_addr = @crop_insurance1; // Use contract deployer address
        let pool = borrow_global<InsurancePool>(deployer_addr);
        let result = vector::empty<PolicyTemplate>();
        let i = 0;
        let len = vector::length(&pool.policy_templates);
        
        while (i < len) {
            let template = vector::borrow(&pool.policy_templates, i);
            if (template.active) {
                vector::push_back(&mut result, *template);
            };
            i = i + 1;
        };
        
        result
    }

    #[view]
    public fun get_all_templates(admin_addr: address): vector<PolicyTemplate> acquires InsurancePool {
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global<InsurancePool>(deployer_addr);
        pool.policy_templates
    }

    #[view]
    public fun get_policies_by_farmer(admin_addr: address, farmer_addr: address): vector<Policy> acquires InsurancePool {
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global<InsurancePool>(deployer_addr);
        let result = vector::empty<Policy>();
        let i = 0;
        let len = vector::length(&pool.policies);
        
        while (i < len) {
            let policy = vector::borrow(&pool.policies, i);
            if (policy.farmer == farmer_addr) {
                vector::push_back(&mut result, *policy);
            };
            i = i + 1;
        };
        
        result
    }

    #[view]
    public fun get_pending_claims(admin_addr: address): vector<Claim> acquires InsurancePool {
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global<InsurancePool>(deployer_addr);
        let result = vector::empty<Claim>();
        let i = 0;
        let len = vector::length(&pool.claims);
        
        while (i < len) {
            let claim = vector::borrow(&pool.claims, i);
            if (claim.status == CLAIM_PENDING) {
                vector::push_back(&mut result, *claim);
            };
            i = i + 1;
        };
        
        result
    }

    #[view]
    public fun get_all_claims(admin_addr: address): vector<Claim> acquires InsurancePool {
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global<InsurancePool>(deployer_addr);
        pool.claims
    }

    #[view]
    public fun get_pool_stats(admin_addr: address): (u64, u64, u64, u64) acquires InsurancePool {
        let deployer_addr = @crop_insurance1;
        let pool = borrow_global<InsurancePool>(deployer_addr);
        (
            pool.total_premium_collected,
            pool.total_claims_paid,
            vector::length(&pool.policies),
            vector::length(&pool.claims)
        )
    }

    // Helper functions
    fun find_template_index(templates: &vector<PolicyTemplate>, template_id: u64): u64 {
        let i = 0;
        let len = vector::length(templates);
        
        while (i < len) {
            let template = vector::borrow(templates, i);
            if (template.id == template_id) {
                return i
            };
            i = i + 1;
        };
        
        len // Return length if not found
    }

    fun find_policy_index(policies: &vector<Policy>, policy_id: u64): u64 {
        let i = 0;
        let len = vector::length(policies);
        
        while (i < len) {
            let policy = vector::borrow(policies, i);
            if (policy.id == policy_id) {
                return i
            };
            i = i + 1;
        };
        
        len // Return length if not found
    }

    fun find_claim_index(claims: &vector<Claim>, claim_id: u64): u64 {
        let i = 0;
        let len = vector::length(claims);
        
        while (i < len) {
            let claim = vector::borrow(claims, i);
            if (claim.id == claim_id) {
                return i
            };
            i = i + 1;
        };
        
        len // Return length if not found
    }
}
