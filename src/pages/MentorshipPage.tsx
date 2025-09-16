import React from 'react';
import { MentorshipDashboard } from '@/components/mentorship/MentorshipDashboard';

export const MentorshipPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MentorshipDashboard />
      </div>
    </div>
  );
};