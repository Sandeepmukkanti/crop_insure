import { Claim } from '../types/crop-insurance';

export class ClaimManager {
  private static readonly STORAGE_KEY = 'claimStatuses';

  // Update a claim's status in both local storage and memory
  static updateClaimStatus(claimId: string, newStatus: number, processedAt: string = Date.now().toString()): void {
    try {
      // Get current statuses
      const statuses = this.getAllClaimStatuses();
      
      // Update status
      statuses[claimId] = {
        status: newStatus,
        processedAt,
        updatedAt: Date.now()
      };
      
      // Save back to storage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(statuses));
      
      // Update allClaims storage as well
      this.updateClaimInAllClaims(claimId, newStatus, processedAt);
      
      console.log(`Claim ${claimId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating claim status:', error);
    }
  }

  // Get a specific claim's status
  static getClaimStatus(claimId: string): number | null {
    try {
      const statuses = this.getAllClaimStatuses();
      return statuses[claimId]?.status ?? null;
    } catch (error) {
      console.error('Error getting claim status:', error);
      return null;
    }
  }

  // Get all claim statuses
  static getAllClaimStatuses(): Record<string, { status: number; processedAt: string; updatedAt: number }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error getting all claim statuses:', error);
      return {};
    }
  }

  // Update claim in allClaims storage
  private static updateClaimInAllClaims(claimId: string, newStatus: number, processedAt: string): void {
    try {
      const allClaims = JSON.parse(localStorage.getItem('allClaims') || '[]');
      const updatedClaims = allClaims.map((claim: Claim) => 
        claim.id === claimId 
          ? { ...claim, status: newStatus, processed_at: processedAt }
          : claim
      );
      localStorage.setItem('allClaims', JSON.stringify(updatedClaims));
    } catch (error) {
      console.error('Error updating claim in allClaims:', error);
    }
  }

  // Get processed timestamp for a claim
  static getClaimProcessedTime(claimId: string): string | null {
    try {
      const statuses = this.getAllClaimStatuses();
      return statuses[claimId]?.processedAt ?? null;
    } catch (error) {
      console.error('Error getting claim processed time:', error);
      return null;
    }
  }
}
