/**
 * EventsDialog Component
 * 
 * Development-only dialog for viewing game event data
 * Shows all events in a tabular format for debugging
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Dialog, Button, useTheme } from 'react-native-paper';
import { GameEvent } from '../../types/game';
import { DesignSystem } from '../../theme';

interface EventsDialogProps {
  visible: boolean;
  onDismiss: () => void;
  events: GameEvent[];
}

export const EventsDialog: React.FC<EventsDialogProps> = ({
  visible,
  onDismiss,
  events,
}) => {
  const theme = useTheme();

  const activeEvents = events.filter(e => !e.isUndone);
  const undoneEvents = events.filter(e => e.isUndone);

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      style={{ backgroundColor: theme.colors.surface, maxHeight: '90%', maxWidth: '95%' }}
    >
      <Dialog.Title>Game Events (Dev Only)</Dialog.Title>
      <Dialog.Content style={{ maxHeight: 500 }}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={true}
          horizontal={true}
          showsHorizontalScrollIndicator={true}
        >
          {events.length === 0 ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', padding: DesignSystem.spacing.md }}>
              No events recorded yet
            </Text>
          ) : (
            <View style={styles.table}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.cell, styles.headerCell]}>eventId</Text>
                <Text style={[styles.cell, styles.headerCell]}>timestamp</Text>
                <Text style={[styles.cell, styles.headerCell]}>cupId</Text>
                <Text style={[styles.cell, styles.headerCell]}>playerHandle</Text>
                <Text style={[styles.cell, styles.headerCell]}>isBounce</Text>
                <Text style={[styles.cell, styles.headerCell]}>isGrenade</Text>
                <Text style={[styles.cell, styles.headerCell]}>isUndone</Text>
                <Text style={[styles.cell, styles.headerCell]}>bounceGroupId</Text>
                <Text style={[styles.cell, styles.headerCell]}>team1CupsRemaining</Text>
                <Text style={[styles.cell, styles.headerCell]}>team2CupsRemaining</Text>
              </View>
              
              {/* Table Rows */}
              {events.map((event) => (
                <View key={event.eventId} style={styles.tableRow}>
                  <Text style={styles.cell}>{event.eventId}</Text>
                  <Text style={styles.cell}>{event.timestamp}</Text>
                  <Text style={styles.cell}>{event.cupId}</Text>
                  <Text style={styles.cell}>{event.playerHandle}</Text>
                  <Text style={styles.cell}>{String(event.isBounce)}</Text>
                  <Text style={styles.cell}>{String(event.isGrenade)}</Text>
                  <Text style={styles.cell}>{String(event.isUndone)}</Text>
                  <Text style={styles.cell}>{event.bounceGroupId || 'null'}</Text>
                  <Text style={styles.cell}>{event.team1CupsRemaining}</Text>
                  <Text style={styles.cell}>{event.team2CupsRemaining}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss} textColor={theme.colors.onSurface}>
          Close
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 400,
  },
  table: {
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.3)',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
    minHeight: 35,
  },
  tableHeader: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderBottomWidth: 2,
  },
  cell: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 10,
    minWidth: 90,
    maxWidth: 140,
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 11,
  },
});
