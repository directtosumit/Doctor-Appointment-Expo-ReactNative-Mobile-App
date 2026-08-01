import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  KeyboardAvoidingPlatform,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  HelperText,
  IconButton,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {
  patient,
  doctor,
  userToken,
  userInfo,
  tabs,
  doctor_appointments,
  doctor_search,
  API_BASE_URL,
} from "@/constants/constants";

import { useThemeContext } from "@/components/ThemeContext";
import { ThemeChangeButton } from "@/components/commonComponents";

// Define your backend base URL (update port/host if running on physical device vs emulator)

export default function LoginScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useThemeContext();
  const theme = useTheme(); // 2. Get the current active theme object from Paper

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<patient | doctor>(patient); // Default to patient
  const [secureText, setSecureText] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    setErrorMessage("");

    // Form Validation
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      // Calls your backend login route
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email.trim(),
        password,
        role,
      });

      const { token, user } = response.data;

      // Save token and user details locally
      await AsyncStorage.setItem(userToken, token);
      await AsyncStorage.setItem(userInfo, JSON.stringify(user));

      // Redirect based on role
      if (user.role === doctor) {
        router.replace(`/${tabs}/${doctor_appointments}`); // Adjust path based on your route layout
      } else {
        router.replace(`/${tabs}/${doctor_search}`); // Adjust path based on your route layout
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        "Login failed. Please check your credentials.";
      setErrorMessage(msg);
      console.log(err, "\n", msg);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingToken = async (): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem(userToken);
      if (!token) return; // No token stored, stay on login screen

      setLoading(true);

      // Call your backend verification route (POST request)
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.valid && response.data.user) {
        const { user } = response.data;

        // Update stored user details locally in case they changed
        await AsyncStorage.setItem(userInfo, JSON.stringify(user));

        // Redirect based on role matching your handleLogin routing pattern
        if (user.role === "doctor") {
          router.replace(`/${tabs}/${doctor_appointments}`);
        } else {
          router.replace(`/${tabs}/${doctor_search}`);
        }
      }
    } catch (err: any) {
      // Token is expired, invalid, or network failed; clear invalid storage
      console.log(
        "Session validation failed:",
        err.response?.data?.error || err.message,
      );
      await AsyncStorage.removeItem(userToken);
      await AsyncStorage.removeItem(userInfo);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkExistingToken();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Theme Toggle Button positioned at the top right */}
      <View style={styles.themeToggleContainer}>
        <ThemeChangeButton />
      </View>

      <Surface style={styles.card} elevation={4}>
        <Text variant="headlineMedium" style={styles.title}>
          Appointment System
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sign in to continue
        </Text>

        {/* Role Selector Tabs */}
        <View style={styles.roleContainer}>
          <Button
            mode={role === patient ? "contained" : "outlined"}
            onPress={() => setRole(patient)}
            style={styles.roleButton}
          >
            Patient
          </Button>
          <Button
            mode={role === doctor ? "contained" : "outlined"}
            onPress={() => setRole(doctor)}
            style={styles.roleButton}
          >
            Doctor
          </Button>
        </View>

        {/* Email Input */}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon={"email"} />}
        />

        {/* Password Input */}
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
          mode="outlined"
          style={styles.input}
          right={
            <TextInput.Icon
              icon={secureText ? "eye-off" : "eye"}
              onPress={() => setSecureText(!secureText)}
            />
          }
          left={<TextInput.Icon icon={"lock"} />}
        />

        {/* Error Message Helper */}
        {errorMessage ? (
          <HelperText type="error" visible={Boolean(errorMessage)}>
            {errorMessage}
          </HelperText>
        ) : null}

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.loginButton}
        >
          Login
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  themeToggleContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 12,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.7,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  input: {
    marginBottom: 12,
  },
  loginButton: {
    marginTop: 16,
    paddingVertical: 6,
  },
});
