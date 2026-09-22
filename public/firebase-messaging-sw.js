importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAMFoP_mwf371rf9ybe-kznFHbM5Or5Mu8",
  authDomain: "ipclimb-f22e6.firebaseapp.com",
  projectId: "ipclimb-f22e6",
  storageBucket: "ipclimb-f22e6.firebasestorage.app",
  messagingSenderId: "1052565348746",
  appId: "1:1052565348746:web:7db75941341cf1b1456873",
  measurementId: "G-7KBFSTD1VM",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

  console.log("Background Message:", payload);

  self.registration.showNotification(
    payload.notification?.title || payload.data?.title || "Notification",
    {
      body: payload.notification?.body || payload.data?.body || "",
      icon: payload.notification?.image || "/favicon.ico",
    }
  );
});