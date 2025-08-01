import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const StepIndicator = ({ currentStep, campaignName }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4 max-w-sm mx-auto">
        {[1, 2, 3].map((step) => (
          <React.Fragment key={step}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
              currentStep >= step 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
            </div>
            {step < 3 && (
              <div className="flex-1 h-1 mx-2 relative">
                 <div className={`absolute top-0 left-0 h-full bg-gray-700 w-full`}></div>
                 <motion.div 
                    className={`absolute top-0 left-0 h-full bg-blue-600`}
                    initial={{ width: "0%" }}
                    animate={{ width: currentStep > step ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                 />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold gradient-text">{campaignName}</h1>
        <p className="text-gray-400 mt-1">Help us improve by sharing your experience</p>
      </div>
    </motion.div>
  );
};

export default StepIndicator;