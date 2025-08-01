
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User } from 'lucide-react';

const fetchProfile = async (userId) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') { // Ignore "No rows found" error
    throw error;
  }
  return data;
};

const Profile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user?.id),
    enabled: !!user?.id,
  });

  const [formData, setFormData] = useState({
    contact_name: '',
    company_name: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        contact_name: profile.contact_name || '',
        company_name: profile.company_name || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);
  
  const mutation = useMutation({
    mutationFn: async (updatedProfile) => {
      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error) => {
      toast({ title: "Error updating profile", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-10 w-10 animate-spin text-white" /></div>;
  }

  return (
    <>
      <Helmet>
        <title>User Profile - ReviewFlow</title>
      </Helmet>
      <div className="space-y-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold gradient-text">User Profile</h1>
          <p className="text-gray-400 mt-1">Manage your personal and company information.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-effect border-0">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
              <CardDescription className="text-gray-400">This email is used for login and cannot be changed here.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold">{user?.email}</p>
                  <p className="text-gray-400 text-sm">User ID: {user?.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <form onSubmit={handleSubmit}>
            <Card className="glass-effect border-0">
              <CardHeader>
                <CardTitle className="text-white">Profile Details</CardTitle>
                <CardDescription className="text-gray-400">Update your contact and company details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="contact_name" className="text-white">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name" className="text-white">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600" disabled={mutation.isPending}>
                    {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default Profile;
