import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ScrollView,
  Alert,
} from "react-native";
import {
  Text,
  Card,
  Avatar,
  ActivityIndicator,
  useTheme,
  Chip,
  Button,
  SegmentedButtons,
  IconButton,
  Snackbar,
} from "react-native-paper";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, userInfo, userToken } from "@/constants/constants";
import {
  handleLogout,
  LogOutButton,
  ThemeChangeButton,
  axios,
  DatePicker,
} from "@/components/commonComponents";
import {
  formatDateTimeToIST,
  formatDateToString,
  formatTimeToString,
  parseTimeString,
  enlargeArray,
} from "@/functions/commonFunctions";
import { Icon } from "react-native-paper/src";

interface Appointment {
  id: number;
  patient_name: string;
  appointment_date?: string;
  date?: string;
  start_time: string;
  end_time: string;
  status: "Booked" | "Completed" | "Cancelled" | string;
}

interface AvailabilitySlot {
  id: number;
  doctor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: number | boolean;
}

export default function DoctorAppointmentsScreen(): React.JSX.Element {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<string>("appointments");

  // Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Availability Slots State
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [showAddOption, setShowAddOption] = useState<boolean>(true);

  // Availability Form State
  const [state, setState] = useState({ v: { selectedDate: undefined } });

  const [startTime, setStartTime] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);
  const [endTime, setEndTime] = useState<{
    hours: number;
    minutes: number;
  } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Modal Visibility States

  const [isStartTimePickerOpen, setIsStartTimePickerOpen] =
    useState<boolean>(false);
  const [isEndTimePickerOpen, setIsEndTimePickerOpen] =
    useState<boolean>(false);

  // Snackbar states
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  const fetchDoctorAppointments = async (
    targetPage: number = 1,
    isRefresh: boolean = false,
  ): Promise<void> => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = await AsyncStorage.getItem(userToken);
      let doctorInfo = await AsyncStorage.getItem(userInfo); // Optional if token parses it server-side
      if (doctorInfo) {
        doctorInfo = JSON.parse(doctorInfo);
      }
      const response = await axios.post(
        "/doctor/appointments/view",
        { ...doctorInfo, page: targetPage, limit: 15 },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAppointments(response.data.data);
      if (response.data.totalPages) {
        setTotalPages(response.data.totalPages);
      }
      setPage(targetPage);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDoctorSlots = async (): Promise<void> => {
    try {
      setSlotsLoading(true);
      const token = await AsyncStorage.getItem(userToken);
      // Using user id or token endpoint logic to view slots
      let doctorInfo = await AsyncStorage.getItem(userInfo); // Optional if token parses it server-side
      if (doctorInfo) {
        doctorInfo = JSON.parse(doctorInfo);
      }

      const response = await axios.post(`/doctors/view`, doctorInfo, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSlots(response.data.available_slots || []);
    } catch (error) {
      const msg = error?.response?.data?.error;
      console.log(error, "\n", msg);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorAppointments(1);
    fetchDoctorSlots();
  }, []);

  const onRefresh = useCallback(() => {
    fetchDoctorAppointments(1, true);
    fetchDoctorSlots();
  }, []);

  const handleAddSlot = async (): Promise<void> => {
    let selectedDate = state.v.selectedDate;
    if (!selectedDate || !startTime || !endTime) {
      setSnackbarMessage("Please select a date, start time, and end time.");
      setSnackbarVisible(true);
      return;
    }

    const formattedDate = formatDateToString(selectedDate);
    const formattedStartTime = formatTimeToString(startTime);
    const formattedEndTime = formatTimeToString(endTime);

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem(userToken);
      await axios.post(
        `/doctor/availability/add`,
        {
          date: formattedDate,
          start_time: formattedStartTime,
          end_time: formattedEndTime,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSnackbarMessage("Availability slot added successfully!");
      setSnackbarVisible(true);
      state.v.selectedDate = undefined;
      setStartTime(null);
      setEndTime(null);
      fetchDoctorSlots(); // Refresh slots view
    } catch (error: any) {
      console.error("Failed to add slot:", error);
      setSnackbarMessage(error.response?.data?.error || "Failed to add slot.");
      setSnackbarVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSlot = async (slotId: number): Promise<void> => {
    try {
      const token = await AsyncStorage.getItem(userToken);
      await axios.post(
        `/doctor/availability/remove`,
        { slotId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSnackbarMessage("Slot removed successfully.");
      setSnackbarVisible(true);
      fetchDoctorSlots(); // Refresh slots view
    } catch (error: any) {
      console.error("Failed to remove slot:", error);
      setSnackbarMessage(
        error.response?.data?.error || "Failed to remove slot.",
      );
      setSnackbarVisible(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Booked":
        return { bg: "#e3f2fd", text: "#1565c0" };
      case "Completed":
        return { bg: "#e8f5e9", text: "#2e7d32" };
      case "Cancelled":
        return { bg: "#ffebee", text: "#c62828" };
      default:
        return { bg: "#f5f5f5", text: "#616161" };
    }
  };

  if (loading && activeTab === "appointments") {
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

  const isAvailability = activeTab === "availability";
  const isAppointments = activeTab === "appointments";

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text variant="headlineMedium" style={styles.headerTitle}>
        Doctor Portal
      </Text>

      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: "appointments", label: "Patient Appointments" },
          { value: "availability", label: "Manage Availability" },
        ]}
        style={styles.segmentedButtons}
      />

      {/* Tab Section 1: Manage Availability (Add & View/Remove Slots) */}
      {isAvailability && (
        <ScrollView
          contentContainerStyle={styles.formContainer}
          refreshControl={
            <RefreshControl
              refreshing={slotsLoading}
              onRefresh={fetchDoctorSlots}
            />
          }
        >
          {showAddOption && (
            <Card mode="elevated" style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.formCardTitle}>
                  Add New Availability Slot
                </Text>

                <DatePicker
                  style={[styles.pickerButton, { borderRadius: 18 }]}
                  valueHolder={state.v}
                  path={"selectedDate"}
                />

                <Button
                  mode="outlined"
                  onPress={() => setIsStartTimePickerOpen(true)}
                  style={styles.pickerButton}
                  icon="clock-outline"
                >
                  {startTime
                    ? `Start Time: ${formatTimeToString(startTime)}`
                    : "Select Start Time"}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setIsEndTimePickerOpen(true)}
                  style={styles.pickerButton}
                  icon="clock-outline"
                >
                  {endTime
                    ? `End Time: ${formatTimeToString(endTime)}`
                    : "Select End Time"}
                </Button>

                <Button
                  mode="contained"
                  onPress={handleAddSlot}
                  loading={submitting}
                  disabled={submitting}
                  style={styles.submitButton}
                >
                  Add Slot
                </Button>
              </Card.Content>
            </Card>
          )}

          <Text variant="titleMedium" style={styles.subHeaderTitle}>
            Your Current Available Slots
          </Text>
          {slots.length === 0 ? (
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
                marginVertical: 12,
              }}
            >
              No available slots created yet.
            </Text>
          ) : (
            slots.map((slot) => (
              <Card key={slot.id} mode="outlined" style={styles.slotCard}>
                <Card.Content style={styles.slotCardContent}>
                  <View>
                    <Text variant="bodyLarge" style={{ fontWeight: "bold" }}>
                      📅 {formatDateTimeToIST(slot.date, true)}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.secondary }}
                    >
                      ⏰ {slot.start_time} - {slot.end_time}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <IconButton
                      icon="calendar-edit"
                      iconColor={theme.colors.error}
                      size={24}
                      onPress={() => {
                        state.v.selectedDate = new Date(slot.date);
                        setStartTime(parseTimeString(slot.start_time));
                        setEndTime(parseTimeString(slot.end_time));
                        setShowAddOption(true);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      iconColor={theme.colors.error}
                      size={24}
                      onPress={() => handleRemoveSlot(slot.id)}
                    />
                  </View>
                </Card.Content>
              </Card>
            ))
          )}

          <TimePickerModal
            visible={isStartTimePickerOpen}
            onDismiss={() => setIsStartTimePickerOpen(false)}
            onConfirm={(output) => {
              setIsStartTimePickerOpen(false);
              setStartTime({ hours: output.hours, minutes: output.minutes });
            }}
            hours={startTime?.hours || 10}
            minutes={startTime?.minutes || 0}
          />

          <TimePickerModal
            visible={isEndTimePickerOpen}
            onDismiss={() => setIsEndTimePickerOpen(false)}
            onConfirm={(output) => {
              setIsEndTimePickerOpen(false);
              setEndTime({ hours: output.hours, minutes: output.minutes });
            }}
            hours={endTime?.hours || 11}
            minutes={endTime?.minutes || 0}
          />
        </ScrollView>
      )}

      {/* Tab Section 2: Patient Appointments List */}
      {isAppointments && (
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                No appointments found.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusStyle = getStatusColor(item.status);
            return (
              <Card style={styles.card} mode="elevated">
                <Card.Content style={styles.cardContent}>
                  <View style={styles.row}>
                    <Avatar.Text
                      size={48}
                      label={
                        item.patient_name
                          ? item.patient_name.substring(0, 2).toUpperCase()
                          : "PT"
                      }
                      style={{
                        backgroundColor: theme.colors.primaryContainer,
                      }}
                      color={theme.colors.onPrimaryContainer}
                    />
                    <View style={styles.infoContainer}>
                      <Text variant="titleMedium" style={styles.patientName}>
                        {item.patient_name || "Patient"}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.secondary }}
                      >
                        📅 Date: {formatDateTimeToIST(item.date)}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.secondary }}
                      >
                        ⏰ Time: {item.start_time} - {item.end_time}
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.secondary, marginTop: 2 }}
                      >
                        <Icon size={15} source={"email"} /> {item.email}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.footerRow}>
                    <Chip
                      style={[styles.chip]}
                      textStyle={{
                        color: statusStyle.text,
                        fontWeight: "bold",
                      }}
                    >
                      {item.status}
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            );
          }}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationContainer}>
                <Button
                  mode="outlined"
                  disabled={page <= 1}
                  onPress={() => fetchDoctorAppointments(page - 1)}
                >
                  Previous
                </Button>
                <Text variant="bodyMedium" style={{ alignSelf: "center" }}>
                  Page {page} of {totalPages}
                </Text>
                <Button
                  mode="outlined"
                  disabled={page >= totalPages}
                  onPress={() => fetchDoctorAppointments(page + 1)}
                >
                  Next
                </Button>
              </View>
            ) : null
          }
        />
      )}
      <View style={styles.themeLogOutContainer}>
        {isAvailability && (
          <IconButton
            icon={"plus"}
            mode={showAddOption ? "contained-tonal" : undefined}
            //size={24}
            onPress={() => {
              setShowAddOption(!showAddOption);
            }}
            accessibilityLabel="plus"
          />
        )}
        <IconButton
          icon={"refresh"}
          //size={24}
          onPress={() => {
            if (isAvailability) {
              fetchDoctorSlots();
            } else if (isAppointments) {
              fetchDoctorAppointments(1, true);
            }
          }}
          accessibilityLabel="Refresh"
        />
        <ThemeChangeButton />
        <LogOutButton />
      </View>
      {/* Snackbar for error / success feedback */}
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },
  subHeaderTitle: {
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  formContainer: {
    paddingVertical: 8,
  },
  formCardTitle: {
    fontWeight: "bold",
    marginBottom: 16,
  },
  pickerButton: {
    marginBottom: 12,
    justifyContent: "flex-start",
    paddingVertical: 4,
  },
  submitButton: {
    marginTop: 12,
    paddingVertical: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  slotCard: {
    marginBottom: 8,
    borderRadius: 8,
  },
  slotCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  cardContent: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  patientName: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
  },
  chip: {
    height: 32,
    borderRadius: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 8,
  },
});
