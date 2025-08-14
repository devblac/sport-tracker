/**
 * Higher-Order Component for A/B Testing with JSX
 * Provides JSX-based experiment component rendering
 */

import React from 'react';
import { useExperimentComponent } from '@/hooks/useExperiment';

/**
 * Higher-order component for A/B testing with proper JSX support
 */
export const withExperimentJSX = <P extends object>(
  experimentId: string,
  variants: Record<string, React.ComponentType<P>>
) => {
  return (props: P) => {
    const { Component, isLoading } = useExperimentComponent(experimentId, variants);

    if (isLoading) {
      return (
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-20" />
      );
    }

    if (!Component) {
      // Fallback to control variant or first available
      const FallbackComponent = variants.control || Object.values(variants)[0];
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }

    return <Component {...props} />;
  };
};

/**
 * Experiment wrapper component for conditional rendering
 */
interface ExperimentWrapperProps {
  experimentId: string;
  variants: Record<string, React.ComponentType<any>>;
  fallback?: React.ComponentType<any>;
  loadingComponent?: React.ComponentType<any>;
  children?: React.ReactNode;
}

export const ExperimentWrapper: React.FC<ExperimentWrapperProps> = ({
  experimentId,
  variants,
  fallback,
  loadingComponent: LoadingComponent,
  children,
  ...props
}) => {
  const { Component, isLoading } = useExperimentComponent(experimentId, variants);

  if (isLoading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }
    return (
      <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-20" />
    );
  }

  if (!Component) {
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }
    
    // Try control variant or first available
    const FallbackComponent = variants.control || Object.values(variants)[0];
    return FallbackComponent ? <FallbackComponent {...props} /> : null;
  }

  return <Component {...props} />;
};