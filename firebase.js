  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAYXRHCUcLskyb3xJXIzJT3GVIfpWxN4Is",
    authDomain: "venus-3674b.firebaseapp.com",
    projectId: "venus-3674b",
    storageBucket: "venus-3674b.firebasestorage.app",
    messagingSenderId: "1057343283630",
    appId: "1:1057343283630:web:6414631c51916f010d683f",
    measurementId: "G-97XYRYQ4XE"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
