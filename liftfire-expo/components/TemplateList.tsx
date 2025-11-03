// Workout Template List Component
// Displays available workout templates

import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTemplates } from '../hooks/useTemplates';
import { WorkoutTemplate } from '../types';

interface TemplateListProps {
  onSelectTemplate?: (template: WorkoutTemplate) => void;
  onEditTemplate?: (template: WorkoutTemplate) => void;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  onSelectTemplate,
  onEditTemplate,
}) => {
  const { templates, loading, deleteTemplate, duplicateTemplate } = useTemplates();

  const handleDelete = (template: WorkoutTemplate) => {
    if (template.id.startsWith('template-')) {
      Alert.alert('Error', 'Cannot delete system templates');
      return;
    }

    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTemplate(template.id),
        },
      ]
    );
  };

  const handleDuplicate = async (template: WorkoutTemplate) => {
    const newTemplate = await duplicateTemplate(template.id);
    if (newTemplate) {
      Alert.alert('Success', 'Template duplicated successfully');
    }
  };

  const renderTemplate = ({ item }: { item: WorkoutTemplate }) => {
    const isSystemTemplate = item.id.startsWith('template-');

    return (
      <TouchableOpacity
        style={styles.templateCard}
        onPress={() => onSelectTemplate?.(item)}
      >
        <View style={styles.templateHeader}>
          <View style={styles.templateTitleRow}>
            <Text style={styles.templateName}>{item.name}</Text>
            {isSystemTemplate && (
              <View style={styles.systemBadge}>
                <Text style={styles.systemBadgeText}>System</Text>
              </View>
            )}
          </View>
          <Text style={styles.templateDifficulty}>
            {'⭐'.repeat(item.difficulty)}
          </Text>
        </View>

        <Text style={styles.templateNotes} numberOfLines={2}>
          {item.notes}
        </Text>

        <View style={styles.templateMeta}>
          <Text style={styles.metaText}>
            {item.exercises.length} exercises
          </Text>
          <Text style={styles.metaText}>
            ~{item.estimated_duration} min
          </Text>
          <Text style={styles.metaText}>
            {item.category}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSelectTemplate?.(item)}
          >
            <Text style={styles.actionButtonText}>Use Template</Text>
          </TouchableOpacity>

          {!isSystemTemplate && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => onEditTemplate?.(item)}
              >
                <Text style={styles.actionButtonTextSecondary}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={() => handleDelete(item)}
              >
                <Text style={[styles.actionButtonTextSecondary, styles.deleteText]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => handleDuplicate(item)}
          >
            <Text style={styles.actionButtonTextSecondary}>Duplicate</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={templates}
        renderItem={renderTemplate}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No templates available</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  templateCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  templateName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  systemBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  systemBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  templateDifficulty: {
    fontSize: 14,
  },
  templateNotes: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  templateMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonTextSecondary: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteText: {
    color: '#ff3b30',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 32,
  },
});
