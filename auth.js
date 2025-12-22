// auth.js

// Import Firebase SDKs (v9+ modular syntax, but using compat for v8 style)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBgqE8lMevET8qRWOVMBZ-wTWi_2T5c8Uw",
  authDomain: "login-wil-47477.firebaseapp.com",
  databaseURL: "https://login-wil-47477-default-rtdb.firebaseio.com",
  projectId: "login-wil-47477",
  storageBucket: "login-wil-47477.appspot.com",
  messagingSenderId: "457032791224",
  appId: "1:457032791224:web:9dacb0d6a5658466e3304d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

window.Auth = {
  getAuthenticatedUser: async function (redirectUrl = '../logIn.html') {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, async (user) => {
        const userCode = sessionStorage.getItem('userCode');
        if (!user || !userCode) {
          window.location.href = redirectUrl;
          return resolve(null);
        }
        try {
          const snap = await get(ref(database, 'users/' + userCode));
          if (!snap.exists()) {
            window.location.href = redirectUrl;
            return resolve(null);
          }
          const data = snap.val();
          if (!data || !data.category) {
            window.location.href = redirectUrl;
            return resolve(null);
          }
          resolve({ authUser: user, userCode, ...data });
        } catch (err) {
          console.error('Auth check failed:', err);
          window.location.href = redirectUrl;
          resolve(null);
        }
      });
    });
  },

  logOutAndRedirect: function (redirectUrl = '../logIn.html') {
    signOut(auth).then(() => {
      sessionStorage.clear();
      window.location.href = redirectUrl;
    }).catch(console.error);
  }
};