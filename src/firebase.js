// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // <-- TEJ LINII BRAKOWAŁO LUB BYŁA BŁĘDNA
import { getAuth } from "firebase/auth"; // NOWOŚĆ

// Twoja konfiguracja z konsoli Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAO11jiGu2MZbsfr_fp3sciFRARDKn1U5Q",
    authDomain: "rezerwacja-biletow.firebaseapp.com",
    projectId: "rezerwacja-biletow",
    storageBucket: "rezerwacja-biletow.firebasestorage.app",
    messagingSenderId: "757196994349",
    appId: "1:757196994349:web:b1538e76727d04352a85a4",
    measurementId: "G-55BY7TN1NT"
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);

// Inicjalizacja bazy danych Firestore i EXPORT
export const db = getFirestore(app);
export const auth = getAuth(app);