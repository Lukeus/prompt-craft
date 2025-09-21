import React from 'react';
import { ServerIcon } from '@heroicons/react/24/outline';

const MCP: React.FC = () => {
  return (
    <div className="text-center py-12">
      <ServerIcon className="mx-auto h-12 w-12 text-gray-500 mb-4" />
      <h2 className="text-xl font-semibold text-gray-200 mb-2">MCP Server</h2>
      <p className="text-gray-400">This page will show the Model Context Protocol server status and controls.</p>
    </div>
  );
};

export default MCP;