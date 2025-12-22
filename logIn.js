// logIn.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

// — Firebase config & init —
const firebaseConfig = {
  apiKey: "AIzaSyBgqE8lMevET8qRWOVMBZ-wTWi_2T5c8Uw",
  authDomain: "login-wil-47477.firebaseapp.com",
  databaseURL: "https://login-wil-47477-default-rtdb.firebaseio.com",
  projectId: "login-wil-47477",
  storageBucket: "login-wil-47477.appspot.com",
  messagingSenderId: "457032791224",
  appId: "1:457032791224:web:9dacb0d6a5658466e3304d"
};

initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

// — Modal controls —
const errorModal = document.getElementById("errorModal");
const errorMessage = document.getElementById("errorMessage");
const closeModalBtn = document.getElementById("closeModal");

function showError(message) {
  errorMessage.textContent = message;
  errorModal.classList.remove("hidden");
}
closeModalBtn.addEventListener("click", () => {
  errorModal.classList.add("hidden");
});

function saveUserSession({ userCode, category, firstname, lastname, dynamicField }) {
  sessionStorage.setItem("userCode", userCode);
  sessionStorage.setItem("category", category);
  sessionStorage.setItem("firstname", firstname);
  sessionStorage.setItem("lastname", lastname);
  sessionStorage.setItem("dynamicField", dynamicField);
}

// — Login logic —
document.getElementById("loginButton").addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const userCode = document.getElementById("user-code").value.trim();

  if (!email || !password || !userCode) {
    return showError("Please fill in all fields.");
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    const snap = await get(ref(db, `users/${userCode}`));
    if (!snap.exists()) {
      return showError("User data not found.");
    }

    const { category, status, firstname, lastname, dynamicField } = snap.val();
    saveUserSession({ userCode, category, firstname, lastname, dynamicField });
    // Block unapproved firms
    if ((category === "wil-firm" || category === "will-firm") && status === false) {
      return showError("Your firm has not yet been approved by the coordinator.");
    }

    if (category === "lecturer " && status === false) {
      return showError("Your account has not yet been approved by the coordinator.");
    }

    // Save session info
    saveUserSession({ userCode, category, firstname, lastname });

    // Redirect
    switch (category.toLowerCase()) {
      case "student":
        window.location.href = "student/studentdashboard.html";
        break;
      case "lecture":
      case "lecturer":
        window.location.href = "lecture/lecture.html";
        break;
      case "coordinator":
        window.location.href = "coordinator/dashboard.html";
        break;
      case "external_company":
      case "external-company":
        window.location.href = "externalCompany/dashboard.html";
        break;
      case "will-firm":
        window.location.href = "FIRM/index.html";
        break;
      default:
        showError("Unknown user category.");
    }
  } catch (err) {
    console.error("Login error:", err);
    showError(err.message.includes("auth/")
      ? "Authentication failed."
      : err.message);
  }
});

// — Helper: fetch & log all users —
async function fetchAllUsers() {
  try {
    const snap = await get(ref(db, "users"));
    if (!snap.exists()) return console.log("No users found");
    const users = snap.val();
    Object.entries(users).forEach(([code, data]) => {
      console.log(`UserCode: ${code}`, data);
    });
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}
fetchAllUsers();
window.fetchAllUsers = fetchAllUsers;
