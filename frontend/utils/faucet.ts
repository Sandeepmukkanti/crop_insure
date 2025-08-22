import { aptosClient } from './aptosClient';

export class FaucetService {
  /**
   * Request test APT tokens from the devnet faucet
   */
  static async requestFaucetFunds(accountAddress: string): Promise<boolean> {
    try {
      const client = aptosClient();
      
      // Fund the account with test tokens
      await client.fundAccount({
        accountAddress,
        amount: 100_000_000, // 1 APT in Octas
      });
      
      console.log(`Successfully funded account ${accountAddress} with 1 APT`);
      return true;
    } catch (error) {
      console.error('Failed to fund account:', error);
      return false;
    }
  }

  /**
   * Check if account has sufficient balance for transactions
   */
  static async checkBalance(accountAddress: string): Promise<{ hasBalance: boolean; balance: number }> {
    try {
      const client = aptosClient();
      const balance = await client.getAccountAPTAmount({
        accountAddress,
      });
      
      // Consider 0.01 APT (1M Octas) as minimum balance for transactions
      const minBalance = 1_000_000;
      const hasBalance = balance >= minBalance;
      
      return { hasBalance, balance };
    } catch (error) {
      console.error('Failed to check balance:', error);
      return { hasBalance: false, balance: 0 };
    }
  }

  /**
   * Automatically ensure account has sufficient funds
   */
  static async ensureFunds(accountAddress: string): Promise<boolean> {
    try {
      const { hasBalance, balance } = await this.checkBalance(accountAddress);
      
      if (!hasBalance) {
        console.log(`Low balance detected (${balance} Octas). Requesting faucet funds...`);
        return await this.requestFaucetFunds(accountAddress);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to ensure funds:', error);
      return false;
    }
  }
}
