
import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useQuery } from '@tanstack/react-query';
import { QrCode, Star, Package, Loader2, AlertTriangle, Plus, BarChart2, PieChart, Smile, Frown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const fetchDashboardData = async (userId) => {
  if (!userId) return null;

  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, name, marketplace')
    .eq('user_id', userId);
  if (campaignsError) throw campaignsError;

  const campaignIds = campaigns.map(c => c.id);
  let reviews = [];
  if (campaignIds.length > 0) {
    const { data: reviewData, error: reviewsError } = await supabase
      .from('reviews')
      .select('campaign_id, satisfaction_rating, submitted_at')
      .in('campaign_id', campaignIds);
    if (reviewsError) throw reviewsError;
    reviews = reviewData;
  }

  const { count: productsCount, error: productsError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (productsError) throw productsError;

  // Analytics calculations
  const totalReviews = reviews.length;
  const submissionRate = campaigns.length > 0 ? (totalReviews / campaigns.length) : 0; // This is a simplification

  const marketplacePerformance = campaigns.reduce((acc, campaign) => {
    const reviewCount = reviews.filter(r => r.campaign_id === campaign.id).length;
    acc[campaign.marketplace] = (acc[campaign.marketplace] || 0) + reviewCount;
    return acc;
  }, {});

  const sentimentCounts = reviews.reduce((acc, review) => {
    acc[review.satisfaction_rating] = (acc[review.satisfaction_rating] || 0) + 1;
    return acc;
  }, {});

  return {
    totalCampaigns: campaigns.length,
    totalReviews,
    totalProducts: productsCount,
    submissionRate,
    marketplacePerformance,
    sentimentCounts,
    recentReviews: reviews.slice(0, 5).map(r => ({...r, campaignName: campaigns.find(c => c.id === r.campaign_id)?.name || 'N/A'}))
  };
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboardData', user?.id],
    queryFn: () => fetchDashboardData(user?.id),
    enabled: !!user?.id,
  });

  const statCards = [
    { title: 'Total Campaigns', value: data?.totalCampaigns, icon: QrCode, color: 'text-primary' },
    { title: 'Total Reviews', value: data?.totalReviews, icon: Star, color: 'text-primary' },
    { title: 'Total Products', value: data?.totalProducts, icon: Package, color: 'text-primary' },
  ];

  const sentimentChartData = {
    labels: Object.keys(data?.sentimentCounts || {}).map(s => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
    datasets: [{
      label: 'Feedback Sentiment',
      data: Object.values(data?.sentimentCounts || {}),
      backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#F97316', '#EF4444'],
    }],
  };

  const marketplaceChartData = {
    labels: Object.keys(data?.marketplacePerformance || {}),
    datasets: [{
      label: 'Reviews by Marketplace',
      data: Object.values(data?.marketplacePerformance || {}),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
    }],
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (error) {
    return <div className="text-destructive p-8"><AlertTriangle className="inline mr-2" />Error loading dashboard data: {error.message}</div>;
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - ReviewFlow</title>
        <meta name="description" content="Your central hub for managing Amazon review campaigns." />
      </Helmet>
      
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, here's a snapshot of your progress.</p>
        </motion.div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {statCards.map((stat, index) => (
            <motion.div key={index} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value ?? 0}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader><CardTitle>Marketplace Performance</CardTitle></CardHeader>
              <CardContent><Bar data={marketplaceChartData} options={{ responsive: true }} /></CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader><CardTitle>Feedback Sentiment</CardTitle></CardHeader>
              <CardContent className="flex justify-center items-center h-64"><Pie data={sentimentChartData} options={{ responsive: true, maintainAspectRatio: false }} /></CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Reviews</CardTitle>
                <CardDescription>The latest 5 reviews submitted by your customers.</CardDescription>
              </CardHeader>
              <CardContent>
                 {!data.recentReviews || data.recentReviews.length === 0 ? <p className="text-muted-foreground">No reviews yet.</p> :
                 (
                   <div className="space-y-4">
                     {data.recentReviews.map((review, i) => (
                       <div key={i} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                         <div>
                           <p className="font-medium">{review.campaignName}</p>
                           <p className="text-sm text-muted-foreground">{new Date(review.submitted_at).toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-medium">{review.satisfaction_rating.replace(/_/g, ' ')}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )
                }
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <Card className="h-full flex flex-col justify-between">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => navigate('/campaigns', { state: { openForm: true } })} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Create New Campaign
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/reviews">View All Reviews</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
