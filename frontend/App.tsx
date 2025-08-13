import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Toaster } from './components/ui/toaster';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import BuyPolicyPage from './pages/BuyPolicyPage';
import MyPoliciesPage from './pages/MyPoliciesPage';
import ClaimsPage from './pages/ClaimsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import './index.css';

function App() {
  return (
    <AptosWalletAdapterProvider autoConnect={true}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/buy-policy" element={<BuyPolicyPage />} />
              <Route path="/my-policies" element={<MyPoliciesPage />} />
              <Route path="/claims" element={<ClaimsPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Routes>
          </main>
          <Toaster />
        </div>
      </Router>
    </AptosWalletAdapterProvider>
  );
}

export default App;
