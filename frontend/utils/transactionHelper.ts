import { FaucetService } from './faucet';
import { toast } from '../components/ui/use-toast';

export interface TransactionOptions {
  maxGasAmount?: number;
  gasUnitPrice?: number;
  autoFund?: boolean;
}

export class TransactionHelper {
  /**
   * Execute a transaction with automatic retry and funding
   */
  static async executeTransaction(
    signAndSubmitTransaction: any,
    account: any,
    transactionPayload: any,
    options: TransactionOptions = {}
  ) {
    const {
      maxGasAmount = 1500, // Very conservative
      gasUnitPrice = 100,
      autoFund = true
    } = options;

    try {
      // Auto-fund if enabled
      if (autoFund && account?.address) {
        await FaucetService.ensureFunds(account.address.toString());
      }

      // Execute transaction with improved payload structure
      const response = await signAndSubmitTransaction({
        sender: account.address,
        data: {
          function: transactionPayload.function as `${string}::${string}::${string}`,
          typeArguments: transactionPayload.typeArguments || [],
          functionArguments: transactionPayload.functionArguments,
        },
        options: {
          maxGasAmount,
          gasUnitPrice,
        },
      });

      return { success: true, response };

    } catch (error: any) {
      console.error('Transaction failed:', error);

      // Handle specific error types
      if (error.message?.includes('INSUFFICIENT_BALANCE')) {
        // Try auto-funding and retry once
        if (autoFund && account?.address) {
          console.log('Insufficient balance detected. Attempting auto-fund...');
          
          const funded = await FaucetService.requestFaucetFunds(account.address.toString());
          
          if (funded) {
            toast({
              title: "Auto-funded Account",
              description: "Added test APT tokens. Retrying transaction...",
            });

            // Retry with even lower gas
            try {
              const retryResponse = await signAndSubmitTransaction({
                sender: account.address,
                data: {
                  function: transactionPayload.function as `${string}::${string}::${string}`,
                  functionArguments: transactionPayload.functionArguments,
                },
                options: {
                  maxGasAmount: 1000, // Even more conservative on retry
                  gasUnitPrice: 100,
                },
              });

              return { success: true, response: retryResponse };
            } catch (retryError) {
              console.error('Retry also failed:', retryError);
              return { success: false, error: retryError };
            }
          }
        }
      }

      return { success: false, error };
    }
  }
}
