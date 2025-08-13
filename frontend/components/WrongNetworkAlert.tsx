import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function WrongNetworkAlert() {
  const { network } = useWallet();
  
  if (network && network.name !== "testnet") {
    return (
      <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-2 text-center z-50">
        <p className="text-sm">
          ⚠️ Please switch to Aptos Testnet in your wallet
        </p>
      </div>
    );
  }
  
  return null;
}
