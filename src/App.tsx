import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './context/AuthContext';
import { BudgetProvider } from './context/BudgetContext';
import { RootNavigator } from './navigation/RootNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { isDarkMode } = useTheme();
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AuthProvider>
        <BudgetProvider>
          <RootNavigator />
        </BudgetProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
