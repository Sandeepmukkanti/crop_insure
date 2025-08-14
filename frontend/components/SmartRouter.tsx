import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

interface SmartRouterProps {
  children: React.ReactNode;
}

export default function SmartRouter({ children }: SmartRouterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { userType } = useUser();
  const { connected } = useWallet();

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Debug logging
    console.log('🔀 SmartRouter Debug:', {
      currentPath,
      connected,
      userType,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Don't redirect if user is on utility pages
    const utilityPages = ['/get-address', '/get-my-address', '/admin-setup', '/admin-test', '/debug'];
    if (utilityPages.includes(currentPath)) {
      console.log('⚙️ On utility page, no redirect needed');
      return;
    }

    // Don't redirect if not connected
    if (!connected) {
      console.log('🔌 Not connected, no redirect');
      return;
    }

    // If connected, check user type and redirect
    switch (userType) {
      case 'admin':
        // Admin should go to admin dashboard from most pages except admin pages
        const adminPages = ['/admin', '/admin-dashboard'];
        if (!adminPages.includes(currentPath)) {
          console.log('🔥 Redirecting ADMIN to dashboard from:', currentPath);
          navigate('/admin');
        } else {
          console.log('✅ ADMIN already on admin page:', currentPath);
        }
        break;
        
      case 'farmer':
        // Registered farmer should go to farmer dashboard from home or registration
        if (currentPath === '/' || currentPath === '/farmer-registration' || currentPath === '/register-farmer') {
          console.log('🌾 Redirecting farmer to dashboard from:', currentPath);
          navigate('/farmer-dashboard');
        } else {
          console.log('✅ Farmer already on appropriate page:', currentPath);
        }
        break;
        
      case 'unregistered':
        // Connected but not registered - still need to complete registration
        if (currentPath !== '/farmer-registration' && currentPath !== '/register-farmer') {
          console.log('📝 Redirecting unregistered user to registration from:', currentPath);
          navigate('/farmer-registration');
        } else {
          console.log('✅ Unregistered user already on registration page:', currentPath);
        }
        break;
        
      default:
        console.log('❓ Unknown user type:', userType, 'No redirect performed');
        break;
    }
  }, [userType, connected, location.pathname, navigate]);

  return <>{children}</>;
}
