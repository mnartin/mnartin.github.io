// firebase-config.js – Midsommar 2026

const firebaseConfig = {
  apiKey:            "AIzaSyCA2xtedX3bf9NtgkpQ8tpyN3id7USm4As",
  authDomain:        "missommar2026.firebaseapp.com",
  databaseURL:       "https://missommar2026-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "missommar2026",
  storageBucket:     "missommar2026.firebasestorage.app",
  messagingSenderId: "849180512149",
  appId:             "1:849180512149:web:2f7db62ba96addd0dff09c"
};

try {
  firebase.initializeApp(firebaseConfig);
  window.db = firebase.database();
} catch (e) {
  console.warn('Firebase init failed:', e);
  window.db = null;
}
