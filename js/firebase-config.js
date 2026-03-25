// ============================================================
//  FluffyPaws — firebase-config.js
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyB49ICZFZzDrnZdCqK153SB95QTCzEm7ac",
    authDomain: "proiectweb-487aa.firebaseapp.com",
    projectId: "proiectweb-487aa",
    storageBucket: "proiectweb-487aa.firebasestorage.app",
    messagingSenderId: "530876246096",
    appId: "1:530876246096:web:1414df480505aec9514955"
};

firebase.initializeApp(firebaseConfig);

const db   = firebase.firestore();
const auth = firebase.auth();
