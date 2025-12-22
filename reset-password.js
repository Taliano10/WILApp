// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

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

// DOM elements
const form = document.getElementById("resetForm");
const messageEl = document.getElementById("message");

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Handle reset form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (!email) {
    messageEl.textContent = "❌ Please enter your email.";
    messageEl.className = "mt-4 text-red-600 text-center";
    return;
  }

  if (!isValidEmail(email)) {
    messageEl.textContent = "❌ Invalid email format.";
    messageEl.className = "mt-4 text-red-600 text-center";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email, {
      url: 'http://127.0.0.1:5500/login.html', // redirect after reset
      handleCodeInApp: false
    });
    messageEl.textContent = "✅ A password reset link has been sent to " + email;
    messageEl.className = "mt-4 text-green-600 text-center";
    form.reset();
  } catch (error) {
    console.error(error);
    // Friendly messages for common errors
    if (error.code === 'auth/user-not-found') {
      messageEl.textContent = "❌ No account found with this email.";
    } else if (error.code === 'auth/invalid-email') {
      messageEl.textContent = "❌ Invalid email address.";
    } else {
      messageEl.textContent = "❌ Error: " + error.message;
    }
    messageEl.className = "mt-4 text-red-600 text-center";
  }
});
