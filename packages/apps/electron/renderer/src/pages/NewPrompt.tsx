import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const NewPrompt: React.FC = () => {
  return (
    <div className="text-center py-12">
      <PlusIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-200 mb-2">Create New Prompt</h2>
      <p className="text-gray-400">This page will contain the 4-step prompt creation wizard.</p>
    </div>
  );
};

export default NewPrompt;