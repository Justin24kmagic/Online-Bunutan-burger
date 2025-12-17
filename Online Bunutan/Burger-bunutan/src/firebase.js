import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkUwJMzG-g0BXttz0_fJwxIoysQFIQHbI",
  authDomain: "online-bunutan-7e1b9.firebaseapp.com",
  databaseURL: "https://online-bunutan-7e1b9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "online-bunutan-7e1b9",
  storageBucket: "online-bunutan-7e1b9.firebasestorage.app",
  messagingSenderId: "125576799664",
  appId: "1:125576799664:web:b3caa66da8062928286275"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
