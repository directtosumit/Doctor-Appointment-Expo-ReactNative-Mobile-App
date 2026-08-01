import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, FlatList, RefreshControl } from "react-native";
import {
  Text,
  Card,
  Avatar,
  ActivityIndicator,
  useTheme,
  Button,
  Snackbar,
  IconButton,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  axios,
  LogOutButton,
  ThemeChangeButton,
} from "@/components/commonComponents";
import { doctor_search, tabs } from "@/constants/constants";
import {Icon} from "react-native-paper/src"; // Adjust path to your configured axios instance
import { useFocusEffect } from "expo-router/react-navigation";

interface Appointment {
  id: number;
  doctor_name: string;
  specialization: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "Booked" | "Completed" | "Cancelled";
}

export default function MyAppointmentsScreen(): React.JSX.Element {
  const theme = useTheme();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Snackbar states
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  // Format date helper function (e.g. "31 July 2026")
  const formatDateToReadable = (utcDateString: string): string => {
    try {
      const dateObj = new Date(utcDateString);
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(dateObj);
    } catch {
      return utcDateString;
    }
  };

  const fetchPatientAppointments = async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const token = await AsyncStorage.getItem("userToken");

      // POST or GET request depending on your backend route structure for patient appointments
      const response = await axios.post(
        "/patient/appointments/view",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setAppointments( response.data || []);
    } catch (err: any) {
      console.error("Failed to fetch patient appointments:", err);
      setSnackbarMessage(
        err.response?.data?.error || "Failed to load appointments.",
      );
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
      useCallback(() => {
        fetchPatientAppointments();
      }, [])
  );

  const onRefresh = useCallback(() => {
    fetchPatientAppointments(true);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return {
          bg: theme.colors.surfaceVariant,
          text: theme.colors.onSurfaceVariant,
        };
      case "cancelled":
        return {
          bg: theme.colors.errorContainer,
          text: theme.colors.onErrorContainer,
        };
      case "booked":
      default:
        return {
          bg: theme.colors.primaryContainer,
          text: theme.colors.onPrimaryContainer,
        };
    }
  };

  if (loading && !refreshing) {
    return (
      <View
        style={[
          styles.loaderContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator
          animating={true}
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="headlineMedium" style={styles.headerTitle}>
        My Scheduled Appointments
      </Text>

      <FlatList<Appointment>
        data={appointments}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Avatar.Icon
              size={64}
              icon="calendar-blank"
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            />
            <Text
              variant="titleMedium"
              style={[
                styles.emptyText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              No appointments booked yet.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.navigate(`/${tabs}/${doctor_search}`)}
              style={styles.searchButton}
            >
              Find Doctors
            </Button>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = getStatusColor(item.status);
          return (
            <Card style={styles.card} mode="elevated">
              <Card.Content style={styles.cardContent}>
                <View style={styles.rowBetween}>
                  <View style={styles.infoContainer}>
                    <Text variant="titleMedium" style={styles.doctorName}>
                      {item.doctor_name}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.primary, fontWeight: "600" }}
                    >
                      {item.specialization}
                    </Text>
                      <Text
                          variant="bodySmall"
                          style={{ color: theme.colors.secondary, marginTop: 2 }}
                      >
                          <Icon size={15} source={"email"} /> {item.email}
                      </Text>
                  </View>
                  <View
                    style={[styles.badge, { backgroundColor: statusStyle.bg }]}
                  >
                    <Text
                      variant="labelSmall"
                      style={{ color: statusStyle.text, fontWeight: "bold" }}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.outlineVariant },
                  ]}
                />

                <View style={styles.slotDetailsContainer}>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurface }}
                  >
                    📅 {formatDateToReadable(item.date)}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 4,
                    }}
                  >
                    ⏰ {item.start_time} - {item.end_time}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          );
        }}
      />
      <View style={styles.themeLogOutContainer}>
        <IconButton
          icon={"refresh"}
          //size={24}
          onPress={() => {
            fetchPatientAppointments(true);
          }}
          accessibilityLabel="Refresh"
        />
        <ThemeChangeButton />
        <LogOutButton />
      </View>
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: "Dismiss",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  themeLogOutContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    alignContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  listContainer: {
    paddingBottom: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 16,
    textAlign: "center",
  },
  searchButton: {
    marginTop: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    paddingVertical: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  doctorName: {
    fontWeight: "bold",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  slotDetailsContainer: {
    marginTop: 2,
  },
});
