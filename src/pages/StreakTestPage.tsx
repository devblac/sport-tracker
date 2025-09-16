/**
 * Streak System Test Page
 * 
 * Test page to demonstrate and test the intelligent streak system
 * with personalized schedules, special days, and milestone celebrations.
 */

import React from 'react';
import StreakDashboard from '@/components/streaks/StreakDashboard';

const StreakTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Rachas Inteligentes
          </h1>
          <p className="text-gray-600">
            Gestiona tus horarios de entrenamiento, días especiales y celebra tus logros.
          </p>
        </div>

        <StreakDashboard />
      </div>
    </div>
  );
};

export default StreakTestPage;