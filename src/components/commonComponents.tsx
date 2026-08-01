import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  API_BASE_URL,
  doctor_appointments,
  login,
  userInfo,
  userToken,
} from "@/constants/constants";
import {
  Button,
  Icon,
  IconButton,
  List,
  Text,
  useTheme,
} from "react-native-paper";
import React, { useState } from "react";
import { useThemeContext } from "@/components/ThemeContext";
import { router, useRouter } from "expo-router";
import axios2 from "axios";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { formatDateToString } from "@/functions/commonFunctions";

const handleLogout = async () => {
  try {
    // Clear local authentication tokens and profile info
    await AsyncStorage.removeItem(userToken);
    await AsyncStorage.removeItem(userInfo);

    // Redirect to login screen, resetting the navigation history stack
    // so the user can't press 'Back' to return to protected screens
    router.replace(`/`);
  } catch (error) {
    console.error("Error during logout:", error);
  }
};

function ThemeChangeButton() {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <IconButton
      icon={isDark ? "weather-sunny" : "weather-night"}
      //size={24}
      onPress={toggleTheme}
      accessibilityLabel="Toggle Theme"
    />
  );
}
function LogOutButton() {
  const router = useRouter();

  return (
    <IconButton
      icon={"logout"}
      //size={24}
      onPress={() => handleLogout(router)}
      accessibilityLabel="Log Out"
    />
  );
}

const axios = axios2.create({
  baseURL: API_BASE_URL,
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    //console.log('hello', error)
    const originalRequest = error.config;

    // Check if the error is 401 Unauthorized and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      await handleLogout();
    }

    return Promise.reject(error);
  },
);

function DatePicker(props: {
  placeHolder?: string;
  valueHolder: object;
  path: string;
  onSelect?: (value: Date | undefined | null) => void;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  let [state, setState] = useState({ v: {} });
  const { placeHolder, valueHolder, path, onSelect, style } = props;
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  let selectedDate = valueHolder?.[path];

  return (
    <>
      <List.Item
        onPress={() => setIsDatePickerOpen(true)}
        titleStyle={{textAlign:"center"}}
        style={[
          styles.pickerButton,
          { borderColor: theme.colors.outline },
          style,
        ]}
        title={
          selectedDate
            ? `Date: ${formatDateToString(selectedDate)}`
            : (placeHolder ?? "Select Date (YYYY-MM-DD)")
        }
        left={(p) => <Icon size={24} {...p} source={"calendar"} />}
        right={(p) => (
          <TouchableOpacity
            onPress={() => {
              if (valueHolder) {
                valueHolder[path] = undefined;
              }
              onSelect?.(undefined);
              setState({ ...state });
            }}
          >
            <Icon size={24} {...p} source={"delete"} />
          </TouchableOpacity>
        )}
      />

      <DatePickerModal
        locale="en"
        mode="single"
        visible={isDatePickerOpen}
        onDismiss={() => setIsDatePickerOpen(false)}
        date={selectedDate}
        onConfirm={(params) => {
          setIsDatePickerOpen(false);

          if (valueHolder) {
            valueHolder[path] = params?.date;
          }
          onSelect?.(params?.date);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    borderWidth: 1,
    paddingLeft: 14,
    borderRadius: 5,
  },
});

export { handleLogout, ThemeChangeButton, LogOutButton, axios, DatePicker };
