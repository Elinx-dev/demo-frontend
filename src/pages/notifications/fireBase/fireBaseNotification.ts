import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAMFoP_mwf371rf9ybe-kznFHbM5Or5Mu8",
  authDomain: "ipclimb-f22e6.firebaseapp.com",
  projectId: "ipclimb-f22e6",
  storageBucket: "ipclimb-f22e6.firebasestorage.app",
  messagingSenderId: "1052565348746",
  appId: "1:1052565348746:web:7db75941341cf1b1456873",
  measurementId: "G-7KBFSTD1VM",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const generateToken = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey:
        "BHZUsAXVn5u4RJCICDNYagThOwvrp17zExXHYzMW5JbbNrF3Zy2-KLlhNaricV8nij83Oby-V061hbA02c7X3Mg",
    });

    console.log("FCM Token firebase:", token);
    return token;
  } catch (err) {
    console.error("Error getting token:", err);
    return null;
  }
};

export const registerForegroundListener = () => {
  return onMessage(messaging, (payload :  any) => {
    console.log("Foreground Message:", payload);
    alert("FCM Message Received!");

    if (Notification.permission === "granted") {
      new Notification(
        payload.notification?.title ?? "Notification",
        {
          body: payload.notification?.body ?? "",
          icon: payload.notification?.image ?? "/favicon.ico",
        }
      );
    }
  });
};