
# Doctor Appointments - Mobile Application

A cross-platform mobile application built with React Native, Expo Router, and React Native Paper for managing doctor appointments.


## Key Features of the Mobile Application

* **Cross-Platform Interface**: Built with React Native and Expo Router, supporting both light and dark themes seamlessly.
* **Secure JWT Session Management**: After login, the JWT token is saved in memory and attached automatically to all subsequent API calls. If a request fails due to an expired or invalid token, the user is safely redirected back to the login screen.
* **Persistent Session & Auto-Verification**: Upon application startup, if an existing token is found in memory, it is verified against the backend to automatically log the user in and route them straight to their respective home pages.
* **Doctor Module**:
    * Add, edit, and delete availability slots.
    * View all appointments booked for them.
    * View detailed appointment information including patient name, appointment date & time, and status.
    * Includes pagination for patient appointments to handle growing lists efficiently.
* **Patient Module**:
    * Search doctors using name, specialization, or available date.
    * View detailed doctor profiles and available slots.
    * Book available appointments.
    * View personal booked appointments history.
    * Includes pagination for doctor searches to handle large datasets seamlessly.

---

## Valid Requirements Checklist
* ✅ **Project setup steps** (Included below)
* ✅ **Login credentials for doctor and patient** (Included below)

*(Note: Environment variables are not required as the API base URL is dynamically determined in code. Database setup and seed execution belong to the backend server repository).*

---

## Prerequisites

Make sure you have the following installed:
* **Node.js** (v18 or higher recommended)
* **Expo CLI** / **npm** or **yarn**
* An Android Emulator, iOS Simulator, or the **Expo Go** app on your physical device.

---

## Project Setup Steps

1. **Clone the repository and navigate to the mobile app directory:**
   ```bash
   cd Doctor-Appointment-Expo-ReactNative-Mobile-App



2. **Install project dependencies:**
```bash
npm install

```



---

## API Configuration Note

The app automatically configures the backend connection URL based on your environment (`10.0.2.2` for Android Emulators or `localhost` for physical devices/web). Ensure your backend server is running and accessible on port `5000`.

---

## Login Credentials for Doctor and Patient

You can use the following default test credentials to log into the mobile app:

### Doctor Account

* **Email:** `doctor1@example.com`
* **Password:** `password123`
* **Role:** `doctor`

### Patient Account

* **Email:** `patient1@example.com`
* **Password:** `password123`
* **Role:** `patient`

---

## Running the Application

* **Start the Expo development server:**
```bash
npm start

```


* **Run on Android Emulator:**
```bash
npm run android

```


* **Run on iOS Simulator:**
```bash
npm run ios

```

