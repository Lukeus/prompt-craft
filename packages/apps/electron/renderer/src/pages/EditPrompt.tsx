import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';

const EditPrompt: React.FC = () => {
  return (
    <div className="text-center py-12">
      <PencilIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-200 mb-2">Edit Prompt</h2>
      <p className="text-gray-400">This page will allow editing existing prompts.</p>
    </div>
  );
};

export default EditPrompt;