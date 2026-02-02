import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  income: string;
  expense: string;
  card: string;
}

const lightTheme: ThemeColors = {
  primary: '#05377f',
  secondary: '#3886f7',
  accent: '#8ca4fc',
  neutral: '#827272',
  background: '#f7f3ed',
  surface: '#ffffff',
  text: '#05377f',
  textSecondary: '#827272',
  border: '#8ca4fc',
  income: '#4caf50',
  expense: '#d32f2f',
  card: '#ffffff',
};

const darkTheme: ThemeColors = {
  primary: '#3886f7',
  secondary: '#8ca4fc',
  accent: '#d8c4ad',
  neutral: '#827272',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#f5f5f5',
  textSecondary: '#aaaaaa',
  border: '#333333',
  income: '#66bb6a',
  expense: '#ef5350',
  card: '#1e1e1e',
};

interface ThemeContextType {
  isDarkMode: boolean;
  theme: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('user-theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('user-theme', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
