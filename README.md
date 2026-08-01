
# Doctor Appointments - Mobile Application

A cross-platform mobile application built with React Native, Expo Router, and React Native Paper for managing doctor appointments[cite: 2].

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
   cd doctor-appointments

```

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

