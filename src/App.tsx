import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import CampaignEditor from './pages/CampaignEditor';
import Leads from './pages/Leads';
import EmailAccounts from './pages/EmailAccounts';
import Webhooks from './pages/Webhooks';
import Analytics from './pages/Analytics';
import Inbox from './pages/Inbox';
import Settings from './pages/Settings';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageData, setPageData] = useState<any>(null);

  const handleNavigate = (page: string, data?: any) => {
    setCurrentPage(page);
    setPageData(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'campaigns':
        return <Campaigns onNavigate={handleNavigate} />;
      case 'campaign-editor':
        return (
          <CampaignEditor
            onNavigate={handleNavigate}
            campaignId={pageData?.campaignId}
          />
        );
      case 'leads':
        return <Leads />;
      case 'email-accounts':
        return <EmailAccounts />;
      case 'webhooks':
        return <Webhooks />;
      case 'analytics':
        return <Analytics />;
      case 'inbox':
        return <Inbox />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
