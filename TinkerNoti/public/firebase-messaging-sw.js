importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCe04hLwThhVOCfIlSUuCKXDpLW1V2wuGw",
  authDomain: "tinkering24-88f4d.firebaseapp.com",
  projectId: "tinkering24-88f4d",
  storageBucket: "tinkering24-88f4d.firebasestorage.app",
  messagingSenderId: "1066192862886",
  appId: "1:1066192862886:web:8f2cb0d719305459ad7e67",
  measurementId: "G-ENQH0V79HB",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("Received background message ", payload);
  // Customize the notification here
});
