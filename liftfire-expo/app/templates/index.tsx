// Templates Screen - Browse and manage workout templates
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import { TemplateList } from '../../components/TemplateList';
import { WorkoutTemplate } from '../../types';

export default function TemplatesScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    // Navigate to workout creation with template data
    router.push({
      pathname: '/workout/new',
      params: { templateId: template.id },
    });
  };

  const handleEditTemplate = (template: WorkoutTemplate) => {
    // Navigate to template editor
    router.push({
      pathname: '/templates/edit',
      params: { templateId: template.id },
    });
  };

  const handleCreateTemplate = () => {
    router.push('/templates/new');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Templates</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateTemplate}
        >
          <Text style={styles.createButtonText}>+ New Template</Text>
        </TouchableOpacity>
      </View>

      <TemplateList
        onSelectTemplate={handleSelectTemplate}
        onEditTemplate={handleEditTemplate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
