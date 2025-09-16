import { useState, useEffect } from 'react';
import { workoutRecoveryService, type RecoveryData } from '@/services/WorkoutRecoveryService';

export const useWorkoutRecovery = () => {
  const [recoveryData, setRecoveryData] = useState<RecoveryData[]>([]);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkForRecovery();
  }, []);

  const checkForRecovery = async () => {
    try {
      setIsLoading(true);
      const data = await workoutRecoveryService.checkForRecoverableWorkouts();
      
      if (data.length > 0) {
        setRecoveryData(data);
        setShowRecoveryModal(true);
      }
    } catch (error) {
      console.error('Error checking for workout recovery:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = async (data: RecoveryData) => {
    try {
      const success = await workoutRecoveryService.recoverWorkout(data);
      
      if (success) {
        // Remove this recovery data from the list
        setRecoveryData(prev => prev.filter(item => 
          item.workout.id !== data.workout.id || item.source !== data.source
        ));
        
        // Close modal if no more recovery data
        if (recoveryData.length <= 1) {
          setShowRecoveryModal(false);
        }
        
        return data.workout;
      }
    } catch (error) {
      console.error('Error recovering workout:', error);
    }
    
    return null;
  };

  const handleDiscard = async (data: RecoveryData) => {
    try {
      await workoutRecoveryService.discardRecovery(data);
      
      // Remove this recovery data from the list
      setRecoveryData(prev => prev.filter(item => 
        item.workout.id !== data.workout.id || item.source !== data.source
      ));
      
      // Close modal if no more recovery data
      if (recoveryData.length <= 1) {
        setShowRecoveryModal(false);
      }
    } catch (error) {
      console.error('Error discarding recovery:', error);
    }
  };

  const handleCloseModal = () => {
    setShowRecoveryModal(false);
    setRecoveryData([]);
  };

  const getRecoveryStats = () => {
    return workoutRecoveryService.getRecoveryStats();
  };

  return {
    recoveryData,
    showRecoveryModal,
    isLoading,
    handleRecover,
    handleDiscard,
    handleCloseModal,
    checkForRecovery,
    getRecoveryStats,
  };
};