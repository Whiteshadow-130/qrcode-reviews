import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CredentialsForm = ({ onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    refreshToken: '',
    clientId: '',
    clientSecret: ''
  });
  const [showCredentials, setShowCredentials] = useState({
    refreshToken: false,
    clientId: false,
    clientSecret: false
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCredentials = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('encrypted_refresh_token, encrypted_client_id, encrypted_client_secret')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setCredentials({
          refreshToken: data.encrypted_refresh_token || '',
          clientId: data.encrypted_client_id || '',
          clientSecret: data.encrypted_client_secret || ''
        });
      }
    } catch (error) {
      toast({
        title: "Error loading credentials",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.refreshToken || !credentials.clientId || !credentials.clientSecret) {
      toast({
        title: "Missing credentials",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          encrypted_refresh_token: credentials.refreshToken,
          encrypted_client_id: credentials.clientId,
          encrypted_client_secret: credentials.clientSecret
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Credentials saved!",
        description: "Your Amazon SP-API credentials have been securely stored.",
      });
      setIsEditing(false);
      if (onClose) onClose();
    } catch (error) {
      toast({
        title: "Error saving credentials",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  const toggleVisibility = (field) => {
    setShowCredentials(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const maskValue = (value) => {
    if (!value) return '';
    return '*'.repeat(Math.min(value.length, 20));
  };

  const hasCredentials = credentials.refreshToken && credentials.clientId && credentials.clientSecret;

  if (onClose) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="glass-effect border-0 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Amazon SP-API Credentials
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure your Amazon Selling Partner API credentials for order verification
            </DialogDescription>
          </DialogHeader>
          <CredentialsFormContent 
            credentials={credentials}
            showCredentials={showCredentials}
            isEditing={isEditing}
            hasCredentials={hasCredentials}
            onSubmit={handleSubmit}
            onInputChange={handleInputChange}
            onToggleVisibility={toggleVisibility}
            onToggleEdit={() => setIsEditing(!isEditing)}
            maskValue={maskValue}
            onClose={onClose}
            loading={loading}
            saving={saving}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className="glass-effect border-0">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Amazon SP-API Credentials
        </CardTitle>
        <CardDescription className="text-gray-400">
          Configure your Amazon Selling Partner API credentials for order verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CredentialsFormContent 
          credentials={credentials}
          showCredentials={showCredentials}
          isEditing={isEditing}
          hasCredentials={hasCredentials}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onToggleVisibility={toggleVisibility}
          onToggleEdit={() => setIsEditing(!isEditing)}
          maskValue={maskValue}
          loading={loading}
          saving={saving}
        />
      </CardContent>
    </Card>
  );
};

const CredentialsFormContent = ({ 
  credentials, 
  showCredentials, 
  isEditing, 
  hasCredentials, 
  onSubmit, 
  onInputChange, 
  onToggleVisibility, 
  onToggleEdit, 
  maskValue,
  onClose,
  loading,
  saving
}) => {

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!hasCredentials && !isEditing && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div>
              <h4 className="text-yellow-400 font-medium">Setup Required</h4>
              <p className="text-yellow-300/80 text-sm mt-1">
                You need to configure your Amazon SP-API credentials to enable order verification and ASIN fetching.
              </p>
            </div>
          </div>
        </div>
      )}

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refreshToken" className="text-white">Refresh Token *</Label>
            <div className="relative">
              <Input
                id="refreshToken"
                type={showCredentials.refreshToken ? "text" : "password"}
                placeholder="Atzr|IwEBIC0fazAHD9OLX2Q-WbXW8VGEo4GcKeDFpnE7..."
                value={isEditing ? credentials.refreshToken : maskValue(credentials.refreshToken)}
                onChange={(e) => onInputChange('refreshToken', e.target.value)}
                disabled={!isEditing || saving}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => onToggleVisibility('refreshToken')}
              >
                {showCredentials.refreshToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId" className="text-white">Client ID *</Label>
            <div className="relative">
              <Input
                id="clientId"
                type={showCredentials.clientId ? "text" : "password"}
                placeholder="amzn1.application-oa2-client.1c339a9042ef411f..."
                value={isEditing ? credentials.clientId : maskValue(credentials.clientId)}
                onChange={(e) => onInputChange('clientId', e.target.value)}
                disabled={!isEditing || saving}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => onToggleVisibility('clientId')}
              >
                {showCredentials.clientId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret" className="text-white">Client Secret *</Label>
            <div className="relative">
              <Input
                id="clientSecret"
                type={showCredentials.clientSecret ? "text" : "password"}
                placeholder="amzn1.oa2-cs.v1.8883441a4ee1d5843b16ca56..."
                value={isEditing ? credentials.clientSecret : maskValue(credentials.clientSecret)}
                onChange={(e) => onInputChange('clientSecret', e.target.value)}
                disabled={!isEditing || saving}
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => onToggleVisibility('clientSecret')}
              >
                {showCredentials.clientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-400 font-medium mb-2">Security Notice</h4>
          <p className="text-blue-300/80 text-sm">
            Your credentials will be stored securely. They are only used to authenticate with Amazon's SP-API for order verification.
          </p>
        </div>

        <div className="flex space-x-3">
          {onClose && (
            <Button 
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          
          {!isEditing ? (
            <Button 
              type="button"
              onClick={() => onToggleEdit(true)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {hasCredentials ? 'Edit Credentials' : 'Add Credentials'}
            </Button>
          ) : (
            <>
              <Button 
                type="button"
                variant="outline"
                onClick={() => onToggleEdit(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save Credentials'}
              </Button>
            </>
          )}
        </div>
      </motion.form>
    </div>
  );
};

export default CredentialsForm;