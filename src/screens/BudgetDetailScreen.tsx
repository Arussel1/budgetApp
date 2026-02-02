import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, BudgetEntry, Category } from '../types';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { formatDate } from '../utils/formatters';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, FlatList } from 'react-native';
import { getCategoryIcon } from '../constants/icons';
import { TextInput } from 'react-native-gesture-handler';

type BudgetDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookDetail'>;
type BudgetDetailScreenRouteProp = RouteProp<RootStackParamList, 'BookDetail'>;

interface Props {
  navigation: BudgetDetailScreenNavigationProp;
  route: BudgetDetailScreenRouteProp;
}

const CATEGORY_COLORS = [
  '#009688', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', 
  '#795548', '#607D8B', '#FF5722', '#3F51B5', '#00BCD4', 
  '#4CAF50', '#F44336'
];

const BudgetDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookId } = route.params;
  const { entries, loading, getEntriesForBook, deleteEntry, deleteBudgetBook, budgetBooks } = useBudget();
  const { theme, isDarkMode } = useTheme();
  const [currentBook, setCurrentBook] = useState(budgetBooks.find(b => b.id === bookId));
  const [viewMode, setViewMode] = useState<'balance' | 'income' | 'expense'>('balance');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  useEffect(() => {
    const unsubscribe = getEntriesForBook(bookId);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [bookId]);

  useEffect(() => {
     // Update current book reference when budgetBooks updates (e.g. totals change)
     setCurrentBook(budgetBooks.find(b => b.id === bookId));
  }, [budgetBooks, bookId]);


  const handleDeleteEntry = (entry: BudgetEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entry.id, entry.bookId, entry.amount, entry.type);
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  // Filtering logic
  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    const now = new Date();
    
    let matchesTime = true;
    if (timeFilter === 'day') {
      matchesTime = entryDate.toDateString() === now.toDateString();
    } else if (timeFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      matchesTime = entryDate >= weekAgo;
    } else if (timeFilter === 'month') {
      matchesTime = entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    } else if (timeFilter === 'custom') {
      matchesTime = entryDate >= customStartDate && entryDate <= customEndDate;
    }

    const matchesSearch = entry.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         entry.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = viewMode === 'balance' ? true : entry.type === viewMode;
    return matchesTime && matchesSearch && matchesType;
  });

  // Prepare Chart Data
  let totalValue = 0;
  
  // Create a mapping for quick lookup of category details
  const categoryMap: { [key: string]: Category } = {};
  if (currentBook) {
    [...currentBook.categories.income, ...currentBook.categories.expense].forEach(cat => {
      categoryMap[cat.name] = cat;
    });
  }

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = filteredEntries.reduce((acc: {[key: string]: {amount: number, type: 'income' | 'expense'}}, entry) => {
      const { category, amount, type } = entry;
      
      if (type === 'income') totalIncome += amount;
      else totalExpense += amount;

      const targetType = viewMode === 'income' ? 'income' : 'expense';
      if (type !== targetType) return acc;

      if (!acc[category]) {
          acc[category] = { amount: 0, type };
      }
      acc[category].amount += amount;
      totalValue += amount;
      return acc;
  }, {});

  const chartData = Object.keys(categoryTotals).map((catName) => {
      const { amount } = categoryTotals[catName];
      const categoryInfo = categoryMap[catName];
      const percentage = totalValue > 0 ? ((amount / totalValue) * 100).toFixed(0) : '0';
      return {
          value: amount,
          color: categoryInfo?.color || '#ccc',
          text: `${percentage}%`,
          category: catName,
          shiftTextY: 0,
          textColor: '#333',
          textSize: 10,
      };
  });
  
  if (chartData.length === 0) {
      chartData.push({ value: 1, color: '#e0e0e0', text: '', category: '', shiftTextY: 0, textColor: 'transparent', textSize: 0 });
  }

  // Group entries by Date
  const groupedEntries = filteredEntries.reduce((groups: any, entry) => {
    const rawDate = entry.date.split('T')[0];
    if (!groups[rawDate]) {
      groups[rawDate] = [];
    }
    groups[rawDate].push(entry);
    return groups;
  }, {});

  const sections = Object.keys(groupedEntries).map(date => ({
    title: date,
    data: groupedEntries[date],
  })).sort((a, b) => new Date(b.title).getTime() - new Date(a.title).getTime());

  const renderEntry = ({ item }: { item: BudgetEntry }) => {
    const categoryInfo = categoryMap[item.category];
    
    return (
      <TouchableOpacity
        style={[styles.entryRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
        onLongPress={() => handleDeleteEntry(item)}
      >
        <View style={styles.categoryIconContainer}>
          <View style={[styles.categoryCircleItem, { backgroundColor: categoryInfo?.color || theme.neutral }]}>
            <Ionicons name={(categoryInfo?.icon || 'pricetag-outline') as any} size={20} color="#fff" />
          </View>
          <Text style={[styles.iconCategoryLabel, { color: theme.textSecondary }]}>{item.category}</Text>
        </View>
        <View style={styles.entryInfo}>
          <Text style={[styles.entryDescription, { color: theme.text }]}>{item.description || 'No description'}</Text>
        </View>
        <View style={styles.amountContainer}>
           <Text style={[
             styles.entryAmount,
             { color: item.type === 'income' ? theme.income : theme.expense }
           ]}>
             {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
           </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: any) => (
    <View style={[styles.sectionHeader, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.textSecondary }]}>{formatDate(title)}</Text>
    </View>
  );

  if (!currentBook) {
     return (
        <SafeAreaView style={styles.container}>
           <Text>Book not found</Text>
        </SafeAreaView>
     );
  }

  const renderHeader = () => (
    <View>
      <View style={[styles.chartContainer, { backgroundColor: theme.surface }]}>
        <PieChart
          data={chartData}
          donut
          showGradient
          sectionAutoFocus
          radius={135}
          innerRadius={90}
          innerCircleColor={theme.surface}
          showText={false}
          showTextBackground={false}
          labelsPosition="outward"
          centerLabelComponent={() => {
            const filteredBalance = totalIncome - totalExpense;
            let label = 'Balance';
            let value = filteredBalance;
            if (viewMode === 'income') {
              label = 'Income';
              value = totalIncome;
            } else if (viewMode === 'expense') {
              label = 'Expense';
              value = totalExpense;
            }
            
            return (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Text style={{fontSize: 12, color: theme.textSecondary}}>{label}</Text>
                 <Text style={[styles.centerLabel, {color: viewMode === 'income' ? theme.income : (viewMode === 'expense' ? theme.expense : (filteredBalance >= 0 ? theme.income : theme.expense))}]}>
                  ${Math.abs(value).toFixed(2)}
                 </Text>
              </View>
            );
          }}
        />
        
        <View style={styles.legendContainer}>
          {chartData.map((item, index) => (
            item.category ? (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={[styles.legendText, { color: theme.text }]}>
                  {item.category}: <Text style={[styles.legendPercentage, { color: theme.primary }]}>{item.text}</Text>
                </Text>
              </View>
            ) : null
          ))}
        </View>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
         <View style={[styles.tabContainer, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]}>
            <TouchableOpacity 
              style={[styles.tab, viewMode === 'balance' && [styles.activeTab, { backgroundColor: theme.surface }]]} 
              onPress={() => setViewMode('balance')}
            >
              <Text style={[styles.tabText, viewMode === 'balance' && [styles.activeTabText, { color: theme.primary }]]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, viewMode === 'income' && [styles.activeTab, { backgroundColor: theme.surface }]]} 
              onPress={() => setViewMode('income')}
            >
              <Text style={[styles.tabText, viewMode === 'income' && [styles.activeTabText, { color: theme.primary }]]}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, viewMode === 'expense' && [styles.activeTab, { backgroundColor: theme.surface }]]} 
              onPress={() => setViewMode('expense')}
            >
              <Text style={[styles.tabText, viewMode === 'expense' && [styles.activeTabText, { color: theme.primary }]]}>Expense</Text>
            </TouchableOpacity>
         </View>
          <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]}>
             <Ionicons name="search" size={20} color={theme.textSecondary} />
             <TextInput
               style={[styles.searchInput, { color: theme.text }]}
               placeholder="Filter by name or category..."
               placeholderTextColor={theme.textSecondary}
               value={searchQuery}
               onChangeText={setSearchQuery}
             />
             {searchQuery ? (
               <TouchableOpacity onPress={() => setSearchQuery('')}>
                 <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
               </TouchableOpacity>
             ) : null}
          </View>

          <View style={styles.timeFilterContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={['day', 'week', 'month', 'all', 'custom']}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                   style={[styles.timeFilterTab, timeFilter === item && { backgroundColor: theme.primary, borderColor: theme.primary }]} 
                   onPress={() => setTimeFilter(item as any)}
                >
                   <Text style={[styles.timeFilterText, { color: theme.text }, timeFilter === item && { color: '#fff' }]}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                   </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.timeFilterList}
            />
          </View>

          {timeFilter === 'custom' && (
            <View style={styles.customDateContainer}>
              <TouchableOpacity 
                style={[styles.dateButton, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]} 
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.text }]}>From: {customStartDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.dateButton, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]} 
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={[styles.dateButtonText, { color: theme.text }]}>To: {customEndDate.toLocaleDateString()}</Text>
              </TouchableOpacity>

              {showStartDatePicker && (
                <DateTimePicker
                  value={customStartDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartDatePicker(false);
                    if (date) setCustomStartDate(date);
                  }}
                />
              )}
              {showEndDatePicker && (
                <DateTimePicker
                  value={customEndDate}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndDatePicker(false);
                    if (date) setCustomEndDate(date);
                  }}
                />
              )}
            </View>
          )}
       </View>
    </View>
  );

  if (loading && entries.length === 0) {
     return (
        <SafeAreaView style={styles.container}>
           <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6200ee" />
           </View>
        </SafeAreaView>
     );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Text style={[styles.backButtonText, { color: theme.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{currentBook.name}</Text>
        <View style={styles.headerButtons}>
           <TouchableOpacity onPress={() => navigation.navigate('BookForm', { bookId: currentBook.id })} style={styles.iconButton}>
             <Ionicons name="pencil" size={24} color={theme.primary} />
           </TouchableOpacity>
           <TouchableOpacity 
              onPress={() => {
                Alert.alert(
                  'Delete Budget', 
                  'Are you sure you want to delete this budget and all its entries?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: async () => {
                         try {
                           await deleteBudgetBook(currentBook.id);
                           navigation.navigate('Home');
                         } catch (err: any) {
                           Alert.alert('Error', err.message);
                         }
                      }
                    }
                  ]
                );
              }} 
              style={styles.iconButton}
           >
             <Ionicons name="trash" size={24} color={theme.expense} />
           </TouchableOpacity>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
           <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No entries yet.</Text>
              <Text style={styles.emptySubText}>Tap + to add income or expense.</Text>
           </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('EntryForm', { bookId })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffbf',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6200ee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  chartContainer: {
      alignItems: 'center',
      marginVertical: 20,
      backgroundColor: '#fff',
      marginHorizontal: 16,
      borderRadius: 12,
      padding: 16,
      elevation: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#333',
  },
  legendPercentage: {
    fontWeight: 'bold',
  },
  centerLabel: {
      fontSize: 22,
      fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  incomeValue: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  expenseValue: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'uppercase',
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryIconContainer: {
    alignItems: 'center',
    width: 60,
  },
  iconCategoryLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  entryCategory: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  entryDescription: {
    fontSize: 15,
    color: '#333',
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountContainer: {
    marginLeft: 8,
    alignItems: 'flex-end',
    minWidth: 80,
  },
  categoryCircleItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  emptyContainer: {
     padding: 32,
     alignItems: 'center',
  },
  emptyText: {
     fontSize: 16,
     color: '#666',
     marginBottom: 8,
  },
  emptySubText: {
     fontSize: 14,
     color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
  },
  timeFilterContainer: {
    marginTop: 12,
  },
  timeFilterList: {
    paddingRight: 10,
  },
  timeFilterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: 'transparent',
  },
  timeFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  customDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateButton: {
    flex: 0.48,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BudgetDetailScreen;
