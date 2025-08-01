
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Filter, X } from 'lucide-react';
import ReviewsTable from '@/components/ReviewsTable';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 10;

const fetchAllData = async (userId) => {
  if (!userId) return { reviews: [], campaigns: [], count: 0 };

  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('user_id', userId);
  if (campaignsError) throw campaignsError;

  const { data: reviews, error: reviewsError, count } = await supabase
    .from('reviews')
    .select('*, product:products(title, asin)', { count: 'exact' })
    .in('campaign_id', campaigns.map(c => c.id))
    .order('submitted_at', { ascending: false });
  if (reviewsError) throw reviewsError;
  
  return { reviews, campaigns, count };
};

const AllReviews = () => {
  const { user } = useAuth();
  
  const [filters, setFilters] = useState({
    campaignId: 'all',
    date: null,
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['allReviewsData', user?.id],
    queryFn: () => fetchAllData(user?.id),
    enabled: !!user?.id,
  });

  const filteredReviews = useMemo(() => {
    if (!data?.reviews) return [];
    return data.reviews.filter(review => {
      const campaignMatch = filters.campaignId === 'all' || review.campaign_id === filters.campaignId;
      const dateMatch = !filters.date || format(new Date(review.submitted_at), 'yyyy-MM-dd') === format(filters.date, 'yyyy-MM-dd');
      const searchMatch = !filters.search || 
                          review.customer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                          review.customer_email.toLowerCase().includes(filters.search.toLowerCase()) ||
                          review.order_id.toLowerCase().includes(filters.search.toLowerCase());
      return campaignMatch && dateMatch && searchMatch;
    });
  }, [data?.reviews, filters]);

  const paginatedReviews = useMemo(() => {
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE;
    return filteredReviews.slice(from, to);
  }, [filteredReviews, currentPage]);

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);

  const handleFilterChange = (key, value) => {
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setFilters({ campaignId: 'all', date: null, search: '' });
  };

  return (
    <>
      <Helmet>
        <title>All Reviews - ReviewFlow</title>
      </Helmet>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Reviews</h1>
            <p className="text-muted-foreground mt-1">Filter, view, and export all customer feedback.</p>
          </div>
        </motion.div>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, order..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full sm:w-auto flex-grow"
              />
              <Select value={filters.campaignId} onValueChange={(value) => handleFilterChange('campaignId', value)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {data?.campaigns?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !filters.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.date ? format(filters.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.date}
                    onSelect={(date) => handleFilterChange('date', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin" /></div>
        ) : (
          <>
            <ReviewsTable reviews={paginatedReviews} campaigns={data?.campaigns || []} loading={false} onUpdate={() => {}} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </>
        )}
      </div>
    </>
  );
};

export default AllReviews;
