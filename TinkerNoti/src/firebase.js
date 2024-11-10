// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyCe04hLwThhVOCfIlSUuCKXDpLW1V2wuGw",
    authDomain: "tinkering24-88f4d.firebaseapp.com",
    databaseURL: "https://tinkering24-88f4d-default-rtdb.firebaseio.com",
    projectId: "tinkering24-88f4d",
    storageBucket: "tinkering24-88f4d.firebasestorage.app",
    messagingSenderId: "1066192862886",
    appId: "1:1066192862886:web:8f2cb0d719305459ad7e67",
    measurementId: "G-ENQH0V79HB"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);