import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import ReviewCollection from '@/pages/ReviewCollection';
import { AuthProvider, useAuth } from '@/contexts/SupabaseAuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';
import ManageCampaigns from '@/pages/ManageCampaigns';
import AllReviews from '@/pages/AllReviews';
import ViewCampaign from '@/pages/ViewCampaign';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import AllProducts from '@/pages/AllProducts.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents refetching on window focus
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }

  return user ? <AppLayout>{children}</AppLayout> : <Navigate to="/" />;
};

const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }
  
  return !user ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
            <Helmet>
              <title>ReviewFlow - Amazon Review Collection Platform</title>
              <meta name="description" content="Streamline your Amazon review collection with personalized campaigns and QR codes. Boost your seller ratings effortlessly." />
            </Helmet>
            <div className="min-h-screen bg-muted/40 text-foreground">
              <Routes>
                <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />
                <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/campaigns" element={<PrivateRoute><ManageCampaigns /></PrivateRoute>} />
                <Route path="/campaigns/:campaignId" element={<PrivateRoute><ViewCampaign /></PrivateRoute>} />
                <Route path="/products" element={<PrivateRoute><AllProducts /></PrivateRoute>} />
                <Route path="/reviews" element={<PrivateRoute><AllReviews /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                <Route path="/review/:campaignId" element={<ReviewCollection />} />
              </Routes>
            </div>
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;