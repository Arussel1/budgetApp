import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { budgetBooks } = useBudget();
  const { isDarkMode, theme, toggleTheme } = useTheme();

  const stats = useMemo(() => {
    const totalBudgets = budgetBooks.length;
    let totalIncome = 0;
    let totalExpense = 0;

    budgetBooks.forEach(book => {
      totalIncome += book.totalIncome;
      totalExpense += book.totalExpense;
    });

    return { totalBudgets, totalIncome, totalExpense, netBalance: totalIncome - totalExpense };
  }, [budgetBooks]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await logout();
          } catch (err: any) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileSection, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {user?.displayName?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || 'U'}
            </Text>
          </View>

          <Text style={[styles.name, { color: theme.text }]}>{user?.displayName || 'User'}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>
          <View style={styles.themeRow}>
            <View style={styles.themeLabelContainer}>
              <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={theme.primary} />
              <Text style={[styles.themeLabel, { color: theme.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: theme.primary }}
              thumbColor={isDarkMode ? theme.accent : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Budget Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]}>
              <Text style={[styles.statNumber, { color: theme.primary }]}>{stats.totalBudgets}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Budgets</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]}>
              <Text style={[styles.statNumber, { color: theme.income }]}>${stats.totalIncome.toFixed(0)}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Income</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]}>
              <Text style={[styles.statNumber, { color: theme.expense }]}>${stats.totalExpense.toFixed(0)}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Expenses</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]}>
              <Text style={[styles.statNumber, { color: stats.netBalance >= 0 ? theme.income : theme.expense }]}>
                ${Math.abs(stats.netBalance).toFixed(0)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Net Worth</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffbf',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  themeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeLabel: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
