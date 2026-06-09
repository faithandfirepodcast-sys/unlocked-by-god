import { initializeApp } from "firebase/app";
import { getFirestore, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCewkRj_0jQ5ulPTpGWaLFKMI9S04PxtQM",
  authDomain: "studio-9028743640-657a3.firebaseapp.com",
  projectId: "studio-9028743640-657a3",
  storageBucket: "studio-9028743640-657a3.firebasestorage.app",
  messagingSenderId: "459901966671",
  appId: "1:459901966671:web:651cf2fbcfedc6f3758d3a"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { serverTimestamp };
