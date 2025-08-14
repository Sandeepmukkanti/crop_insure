import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface FarmerData {
  name: string;
  phone: string;
  email: string;
  address: string;
  farmSize: string;
  primaryCrop: string;
  walletAddress: string;
  registrationDate: string;
  isRegistered: boolean;
}

interface UserContextType {
  isAdmin: boolean;
  isRegisteredFarmer: boolean;
  farmerData: FarmerData | null;
  userType: 'admin' | 'farmer' | 'unregistered' | 'disconnected';
  checkUserStatus: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { connected, account } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRegisteredFarmer, setIsRegisteredFarmer] = useState(false);
  const [farmerData, setFarmerData] = useState<FarmerData | null>(null);
  const [userType, setUserType] = useState<'admin' | 'farmer' | 'unregistered' | 'disconnected'>('disconnected');

  const checkUserStatus = () => {
    if (!connected || !account) {
      setIsAdmin(false);
      setIsRegisteredFarmer(false);
      setFarmerData(null);
      setUserType('disconnected');
      return;
    }

    const walletAddress = account.address.toString();
    
    // PERMANENT ADMIN CHECK: YOUR SPECIFIC BROWSER WALLET
    const targetAdminAddress = "0x43661a8960ff2e47316e1782036be6d44a904f04d9075ed3e7e0797ed68138fa";
    const normalizedWalletAddress = walletAddress.toLowerCase().replace(/^0x/, '');
    const normalizedTargetAddress = targetAdminAddress.toLowerCase().replace(/^0x/, '');
    const isPermanentAdmin = normalizedWalletAddress === normalizedTargetAddress;
    
    console.log('🔍 UserContext Admin Check:', {
      walletAddress,
      normalizedWalletAddress,
      targetAdminAddress,
      normalizedTargetAddress,
      isPermanentAdmin,
      addressLength: normalizedWalletAddress.length,
      targetLength: normalizedTargetAddress.length
    });
    
    // PERMANENT ADMIN ACCESS for your specific address
    if (isPermanentAdmin) {
      console.log('🎯 PERMANENT ADMIN ACCESS GRANTED');
      setIsAdmin(true);
      setUserType('admin');
      setIsRegisteredFarmer(false);
      setFarmerData(null);
      
      // Clear any conflicting farmer registration data
      const farmerKeys = Object.keys(localStorage).filter(key => key.startsWith('farmer_'));
      farmerKeys.forEach(key => {
        console.log(`🧹 Clearing farmer data: ${key}`);
        localStorage.removeItem(key);
      });
      
      return;
    }
    
    // If not the permanent admin, treat as regular user/farmer
    console.log('👤 Not admin - checking farmer registration status');
    
    // Check if user is registered farmer
    const storedFarmerData = localStorage.getItem(`farmer_${walletAddress}`);
    if (storedFarmerData) {
      try {
        const parsed: FarmerData = JSON.parse(storedFarmerData);
        setFarmerData(parsed);
        setIsRegisteredFarmer(true);
        setUserType('farmer');
        setIsAdmin(false);
      } catch (error) {
        console.error('Error parsing farmer data:', error);
        setIsRegisteredFarmer(false);
        setFarmerData(null);
        setUserType('unregistered');
        setIsAdmin(false);
      }
    } else {
      setIsRegisteredFarmer(false);
      setFarmerData(null);
      setUserType('unregistered');
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, [connected, account]);

  const value: UserContextType = {
    isAdmin,
    isRegisteredFarmer,
    farmerData,
    userType,
    checkUserStatus,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
