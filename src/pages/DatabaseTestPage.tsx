/**
 * Database Test Page
 * 
 * Test page for demonstrating IndexedDB functionality and database operations.
 */

import React, { useState } from 'react';
import { 
  Database, 
  HardDrive, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  BarChart3
} from 'lucide-react';
import { useDatabase } from '@/hooks/useDatabase';
import { getDatabaseService } from '@/db/DatabaseService';

export const DatabaseTestPage: React.FC = () => {
  const {
    isInitialized,
    isInitializing,
    error,
    storageInfo,
    clearAllData,
    exportData,
    importData,
    refreshStorageInfo
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'test'>('overview');
  const [operationStatus, setOperationStatus] = useState<string | null>(null);
  const [isOperating, setIsOperating] = useState(false);

  // Test data operations
  const createTestData = async () => {
    try {
      setIsOperating(true);
      setOperationStatus('Creando datos de prueba...');

      // Create test user
      const testUser = {
        id: 'test-user-db',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const service = getDatabaseService();
      await service.createUser(testUser);

      // Create test user profile
      const testProfile = {
        userId: 'test-user-db',
        displayName: 'Usuario de Prueba',
        fitnessLevel: 'intermediate',
        currentLevel: 10,
        totalXP: 5000,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await service.updateUserProfile('test-user-db', testProfile);

      // Create test exercises
      const testExercises = [
        {
          id: 'bench-press',
          name: 'Bench Press',
          category: 'strength',
          bodyPart: 'chest',
          equipment: 'barbell',
          muscleGroups: ['chest', 'triceps', 'shoulders']
        },
        {
          id: 'squat',
          name: 'Squat',
          category: 'strength',
          bodyPart: 'legs',
          equipment: 'barbell',
          muscleGroups: ['quadriceps', 'glutes', 'hamstrings']
        },
        {
          id: 'deadlift',
          name: 'Deadlift',
          category: 'strength',
          bodyPart: 'back',
          equipment: 'barbell',
          muscleGroups: ['hamstrings', 'glutes', 'back', 'traps']
        }
      ];

      for (const exercise of testExercises) {
        await service.createExercise(exercise);
      }

      // Create test social posts
      const testPosts = [
        {
          id: 'post-1',
          userId: 'test-user-db',
          type: 'workout_completed',
          visibility: 'friends',
          title: 'Completé mi entrenamiento de pecho',
          description: '3 ejercicios • 45 min • 1200 kg levantados',
          data: {
            type: 'workout_completed',
            workoutId: 'workout-123',
            workoutName: 'Push Day',
            duration: 45,
            exerciseCount: 3,
            totalVolume: 1200
          },
          likesCount: 5,
          commentsCount: 2,
          sharesCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false,
          isPinned: false
        },
        {
          id: 'post-2',
          userId: 'test-user-db',
          type: 'achievement_unlocked',
          visibility: 'public',
          title: '🏆 ¡Logro desbloqueado!',
          description: 'Acabo de desbloquear "Primera Semana"',
          data: {
            type: 'achievement_unlocked',
            achievementId: 'first-week',
            achievementName: 'Primera Semana',
            achievementDescription: 'Completa 7 días de entrenamiento',
            achievementIcon: '🏆',
            rarity: 'common'
          },
          likesCount: 12,
          commentsCount: 4,
          sharesCount: 3,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          updatedAt: new Date(Date.now() - 86400000),
          isEdited: false,
          isPinned: true
        }
      ];

      for (const post of testPosts) {
        await service.createSocialPost(post);
      }

      // Create test privacy settings
      const privacySettings = {
        userId: 'test-user-db',
        profileVisibility: 'friends',
        showRealName: true,
        showAge: false,
        showLocation: false,
        showJoinDate: true,
        workoutVisibility: 'friends',
        achievementVisibility: 'public',
        statsVisibility: 'friends',
        activityVisibility: 'friends',
        allowFriendRequests: true,
        allowMessages: true,
        showInSearch: true,
        showOnlineStatus: true,
        notifyOnFriendRequest: true,
        notifyOnComment: true,
        notifyOnLike: true,
        notifyOnMention: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await service.updatePrivacySettings('test-user-db', privacySettings);

      await refreshStorageInfo();
      setOperationStatus('✅ Datos de prueba creados exitosamente');
    } catch (err) {
      setOperationStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsOperating(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsOperating(true);
      setOperationStatus('Eliminando todos los datos...');
      
      await clearAllData();
      setOperationStatus('✅ Todos los datos eliminados exitosamente');
    } catch (err) {
      setOperationStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsOperating(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsOperating(true);
      setOperationStatus('Exportando datos...');
      
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitness-app-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setOperationStatus('✅ Datos exportados exitosamente');
    } catch (err) {
      setOperationStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsOperating(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsOperating(true);
      setOperationStatus('Importando datos...');
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      await importData(data);
      setOperationStatus('✅ Datos importados exitosamente');
    } catch (err) {
      setOperationStatus(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsOperating(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Info },
    { id: 'operations', label: 'Operaciones', icon: Database },
    { id: 'test', label: 'Pruebas', icon: BarChart3 }
  ] as const;

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Inicializando base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Database className="w-8 h-8 text-blue-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Sistema de Base de Datos
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    IndexedDB para almacenamiento offline-first
                  </p>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                {isInitialized ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-600 dark:text-red-400">Desconectado</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Operation Status */}
      {operationStatus && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200">{operationStatus}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Database Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Información de la Base de Datos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {storageInfo?.stores.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tablas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {storageInfo?.totalRecords || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Registros Totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    IndexedDB
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tipo de Storage</div>
                </div>
              </div>

              <button
                onClick={refreshStorageInfo}
                disabled={isOperating}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isOperating ? 'animate-spin' : ''}`} />
                <span>Actualizar Info</span>
              </button>
            </div>

            {/* Storage Breakdown */}
            {storageInfo && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Desglose por Tabla
                </h3>
                
                <div className="space-y-3">
                  {storageInfo.stores.map((store) => (
                    <div key={store.name} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <HardDrive className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {store.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {store.count} registros
                        </span>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${storageInfo.totalRecords > 0 ? (store.count / storageInfo.totalRecords) * 100 : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'operations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Data */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Exportar Datos
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Descarga todos los datos en formato JSON para respaldo.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={isOperating || !isInitialized}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>

              {/* Import Data */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Importar Datos
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Restaura datos desde un archivo de respaldo JSON.
                </p>
                <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Importar</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    disabled={isOperating || !isInitialized}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Clear Data */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Limpiar Datos
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Elimina todos los datos de la base de datos. ¡Cuidado!
                </p>
                <button
                  onClick={handleClearData}
                  disabled={isOperating || !isInitialized}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpiar Todo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Datos de Prueba
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Crea datos de ejemplo para probar la funcionalidad de la aplicación.
              </p>
              
              <button
                onClick={createTestData}
                disabled={isOperating || !isInitialized}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Database className="w-4 h-4" />
                <span>Crear Datos de Prueba</span>
              </button>
            </div>

            {/* Test Data Preview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Datos que se Crearán
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <strong className="text-gray-900 dark:text-white">Usuario:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Usuario de prueba con perfil completo
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Ejercicios:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    3 ejercicios básicos (Bench Press, Squat, Deadlift)
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Posts Sociales:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    2 posts de ejemplo con likes y comentarios
                  </span>
                </div>
                <div>
                  <strong className="text-gray-900 dark:text-white">Configuración:</strong>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Configuraciones de privacidad predeterminadas
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseTestPage;