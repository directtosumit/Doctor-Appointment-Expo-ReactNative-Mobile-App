import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ScrollView,
} from "react-native";
import {
  Text,
  Card,
  Avatar,
  ActivityIndicator,
  useTheme,
  TextInput,
  Button,
  IconButton,
} from "react-native-paper";
import { DatePickerModal } from "react-native-paper-dates";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  axios, DatePicker,
  LogOutButton,
  ThemeChangeButton,
} from "@/components/commonComponents";
import { Icon } from "react-native-paper/src";
import { doctor_details } from "@/constants/constants";

interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
}

export default function DoctorSearchScreen(): React.JSX.Element {
  const theme = useTheme();

  // Search filter states
  const [nameQuery, setNameQuery] = useState<string>("");
  const [specializationQuery, setSpecializationQuery] = useState<string>("");
  const [state, setState] = useState({ v: {selectedDate:undefined} });

  // Results & Pagination states
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchVisible, setSearchVisible] = useState<boolean>(true);

  // Format Date utility (YYYY-MM-DD)
  const formatDateToString = (date: Date | undefined): string => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchDoctors = async (
    targetPage: number = 1,
    isRefresh: boolean = false,
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const selectedDate=state.v.selectedDate;
      const token = await AsyncStorage.getItem("userToken");
      const formattedDate = formatDateToString(selectedDate);

      // Adjust endpoint according to your backend search/pagination route structure
      const response = await axios.post(
        "/doctors/search",
        {
          name: nameQuery.trim(),
          specialization: specializationQuery.trim(),
          date: formattedDate,
          page: targetPage,
          limit: 15,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      // Assuming response returns { doctors: [...], totalPages: X } or similar array structure
      setDoctors(response.data.doctors);
      if (response.data.totalPages) {
        setTotalPages(response.data.totalPages);
      }
      setPage(targetPage);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors(1);
  }, []);

  const onRefresh = useCallback(() => {
    fetchDoctors(1, true);
  }, [nameQuery, specializationQuery]);

  const handleSearchTrigger = () => {
    fetchDoctors(1);
  };

  const handleCardPress = (doctorId: number) => {
    // Navigate to Doctor Details screen, passing the doctor_id
    router.navigate(`/${doctor_details}?doctorId=${doctorId}`);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.headerContainer}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Find Doctors
        </Text>

      </View>
      {/* Filter Bar Container */}
      {searchVisible && (
        <Card mode="elevated" style={styles.filterCard}>
          <Card.Content>
            <TextInput
                left={<TextInput.Icon icon={'account'}/> }
              label="Doctor Name"
              value={nameQuery}
              onChangeText={setNameQuery}
              mode="outlined"
              style={styles.input}
              //dense
            />

            <TextInput
                left={<TextInput.Icon icon={'assistant'}/> }
              label="Specialization"
              value={specializationQuery}
              onChangeText={setSpecializationQuery}
              mode="outlined"
              style={styles.input}
              //dense
            />

            <DatePicker valueHolder={state.v} path={'selectedDate'} placeHolder={"Filter by Available Date"} style={[styles.input, {marginTop:5}]}/>

            <Button
              mode="contained"
              onPress={handleSearchTrigger}
              style={styles.searchButton}
              icon="magnify"
            >
              Search Doctors
            </Button>
          </Card.Content>
        </Card>
      )}


      {/* Results List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            animating={true}
            size="large"
            color={theme.colors.primary}
          />
        </View>
      ) : (
        <FlatList<Doctor>
          data={doctors}
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
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                No doctors found matching criteria.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              mode="elevated"
              onPress={() => handleCardPress(item.id)}
            >
              <Card.Content style={styles.cardContent}>
                <View style={styles.row}>
                  <Avatar.Text
                    size={48}
                    label={
                      item.name ? item.name.substring(0, 2).toUpperCase() : "DR"
                    }
                    style={{ backgroundColor: theme.colors.primaryContainer }}
                    color={theme.colors.onPrimaryContainer}
                  />
                  <View style={styles.infoContainer}>
                    <Text variant="titleMedium" style={styles.doctorName}>
                      {item.name}
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
                </View>
              </Card.Content>
            </Card>
          )}
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.paginationContainer}>
                <Button
                  mode="outlined"
                  disabled={page <= 1}
                  onPress={() => fetchDoctors(page - 1)}
                >
                  Previous
                </Button>
                <Text variant="bodyMedium" style={{ alignSelf: "center" }}>
                  Page {page} of {totalPages}
                </Text>
                <Button
                  mode="outlined"
                  disabled={page >= totalPages}
                  onPress={() => fetchDoctors(page + 1)}
                >
                  Next
                </Button>
              </View>
            ) : null
          }
        />
      )}
      <View style={styles.themeLogOutContainer}>
        <IconButton
            {...(searchVisible ? { mode: "contained-tonal" } : undefined)}
            icon={"magnify"}
            onPress={() => {
              setSearchVisible(!searchVisible);
            }}
        />
        <IconButton
          icon={"refresh"}
          //size={24}
          onPress={() => {
            fetchDoctors(1, true);
          }}
          accessibilityLabel="Refresh"
        />
        <ThemeChangeButton />
        <LogOutButton />
      </View>
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
  },
  filterCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  input: {
    marginBottom: 10,
  },
  pickerButton: {
    marginBottom: 8,
    justifyContent: "flex-start",
  },
  searchButton: {
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
    padding: 32,
    alignItems: "center",
  },
  card: {
    marginBottom: 10,
    borderRadius: 10,
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
  doctorName: {
    fontWeight: "bold",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    paddingHorizontal: 8,
  },
});
