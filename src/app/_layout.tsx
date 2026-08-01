import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {Appearance, useColorScheme, View} from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

import {
  CombinedDarkTheme,
  CombinedDefaultTheme,
  ThemeContext,
} from "@/components/ThemeContext";
import {Icon, PaperProvider, Surface} from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Tabs, useRouter } from "expo-router";
import { login, tabs, THEME_STORAGE_KEY } from "@/constants/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  removeUserSession,
  storeUserSession,
} from "../../../../../OfficeWorkFiles/pCloud/Rideze/RN_Rideze_Web_EXPO/Rideze/commonFunctions/localStorage";
import {StatusBar} from "expo-status-bar";

//SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");

  // Optional: Load saved user theme preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((savedTheme) => {
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      }
    });
  }, []);

  // Toggle function that updates state and saves to storage
  const toggleTheme = async () => {
    const newThemeState = !isDark;
    setIsDark(newThemeState);
    try {
      const theme: "dark" | "light" = newThemeState ? "dark" : "light";

      if (Appearance.getColorScheme() === theme) {
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      }
    } catch (e) {
      console.error("Failed to save theme preference", e);
    }
  };

  const theme = isDark ? CombinedDarkTheme : CombinedDefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={!isDark ? "dark" : "light"}/>
      <ThemeContext.Provider
        value={{
          isDark,
          theme,
          toggleTheme,
        }}
      >
        <PaperProvider theme={theme}>

          <View style={ { width:'100%', height:'100%', backgroundColor: theme.colors.background }}>
          <SafeAreaView style={{width:'100%', height:'100%' }}>
            <Stack
              initialRouteName={login}
              screenOptions={{ headerShown: false }}
            >
              <Stack.Screen name={login} options={{ title: "Log In" }} />
              <Stack.Screen name={tabs} />
            </Stack>
          </SafeAreaView>
          </View>
        </PaperProvider>
      </ThemeContext.Provider>
    </GestureHandlerRootView>
  );
}
