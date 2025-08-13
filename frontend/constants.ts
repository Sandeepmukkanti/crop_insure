export const NETWORK = import.meta.env.VITE_APP_NETWORK ?? "testnet";
export const MODULE_ADDRESS = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS ?? "0xae040ca9eb9583756c4dfc6bd7d35a258ac91b9c80cff47a6924731eb690ef7b";
export const APTOS_API_KEY = import.meta.env.VITE_APTOS_API_KEY;

// Contract module name
export const MODULE_NAME = "crop_insurance";

// Admin address (same as module publisher for now)
export const ADMIN_ADDRESS = MODULE_ADDRESS;

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
