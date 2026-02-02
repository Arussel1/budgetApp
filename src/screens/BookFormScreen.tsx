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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { RootStackParamList, BudgetBook } from '../types';
import { useBudget } from '../context/BudgetContext';
import { useTheme } from '../context/ThemeContext';

type BookFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BookForm'>;
type BookFormScreenRouteProp = RouteProp<RootStackParamList, 'BookForm'>;

interface Props {
  navigation: BookFormScreenNavigationProp;
  route: BookFormScreenRouteProp;
}

const bookValidationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').min(1),
});

const BookFormScreen: React.FC<Props> = ({ navigation, route }) => {
  const { bookId } = route.params || {};
  const { budgetBooks, addBudgetBook, updateBudgetBook } = useBudget();
  const { theme } = useTheme();
  const book = bookId ? budgetBooks.find(b => b.id === bookId) : null;
  const [loading, setLoading] = useState(false);

  const currentDate = new Date();

  const initialValues = book ? {
    name: book.name,
  } : {
    name: `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`,
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      const bookData: any = {
        name: values.name,
      };

      // Only set month/year for new books; preserve for edits if needed by the backend
      // Actually, addBudgetBook expects month/year.
      if (!bookId) {
        bookData.month = currentDate.getMonth() + 1;
        bookData.year = currentDate.getFullYear();
      }

      if (bookId) {
        await updateBudgetBook(bookId, bookData);
        Alert.alert('Success', 'Budget updated successfully');
      } else {
        await addBudgetBook(bookData);
        Alert.alert('Success', 'New budget created successfully');
      }

      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
           <Text style={[styles.headerTitle, { color: theme.text }]}>{bookId ? 'Edit Budget Book' : 'New Budget Book'}</Text>
        </View>

        <Formik
          initialValues={initialValues}
          validationSchema={bookValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ handleChange, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Budget Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }, touched.name && errors.name ? styles.inputError : null]}
                  placeholder="e.g. May 2024"
                  placeholderTextColor={theme.textSecondary}
                  value={values.name}
                  onChangeText={handleChange('name')}
                  editable={!loading}
                />
                {touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>


              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: theme.primary }, loading && styles.buttonDisabled]}
                onPress={() => handleSubmit()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {bookId ? 'Update Budget' : 'Create Budget'}
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
  inputGroup: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
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
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 4,
    fontSize: 12,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default BookFormScreen;
