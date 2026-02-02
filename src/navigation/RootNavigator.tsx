import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import BudgetDetailScreen from '../screens/BudgetDetailScreen';
import BookFormScreen from '@/screens/BookFormScreen';
import EntryFormScreen from '../screens/EntryFormScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoadingSpinner from '../components/LoadingSpinner';


const Stack = createNativeStackNavigator<RootStackParamList>();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => {
          const { user } = useAuth();
          const initial = user?.displayName?.[0].toUpperCase() || user?.email?.[0].toUpperCase() || 'U';
          
          return {
            title: 'Budgets',
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={styles.avatarButton}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              </TouchableOpacity>
            ),
          };
        }}
      />
      <Stack.Screen
        name="BookDetail"
        component={BudgetDetailScreen}
        options={{ title: 'Budget Details', headerBackVisible: false, headerShown: false }}
      />
      <Stack.Screen
        name="BookForm"
        component={BookFormScreen}
        options={({ route }) => ({
          title: route.params?.bookId ? 'Edit Budget' : 'New Budget',
          headerBackTitle: 'Cancel'
        })}
      />
      <Stack.Screen
        name="EntryForm"
        component={EntryFormScreen}
        options={{ title: 'Add Entry', headerBackTitle: 'Cancel' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

export const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  avatarButton: {
    marginRight: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
