import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Toaster } from './components/ui/toaster';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import BuyPolicyPage from './pages/BuyPolicyPage';
import MyPoliciesPage from './pages/MyPoliciesPage';
import ClaimsPage from './pages/ClaimsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FarmerDashboardPage from './pages/FarmerDashboardPage';
import GetMyAddressPage from './pages/GetMyAddressPage';
import GetAddressPage from './pages/GetAddressPage';
import AdminSetupPage from './pages/AdminSetupPage';
import FarmerRegistrationPage from './pages/FarmerRegistrationPage';
import DebugPage from './pages/DebugPage';
import AdminDebugPage from './pages/AdminDebugPage';
import { UserProvider } from './contexts/UserContext';
import SmartRouter from './components/SmartRouter';
import './index.css';

function App() {
  return (
    <AptosWalletAdapterProvider autoConnect={true}>
      <UserProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>
              <SmartRouter>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/register-farmer" element={<FarmerRegistrationPage />} />
                  <Route path="/farmer-registration" element={<FarmerRegistrationPage />} />
                  <Route path="/farmer-dashboard" element={<FarmerDashboardPage />} />
                  <Route path="/buy-policy" element={<BuyPolicyPage />} />
                  <Route path="/my-policies" element={<MyPoliciesPage />} />
                  <Route path="/claims" element={<ClaimsPage />} />
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
                  <Route path="/get-address" element={<GetMyAddressPage />} />
                  <Route path="/get-my-address" element={<GetAddressPage />} />
                  <Route path="/admin-setup" element={<AdminSetupPage />} />
                  <Route path="/debug" element={<DebugPage />} />
                  <Route path="/admin-debug" element={<AdminDebugPage />} />
                </Routes>
              </SmartRouter>
            </main>
            <Toaster />
          </div>
        </Router>
      </UserProvider>
    </AptosWalletAdapterProvider>
  );
}

export default App;
