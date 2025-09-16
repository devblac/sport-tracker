/**
 * Template Debug Page - Debug template visibility issues
 */

import React from 'react';
import { TemplateDebugger } from '@/components/debug/TemplateDebugger';

const TemplateDebugPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <TemplateDebugger />
      </div>
    </div>
  );
};

export default TemplateDebugPage;