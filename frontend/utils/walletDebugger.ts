import { aptosClient } from './aptosClient';

export class WalletDebugger {
  /**
   * Get comprehensive wallet and account information
   */
  static async getWalletInfo(account: any) {
    try {
      const client = aptosClient();
      const address = account?.address?.toString();
      
      if (!address) {
        return { error: 'No wallet address found' };
      }

      console.log('🔍 Wallet Debug Information:');
      console.log('📧 Address:', address);
      
      // Get balance
      try {
        const balance = await client.getAccountAPTAmount({ accountAddress: address });
        console.log('💰 Balance:', balance, 'Octas', '(' + (balance / 100_000_000).toFixed(4) + ' APT)');
        
        // Get account info
        const accountInfo = await client.getAccountInfo({ accountAddress: address });
        console.log('📊 Sequence Number:', accountInfo.sequence_number);
        console.log('🔢 Authentication Key:', accountInfo.authentication_key);
        
        return {
          address,
          balance,
          balanceAPT: balance / 100_000_000,
          sequenceNumber: accountInfo.sequence_number,
          authKey: accountInfo.authentication_key,
          hasMinimumBalance: balance >= 1_000_000 // 0.01 APT minimum
        };
      } catch (balanceError) {
        console.error('❌ Failed to get account info:', balanceError);
        return { 
          address, 
          error: 'Account not found or not funded',
          needsFunding: true
        };
      }
    } catch (error) {
      console.error('❌ Wallet debug failed:', error);
      return { error: error.message };
    }
  }

  /**
   * Compare CLI and browser wallet addresses
   */
  static async compareWithCLI(account: any) {
    const cliAddress = "0xc2cfcb9a1855d38256bb59a8f94cc12d3f6d58679e703636868d8b07d426ab90";
    const browserAddress = account?.address?.toString();
    
    console.log('🔍 Address Comparison:');
    console.log('🖥️  CLI Address:', cliAddress);
    console.log('🌐 Browser Address:', browserAddress);
    console.log('✅ Addresses Match:', cliAddress === browserAddress);
    
    if (cliAddress !== browserAddress) {
      console.log('⚠️  WARNING: Different addresses detected!');
      console.log('💡 Solution: Either:');
      console.log('   1. Import CLI private key into Petra wallet, OR');
      console.log('   2. Fund the browser wallet address');
      
      return { 
        match: false, 
        cliAddress, 
        browserAddress,
        needsFunding: true
      };
    }
    
    return { 
      match: true, 
      address: browserAddress 
    };
  }
}
