import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";

import {
  CombinedDarkTheme,
  CombinedDefaultTheme,
  ThemeContext,
} from "@/components/ThemeContext";
import { Icon, PaperProvider, Surface, useTheme } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Tabs, useRouter } from "expo-router";
import {
  API_BASE_URL,
  doctor,
  doctor_appointments,
  doctor_details,
  doctor_search,
  login,
  my_appointments,
  patient,
  THEME_STORAGE_KEY,
  userInfo,
} from "@/constants/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import axios from "axios";
import { handleLogout } from "@/components/commonComponents";

//SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const theme = useTheme();
  const router = useRouter();
  // Setup an axios instance or use your global axios configuration

  const [userPInfo, setUserPInfo] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem(userInfo).then((userPInfo) => {
      if (userPInfo) {
        userPInfo = JSON.parse(userPInfo);
        setUserPInfo(userPInfo);
      }
    });
  }, []);

  const isDoctor = userPInfo?.role === doctor;
  const isPatient = userPInfo?.role === patient;

  return (
    <View
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: theme.colors.background,
      }}
    >
      <Tabs
        backBehavior="history"
        screenOptions={{
          freezeOnBlur: false,
          headerShown: false,
          tabBarHideOnKeyboard: true,
            tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.secondary,
          tabBarStyle: [
            {
              backgroundColor: theme.colors.elevation.level1,
              maxHeight: 40,
            },
          ],
        }}
      >
        <Tabs.Screen
          name={doctor_appointments}
          key={doctor_appointments}
          // options={{ title: usersTitle }}
          options={{
             ...(!isDoctor ? { href: null } : undefined),
            title: "",
            tabBarIcon: (props) => {
              // if (isAndroid) size = size * 1.2;
              return (
                <Icon
                  source={"home"}
                  {...props}
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name={doctor_search}
          key={doctor_search}
          // options={{ title: usersTitle }}
          options={{
            ...(!isPatient ? { href: null } : undefined),
            title: "",
            tabBarIcon: (props) => {
              // if (isAndroid) size = size * 1.2;
              return (
                <Icon
                  source={"account-search"}

                  {...props}
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name={doctor_details}
          key={doctor_details}
          // options={{ title: usersTitle }}
          options={{
            href: null,
            title: "",
          }}
        />
        <Tabs.Screen
          name={my_appointments}
          key={my_appointments}
          // options={{ title: usersTitle }}
          options={{
            ...(!isPatient ? { href: null } : undefined),
            title: "",
            tabBarIcon: (props) => {
              // if (isAndroid) size = size * 1.2;
              return (
                <Icon
                  source={"calendar-check"}

                  {...props}
                />
              );
            },
          }}
        />
      </Tabs>
    </View>
  );
}
