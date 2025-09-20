import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const Search: React.FC = () => {
  return (
    <div className="text-center py-12">
      <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-200 mb-2">Advanced Search</h2>
      <p className="text-gray-400">This page will provide powerful search and filtering capabilities for your prompts.</p>
    </div>
  );
};

export default Search;