import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const Prompts: React.FC = () => {
  return (
    <div className="text-center py-12">
      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-200 mb-2">Prompts Library</h2>
      <p className="text-gray-400">This page will show all your prompts with filtering and search capabilities.</p>
    </div>
  );
};

export default Prompts;