import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import {
    Text,
    Card,
    Avatar,
    Button,
    ActivityIndicator,
    useTheme,
    Snackbar, IconButton,
} from "react-native-paper";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {axios, LogOutButton, ThemeChangeButton} from "@/components/commonComponents";// Adjust path to your configured axios instance
import { Icon } from "react-native-paper/src";
import {formatDateTimeToIST, formatDateToString} from "@/functions/commonFunctions";
import {my_appointments, tabs} from "@/constants/constants";

interface DoctorDetails {
  id: number;
  name: string;
  email: string;
  specialization: string;
}

interface Slot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export default function DoctorDetailsScreen(): React.JSX.Element {
  const theme = useTheme();
  const params = useLocalSearchParams();
  const doctorId = params.doctorId;

  const [doctor, setDoctor] = useState<DoctorDetails | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);

  // Snackbar states
  const [snackbarVisible, setSnackbarVisible] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");

  const fetchDoctorDetailsAndSlots = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("userToken");

      // Fetch doctor details and unbooked availability slots
      const response = await axios.post(
        `/doctors/view`,
        { id: doctorId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setDoctor(response.data.doctor);
      setSlots(response.data.available_slots || []);
    } catch (err: any) {
      console.error("Failed to fetch doctor details:", err);
      setSnackbarMessage(
        err.response?.data?.error || "Failed to load doctor details.",
      );
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctorId) {
      fetchDoctorDetailsAndSlots();
    }
  }, [doctorId]);

  const handleBookAppointment = async () => {
    if (!selectedSlotId) {
      setSnackbarMessage("Please select an available time slot.");
      setSnackbarVisible(true);
      return;
    }

    const selectedSlot = slots.find((s) => s.id === selectedSlotId);
    if (!selectedSlot) return;

    try {
      setBookingLoading(true);
      const token = await AsyncStorage.getItem("userToken");

      // POST request to book appointment
      await axios.post(
        "/appointments",
        {
          doctor_id: Number(doctorId),
          slot_id: selectedSlot.id,
          appointment_date: formatDateToString(new Date(selectedSlot.date)),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setSnackbarMessage("Appointment booked successfully!");
      setSnackbarVisible(true);

      // Navigate to patient appointments view or go back after short delay
      setTimeout(() => {
        router.navigate(`/${tabs}/${my_appointments}`)
      }, 1000);
    } catch (err: any) {
      console.error("Booking failed:", err);
      setSnackbarMessage(
        err.response?.data?.error || "Failed to book appointment.",
      );
      setSnackbarVisible(true);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
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
      {/* Top Header Back Navigation */}
      <View style={styles.topBar}>
        <Button mode="text" icon="arrow-left" onPress={() => router.back()}>
          Back
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Doctor Profile Header */}
        <Card mode="elevated" style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={64}
              label={
                doctor?.name ? doctor.name.substring(0, 2).toUpperCase() : "DR"
              }
              style={{ backgroundColor: theme.colors.primaryContainer }}
              color={theme.colors.onPrimaryContainer}
            />
            <View style={styles.profileTextContainer}>
              <Text variant="titleLarge" style={styles.doctorName}>
                {doctor?.name}
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.primary, fontWeight: "600" }}
              >
                {doctor?.specialization}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.secondary, marginTop: 4 }}
              >
                <Icon size={15} source={"email"} /> {doctor?.email}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Available Slots Section */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Available Time Slots
        </Text>

        {slots.length === 0 ? (
          <Card mode="outlined" style={styles.emptyCard}>
            <Card.Content>
              <Text
                variant="bodyMedium"
                style={{
                  textAlign: "center",
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                No open availability slots found for this doctor.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            data={slots}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isSelected = selectedSlotId === item.id;
              return (
                <TouchableOpacity onPress={() => setSelectedSlotId(item.id)}>
                  <Card
                    style={[
                      styles.slotCard,
                      isSelected && {
                        backgroundColor: theme.colors.primaryContainer,
                        borderColor: theme.colors.primary,
                        borderWidth: 1.5,
                      },
                    ]}
                    mode="elevated"
                  >
                    <Card.Content style={styles.slotContent}>
                      <View>
                        <Text
                          variant="bodyLarge"
                          style={{
                            fontWeight: "bold",
                            color: isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurface,
                          }}
                        >
                          📅 {formatDateTimeToIST(item.date)}
                        </Text>
                        <Text
                          variant="bodyMedium"
                          style={{
                            color: isSelected
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant,
                            marginTop: 2,
                          }}
                        >
                          ⏰ {item.start_time} - {item.end_time}
                        </Text>
                      </View>
                      {isSelected && (
                        <Avatar.Icon
                          size={32}
                          icon="check"
                          style={{ backgroundColor: theme.colors.primary }}
                          color={theme.colors.onPrimary}
                        />
                      )}
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </ScrollView>

      {/* Action Footer */}
      {slots.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Button
            mode="contained"
            onPress={handleBookAppointment}
            loading={bookingLoading}
            disabled={!selectedSlotId || bookingLoading}
            style={styles.bookButton}
          >
            Book Appointment
          </Button>
        </View>
      )}
        <View style={styles.themeLogOutContainer}>
            <IconButton
                icon={"refresh"}
                //size={24}
                onPress={() => {
                    fetchDoctorDetailsAndSlots()
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
  },
  topBar: {
    paddingHorizontal: 8,
    paddingTop: 8,
    alignItems: "flex-start",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  profileTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  doctorName: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  emptyCard: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  slotCard: {
    marginBottom: 10,
    borderRadius: 10,
  },
  slotContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  footer: {

    padding: 16,
    borderTopWidth: 1,
   // elevation: 8,
  },
  bookButton: {
    borderRadius: 8,
  },
});
