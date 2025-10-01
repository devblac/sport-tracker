/**
 * Feature Flag Dashboard for administrators
 * Allows viewing and managing feature flags in development/staging
 */

import React, { useState, useEffect } from 'react';
import { featureFlags, FeatureFlag } from '../../utils/featureFlags/featureFlags';

interface FeatureFlagDashboardProps {
  className?: string;
}

export function FeatureFlagDashboard({ className = '' }: FeatureFlagDashboardProps) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = () => {
    const allFlags = featureFlags.getAllFlags();
    setFlags(allFlags);
  };

  const filteredFlags = flags.filter(flag => {
    const matchesSearch = flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         flag.key.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterEnabled === 'all' || 
                         (filterEnabled === 'enabled' && flag.enabled) ||
                         (filterEnabled === 'disabled' && !flag.enabled);
    
    return matchesSearch && matchesFilter;
  });

  const getFlagStatus = (flag: FeatureFlag) => {
    const isEnabled = featureFlags.isEnabled(flag.key);
    const variant = featureFlags.getVariant(flag.key);
    
    return {
      enabled: isEnabled,
      variant,
      rollout: flag.rolloutPercentage
    };
  };

  const getStatusColor = (flag: FeatureFlag) => {
    if (!flag.enabled) return 'bg-gray-100 text-gray-800';
    if (flag.rolloutPercentage === 100) return 'bg-green-100 text-green-800';
    if (flag.rolloutPercentage > 0) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = (flag: FeatureFlag) => {
    if (!flag.enabled) return 'Disabled';
    if (flag.rolloutPercentage === 100) return 'Fully Enabled';
    if (flag.rolloutPercentage > 0) return `${flag.rolloutPercentage}% Rollout`;
    return 'Disabled';
  };

  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">
          Feature flag dashboard is not available in production environment.
        </p>
      </div>
    );
  }

  return (
    <div className={`feature-flag-dashboard ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Flags</h2>
        <p className="text-gray-600">
          Manage and monitor feature flags for controlled rollouts and A/B testing.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search flags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterEnabled}
          onChange={(e) => setFilterEnabled(e.target.value as any)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Flags</option>
          <option value="enabled">Enabled Only</option>
          <option value="disabled">Disabled Only</option>
        </select>

        <button
          onClick={loadFlags}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Refresh
        </button>
      </div>

      {/* Flags List */}
      <div className="space-y-4">
        {filteredFlags.map((flag) => {
          const status = getFlagStatus(flag);
          
          return (
            <div
              key={flag.key}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {flag.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(flag)}`}
                    >
                      {getStatusText(flag)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {flag.key}
                    </code>
                  </p>
                  
                  <p className="text-gray-700">{flag.description}</p>
                </div>
              </div>

              {/* Flag Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <p className="text-sm">
                    {status.enabled ? '✅ Enabled' : '❌ Disabled'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rollout
                  </label>
                  <p className="text-sm">{flag.rolloutPercentage}%</p>
                </div>
                
                {status.variant && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Variant
                    </label>
                    <p className="text-sm">
                      <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {status.variant}
                      </code>
                    </p>
                  </div>
                )}
              </div>

              {/* Conditions */}
              {flag.conditions && flag.conditions.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions
                  </label>
                  <div className="space-y-1">
                    {flag.conditions.map((condition, index) => (
                      <div
                        key={index}
                        className="text-sm bg-gray-50 px-3 py-2 rounded border"
                      >
                        <code>
                          {condition.type} {condition.operator} {JSON.stringify(condition.value)}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variants */}
              {flag.variants && flag.variants.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variants
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {flag.variants.map((variant) => (
                      <div
                        key={variant.key}
                        className="bg-gray-50 px-3 py-2 rounded border"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{variant.name}</span>
                          <span className="text-xs text-gray-600">{variant.weight}%</span>
                        </div>
                        {variant.payload && (
                          <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                            {JSON.stringify(variant.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {flag.metadata && Object.keys(flag.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metadata
                  </label>
                  <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                    {JSON.stringify(flag.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredFlags.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchTerm || filterEnabled !== 'all' 
              ? 'No flags match your filters.' 
              : 'No feature flags found.'}
          </p>
        </div>
      )}

      {/* Environment Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Environment Information</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Environment:</strong> {import.meta.env.VITE_ENVIRONMENT || 'development'}</p>
          <p><strong>Build Version:</strong> {import.meta.env.VITE_APP_VERSION || 'unknown'}</p>
          <p><strong>Total Flags:</strong> {flags.length}</p>
          <p><strong>Enabled Flags:</strong> {flags.filter(f => f.enabled).length}</p>
        </div>
      </div>
    </div>
  );
}