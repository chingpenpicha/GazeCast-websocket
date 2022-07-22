

// var firebaseApp = firebase.initializeApp({
//   apiKey: "AIzaSyDnNj_L3Ogo0TXkGNhVLMH2nQ4ILIug6ig",
//   authDomain: "eyevote-remote.firebaseapp.com",
//   projectId: "eyevote-remote",
//   storageBucket: "eyevote-remote.appspot.com",
//   messagingSenderId: "842441638283",
//   appId: "1:842441638283:web:e6470c3e849fbb3714ef8e",
//   measurementId: "G-ETZZ4VK7MF"
// });

import { initializeApp } from "firebase/app";
// import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  // ...
  // The value of `databaseURL` depends on the location of the database
  apiKey: "AIzaSyBb6oytKcY-nJsyXopwiCN5aXAtqjJnVM0",
  authDomain: "gazecast-ac4fa.firebaseapp.com",
  projectId: "gazecast-ac4fa",
  storageBucket: "gazecast-ac4fa.appspot.com",
  messagingSenderId: "697799990654",
  appId: "1:697799990654:web:f2d7352aadf6adbba9e72f",
  // databaseURL: "https://DATABASE_NAME.firebaseio.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const db = getFirestore(app);

export {db}
