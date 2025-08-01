import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Gift } from 'lucide-react';

const Step4_ThankYou = ({ formData, campaign }) => {
  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-effect border-0">
        <CardContent className="p-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Gift className="h-16 w-16 text-green-400 mx-auto mb-6" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-4">Thank You!</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Your feedback has been submitted successfully. We appreciate you taking the time!
          </p>
          {campaign?.promo_message && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-300">
              {campaign.promo_message}
            </div>
          )}
          <div className="space-y-2 text-sm text-gray-500 mt-6">
            <p>Submitted: {new Date().toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step4_ThankYou;