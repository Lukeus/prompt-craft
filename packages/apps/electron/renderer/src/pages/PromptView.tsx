import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';

const PromptView: React.FC = () => {
  return (
    <div className="text-center py-12">
      <EyeIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-200 mb-2">View Prompt</h2>
      <p className="text-gray-400">This page will display prompt details and allow testing.</p>
    </div>
  );
};

export default PromptView;