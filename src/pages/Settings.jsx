
import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CredentialsForm from '@/components/CredentialsForm';

const Settings = () => {
  return (
    <>
      <Helmet>
        <title>Settings - ReviewFlow</title>
      </Helmet>
      <div className="space-y-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold gradient-text">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your integrations and application settings.</p>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-effect border-0">
            <CardHeader>
              <CardTitle className="text-white">Amazon SP-API Credentials</CardTitle>
              <CardDescription className="text-gray-400">
                Securely store your Amazon Selling Partner API credentials here. These are required to verify customer Order IDs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CredentialsForm />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default Settings;
