export const NETWORK = import.meta.env.VITE_APP_NETWORK ?? "devnet";
export const MODULE_ADDRESS = "0xf2a5931b90cdc94a781d5613eb35c7c2385fd141d573d581e32746efb4382bd4";
export const APTOS_API_KEY = import.meta.env.VITE_APTOS_API_KEY;

// Contract module name - using your admin contract
export const MODULE_NAME = "crop_insurance_petra_admin";

// Admin addresses - YOUR SPECIFIC wallet address
export const ADMIN_ADDRESSES = [
  "0x43661a8960ff2e47316e1782036be6d44a904f04d9075ed3e7e0797ed68138fa", // YOUR wallet address - PERMANENT ADMIN
];

// Primary admin address - YOUR wallet address
export const ADMIN_ADDRESS = "0x43661a8960ff2e47316e1782036be6d44a904f04d9075ed3e7e0797ed68138fa";

// Crop types
export const CROP_TYPES = [
  "Rice",
  "Wheat",
  "Corn",
  "Soybeans",
  "Cotton",
  "Sugarcane",
  "Barley",
  "Oats",
  "Other"
];

// Policy status constants
export const POLICY_STATUS = {
  ACTIVE: 1,
  EXPIRED: 2,
  CLAIMED: 3,
} as const;

// Claim status constants
export const CLAIM_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;
