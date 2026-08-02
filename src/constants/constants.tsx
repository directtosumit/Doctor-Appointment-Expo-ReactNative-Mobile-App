import * as Device from 'expo-device';

const login = "index";
const THEME_STORAGE_KEY = "@user_theme_preference";
const patient = "patient";
const doctor = "doctor";
const userToken = "userToken";
const userInfo = "userInfo";
const tabs = "(tabs)";
const doctor_appointments = "doctor_appointments";
const doctor_search = "doctor_search";
const doctor_details = "doctor_details";
const my_appointments = "my_appointments";
const API_BASE_URL = `http://${Device.isDevice ? `localhost` : `10.0.2.2`}:3306/api`;

export {
  login,
  THEME_STORAGE_KEY,
  patient,
  doctor,
  userToken,
  userInfo,
  tabs,
  doctor_appointments,
  doctor_search,
  doctor_details,
  API_BASE_URL,
  my_appointments,
};
