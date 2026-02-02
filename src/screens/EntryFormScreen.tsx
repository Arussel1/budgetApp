import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { RootStackParamList, Category } from '../types';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICON_OPTIONS, CATEGORY_COLOR_OPTIONS, CATEGORY_ICONS_BY_GROUP, CATEGORY_COLORS_BY_GROUP } from '../constants/design';

type EntryFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'EntryForm'>;
type EntryFormScreenRouteProp = RouteProp<RootStackParamList, 'EntryForm'>;

interface Props {
  navigation: EntryFormScreenNavigationProp;
  route: EntryFormScreenRouteProp;
}

const entryValidationSchema = Yup.object().shape({
  amount: Yup.number().required('Amount is required').min(0.01, 'Amount must be greater than 0'),
  category: Yup.string().required('Category is required'),
  description: Yup.string(),
  type: Yup.string().oneOf(['income', 'expense']).required(),
});

// Categories are now managed dynamically per book
// As per user request, we start with no prefilled categories.

const EntryFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookId } = route.params;
  const { addEntry, budgetBooks, updateBudgetBook } = useBudget(); 
  const { theme, isDarkMode } = useTheme();
  const currentBook = budgetBooks.find(b => b.id === bookId);

  // Note: Editing entry is not fully implemented in context yet, simplified to Add for now as per plan
  
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICON_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLOR_OPTIONS[0]);
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [showAllColors, setShowAllColors] = useState(false);

  const initialValues = {
    amount: '',
    category: '',
    description: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date(),
  };

  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const entryData = {
        bookId,
        type: values.type,
        amount: parseFloat(values.amount),
        category: values.category,
        description: values.description,
        date: values.date.toISOString(),
      };

      await addEntry(entryData);
      Alert.alert('Success', 'Entry added successfully');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }
    
    if (!currentBook) return;

    try {
      setLoading(true);
      const currentList = currentBook.categories?.[type] || [];
      
      let updatedList = [...currentList];
      
      if (editingCategory) {
        // Edit mode
        updatedList = updatedList.map(c => 
          c.name === editingCategory ? { 
            ...c, 
            name: newCategoryName.trim(),
            icon: selectedIcon,
            color: selectedColor
          } : c
        );
      } else {
        // Add mode
        if (updatedList.some(c => c.name === newCategoryName.trim())) {
             Alert.alert('Error', 'Category already exists');
             setLoading(false);
             return;
        }
        updatedList.push({
          id: Date.now().toString(),
          name: newCategoryName.trim(),
          icon: selectedIcon,
          color: selectedColor
        });
      }
      
      const updatedCategories = {
        ...currentBook.categories,
        [type]: updatedList
      };
      
      if (!updatedCategories.income) updatedCategories.income = [];
      if (!updatedCategories.expense) updatedCategories.expense = [];

      await updateBudgetBook(bookId, { categories: updatedCategories });
      setNewCategoryName('');
      setIsAddingCategory(false);
      setEditingCategory(null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (cat: string) => {
      if (isManageMode) {
          // In manage mode, tap means rename
          setNewCategoryName(cat);
          setEditingCategory(cat);
          setIsAddingCategory(true);
      } else {
          // Normal mode, tap means select
          // We can't access setFieldValue directly here easily without prop drilling or render prop pattern
          // But we are inside the component so we can just rely on the render prop below to handle the press
          // Wait, this function is outside the formik render. 
          // I will verify this interaction in the render prop section.
      }
  };

  const handleDeleteCategory = async (catToDelete: Category) => {
      if (!currentBook) return;
      Alert.alert(
          'Delete Category',
          `Are you sure you want to delete "${catToDelete.name}"?`,
          [
              { text: 'Cancel', style: 'cancel' },
              {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                      try {
                         setLoading(true);
                         const currentList = currentBook.categories?.[type] || [];
                         const updatedList = currentList.filter(c => c.id !== catToDelete.id);
                         
                         const updatedCategories = {
                            ...currentBook.categories,
                            [type]: updatedList
                         };
                         
                         if (!updatedCategories.income) updatedCategories.income = [];
                         if (!updatedCategories.expense) updatedCategories.expense = [];

                         await updateBudgetBook(bookId, { categories: updatedCategories });
                      } catch (err: any) {
                         Alert.alert('Error', err.message);
                      } finally {
                         setLoading(false);
                      }
                  }
              }
          ]
      );
  };

  if (isAddingCategory) {
     return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{editingCategory ? 'Edit Category' : 'New Category'}</Text>
                
                <View style={styles.previewContainer}>
                   <View style={[styles.categoryCircle, { backgroundColor: selectedColor }]}>
                      <Ionicons name={selectedIcon as any} size={32} color="#fff" />
                   </View>
                   <Text style={[styles.previewLabel, { color: theme.text }]}>{newCategoryName || 'Category Name'}</Text>
                </View>

                <Text style={[styles.label, { color: theme.text }]}>Category Name</Text>
                <TextInput 
                   style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} 
                   value={newCategoryName} 
                   onChangeText={setNewCategoryName} 
                   placeholder={`e.g. Shopping`}
                   placeholderTextColor={theme.textSecondary}
                   editable={!loading}
                />

                <View style={styles.sectionHeader}>
                    <Text style={[styles.label, { marginBottom: 0, color: theme.text }]}>Select Icon</Text>
                    <TouchableOpacity 
                        onPress={() => setShowAllIcons(!showAllIcons)}
                        style={[styles.manageButton, { backgroundColor: isDarkMode ? theme.surface : '#fff', borderColor: theme.border }, showAllIcons && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                        <Text style={[styles.manageButtonText, { color: isDarkMode ? theme.text : theme.primary }, showAllIcons && { color: '#fff' }]}>
                            {showAllIcons ? 'Done' : 'More'}
                        </Text>
                    </TouchableOpacity>
                </View>
                {!showAllIcons ? (
                  <View style={styles.horizontalPicker}>
                    {CATEGORY_ICON_OPTIONS.slice(0, 5).map(icon => (
                       <TouchableOpacity 
                          key={icon} 
                          style={[styles.iconOption, { backgroundColor: isDarkMode ? '#2c2c2c' : (isDarkMode ? theme.surface : '#fff'), borderColor: theme.border }, selectedIcon === icon && { borderColor: theme.primary }]}
                          onPress={() => setSelectedIcon(icon)}
                       >
                          <Ionicons name={icon as any} size={24} color={selectedIcon === icon ? theme.primary : theme.textSecondary} />
                       </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.groupedPicker}>
                    {CATEGORY_ICONS_BY_GROUP.map(group => (
                      <View key={group.name} style={styles.groupContainer}>
                        <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>{group.name}</Text>
                        <View style={styles.groupGrid}>
                          {group.icons.map(icon => (
                            <TouchableOpacity 
                              key={icon} 
                              style={[styles.iconOptionSmall, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }, selectedIcon === icon && { borderColor: theme.primary }]}
                              onPress={() => setSelectedIcon(icon)}
                            >
                              <Ionicons name={icon as any} size={20} color={selectedIcon === icon ? theme.primary : theme.textSecondary} />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={[styles.label, { marginBottom: 0, color: theme.text }]}>Select Color</Text>
                    <TouchableOpacity 
                        onPress={() => setShowAllColors(!showAllColors)}
                        style={[styles.manageButton, { backgroundColor: isDarkMode ? theme.surface : '#fff', borderColor: theme.border }, showAllColors && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                        <Text style={[styles.manageButtonText, { color: isDarkMode ? theme.text : theme.primary }, showAllColors && { color: '#fff' }]}>
                            {showAllColors ? 'Done' : 'More'}
                        </Text>
                    </TouchableOpacity>
                </View>
                {!showAllColors ? (
                  <View style={styles.horizontalPicker}>
                    {CATEGORY_COLOR_OPTIONS.slice(0, 5).map(color => (
                       <TouchableOpacity 
                          key={color} 
                          style={[styles.colorOption, selectedColor === color && { borderColor: theme.primary }]}
                          onPress={() => setSelectedColor(color)}
                       >
                          <View style={[styles.colorCircle, { backgroundColor: color }]}>
                             {selectedColor === color && <Ionicons name="checkmark" size={16} color="#fff" />}
                          </View>
                       </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.groupedPicker}>
                    {CATEGORY_COLORS_BY_GROUP.map(group => (
                      <View key={group.name} style={styles.groupContainer}>
                        <Text style={[styles.groupTitle, { color: theme.textSecondary }]}>{group.name}</Text>
                        <View style={styles.groupGrid}>
                          {group.colors.map(color => (
                            <TouchableOpacity 
                              key={color} 
                              style={[styles.colorOptionSmall, selectedColor === color && { borderColor: theme.primary }]}
                              onPress={() => setSelectedColor(color)}
                            >
                              <View style={[styles.colorCircleSmall, { backgroundColor: color }]}>
                                {selectedColor === color && <Ionicons name="checkmark" size={12} color="#fff" />}
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity 
                   style={[
                     styles.submitButton,
                     { backgroundColor: theme.primary, marginTop: 30 }
                   ]} 
                   onPress={handleAddCategory} 
                   disabled={loading}
                >
                   {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{editingCategory ? 'Update' : 'Save'} Category</Text>}
                </TouchableOpacity>
                <TouchableOpacity 
                   style={[styles.submitButton, { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginTop: 10 }]} 
                   onPress={() => {
                      setIsAddingCategory(false);
                      setEditingCategory(null);
                      setNewCategoryName('');
                      setSelectedIcon(CATEGORY_ICON_OPTIONS[0]);
                      setSelectedColor(CATEGORY_COLOR_OPTIONS[0]);
                   }}
                   disabled={loading}
                >
                   <Text style={[styles.submitButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
     );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
           <Text style={[styles.headerTitle, { color: theme.text }]}>Add Transaction</Text>
        </View>

        <Formik
          initialValues={initialValues}
          validationSchema={entryValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleSubmit, values, errors, touched, setFieldValue }) => (
            <View style={styles.form}>
              
              <View style={[styles.typeSelector, { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' }]}>
                <TouchableOpacity
                  style={[styles.typeButton, values.type === 'expense' && { backgroundColor: isDarkMode ? '#3d3d3d' : '#ffebee' }]}
                  onPress={() => {
                     setFieldValue('type', 'expense');
                     setType('expense');
                     setFieldValue('category', '');
                  }}
                >
                  <Text style={[styles.typeButtonText, values.type === 'expense' && { color: theme.expense }]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, values.type === 'income' && { backgroundColor: isDarkMode ? '#3d3d3d' : '#e8f5e9' }]}
                  onPress={() => {
                     setFieldValue('type', 'income');
                     setType('income');
                     setFieldValue('category', '');
                  }}
                >
                  <Text style={[styles.typeButtonText, values.type === 'income' && { color: theme.income }]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
                <TouchableOpacity 
                   style={[styles.datePickerButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                   onPress={() => setShowDatePicker(true)}
                >
                   <Ionicons name="calendar-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                   <Text style={[styles.datePickerText, { color: theme.text }]}>
                      {values.date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                   </Text>
                </TouchableOpacity>
                 {showDatePicker && (
                    <View style={Platform.OS === 'ios' ? [styles.iosDatePickerContainer, { backgroundColor: isDarkMode ? theme.surface : '#fff', borderColor: theme.border }] : null}>
                       <DateTimePicker
                          value={values.date}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          accentColor={theme.primary}
                          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                             if (Platform.OS !== 'ios') {
                                setShowDatePicker(false);
                             }
                             if (selectedDate) {
                                setFieldValue('date', selectedDate);
                             }
                          }}
                       />
                       {Platform.OS === 'ios' && (
                          <TouchableOpacity 
                            style={styles.iosDoneButton} 
                            onPress={() => setShowDatePicker(false)}
                          >
                             <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 16 }}>Done</Text>
                          </TouchableOpacity>
                       )}
                    </View>
                 )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Amount *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }, touched.amount && errors.amount ? styles.inputError : null]}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  value={values.amount}
                  onChangeText={handleChange('amount')}
                  keyboardType="decimal-pad"
                  editable={!loading}
                />
                {touched.amount && errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
              </View>

              <View style={styles.inputGroup}>
                 <View style={styles.sectionHeader}>
                    <Text style={[styles.label, { marginBottom: 0, color: theme.text }]}>Category *</Text>
                    <TouchableOpacity 
                        onPress={() => setIsManageMode(!isManageMode)}
                        style={[styles.manageButton, { backgroundColor: isDarkMode ? theme.surface : '#fff', borderColor: theme.border }, isManageMode && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    >
                        <Text style={[styles.manageButtonText, { color: isDarkMode ? theme.text : theme.primary }, isManageMode && { color: '#fff' }]}>
                            {isManageMode ? 'Done' : 'Manage'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.categoryContainer}>
                   {(currentBook?.categories?.[values.type] || []).map((cat) => (
                       <TouchableOpacity
                          key={cat.id}
                          style={[
                             styles.categoryItem,
                             !isManageMode && values.category === cat.name && styles.categoryItemActive
                          ]}
                          onPress={() => {
                              if (isManageMode) {
                                  setNewCategoryName(cat.name);
                                  setSelectedIcon(cat.icon);
                                  setSelectedColor(cat.color);
                                  setEditingCategory(cat.name);
                                  setIsAddingCategory(true);
                              } else {
                                  setFieldValue('category', cat.name);
                              }
                          }}
                       >
                          <View style={[styles.categoryCircleSmall, { backgroundColor: cat.color }]}>
                             <Ionicons name={cat.icon as any} size={20} color="#fff" />
                             {isManageMode && (
                                <TouchableOpacity 
                                  style={styles.deleteIconSmall}
                                  onPress={() => handleDeleteCategory(cat)}
                                >
                                    <Ionicons name="close-circle" size={16} color="#fff" />
                                </TouchableOpacity>
                             )}
                          </View>
                          <Text style={[
                             styles.categoryText,
                             { color: theme.textSecondary },
                             values.category === cat.name && { color: theme.primary, fontWeight: 'bold' }
                          ]}>{cat.name}</Text>
                       </TouchableOpacity>
                   ))}
                    <TouchableOpacity
                       style={styles.addCategoryButton}
                       onPress={() => setIsAddingCategory(true)}
                    >
                       <View style={[styles.addIconCircle, { borderColor: isDarkMode ? theme.border : theme.primary, backgroundColor: isDarkMode ? theme.surface : '#fff' }]}>
                          <Text style={[styles.addIconText, { color: isDarkMode ? theme.text : theme.primary }]}>+</Text>
                       </View>
                       <Text style={[styles.addCategoryLabel, { color: isDarkMode ? theme.textSecondary : theme.primary }]}>Add</Text>
                    </TouchableOpacity>
                </View>
                {touched.category && errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Description</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="Note (optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={values.description}
                  onChangeText={handleChange('description')}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                   styles.submitButton, 
                   loading && styles.buttonDisabled,
                   { backgroundColor: values.type === 'income' ? theme.income : theme.expense }
                ]}
                onPress={() => handleSubmit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    Save {values.type === 'income' ? 'Income' : 'Expense'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Formik>
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
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  expenseButtonActive: {
    backgroundColor: '#ffebee',
  },
  incomeButtonActive: {
    backgroundColor: '#e8f5e9',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTypeText: {
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    backgroundColor: '#f9f9f9',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 4,
    fontSize: 12,
  },
  categoryContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'flex-start',
     alignItems: 'flex-start',
  },
  categoryChip: {
     paddingVertical: 8,
     paddingHorizontal: 16,
     borderRadius: 20,
     backgroundColor: '#f0f0f0',
     borderWidth: 1,
     borderColor: '#e0e0e0',
     position: 'relative',
  },
  manageChip: {
      paddingRight: 30, // Make room for delete icon
      borderColor: '#999',
      borderStyle: 'dashed',
  },
  deleteIcon: {
      position: 'absolute',
      right: 4,
      top: 8,
      zIndex: 10,
  },
  manageButton: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#ddd',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 2,
  },
  manageButtonActive: {
      backgroundColor: '#6200ee',
      borderColor: '#6200ee',
  },
  manageButtonText: {
      fontSize: 12,
      fontWeight: '700',
  },
  manageButtonTextActive: {
      color: '#fff',
  },
  expenseChipActive: {
     backgroundColor: '#ffebee',
     borderColor: '#ef5350',
  },
  incomeChipActive: {
     backgroundColor: '#e8f5e9',
     borderColor: '#66bb6a',
  },
  categoryText: {
     fontSize: 12,
     color: '#666',
     marginTop: 4,
     textAlign: 'center',
  },
  categoryTextActive: {
     color: '#6200ee',
     fontWeight: 'bold',
  },
  previewContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  categoryCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  previewLabel: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  iconPicker: {
    marginTop: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorPicker: {
    marginTop: 10,
  },
  colorOption: {
    marginRight: 15,
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#6200ee',
  },
  horizontalPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  groupedPicker: {
    marginTop: 10,
  },
  groupContainer: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 20,
  },
  iosDatePickerContainer: {
    marginTop: 10,
    borderRadius: 15,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iosDoneButton: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  iconOptionSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorOptionSmall: {
    marginRight: 8,
    marginBottom: 8,
    padding: 1,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showLessButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  categoryItem: {
    width: '24%', // exactly 4 per row (almost)
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  categoryItemActive: {
    transform: [{ scale: 1.1 }],
  },
  categoryCircleSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  deleteIconSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#d32f2f',
    borderRadius: 10,
  },
  addCategoryButton: {
    width: '24%',
    alignItems: 'center',
    marginBottom: 16,
  },
  addIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconText: {
    fontSize: 24,
    color: '#999',
  },
  addCategoryLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
  },
  incomeButton: {
     backgroundColor: '#4caf50',
  },
  expenseButton: {
     backgroundColor: '#ef5350',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  addCategoryChip: {
    backgroundColor: '#fff',
    borderStyle: 'dashed',
  },
  addCategoryText: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '600',
  },
});

export default EntryFormScreen;
