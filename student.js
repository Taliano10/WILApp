// student-dashboard.js

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut, updatePassword
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import {
  getDatabase, ref as dbRef, get as getRT, update as updateRT
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import {
   collection, getDocs, query, orderBy, addDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBgqE8lMevET8qRWOVMBZ-wTWi_2T5c8Uw",
  authDomain: "login-wil-47477.firebaseapp.com",
  projectId: "login-wil-47477",
  storageBucket: "login-wil-47477.appspot.com",
  messagingSenderId: "457032791224",
  appId: "1:457032791224:web:9dacb0d6a5658466e3304d",
  databaseURL: "https://login-wil-47477-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);


// Utility: format date to YYYY-MM-DD
const formatDate = date => date.toISOString().split("T")[0];

// Get current authenticated user and their userCode
async function getCurrentUserInfo() {
  return new Promise(resolve => {
    onAuthStateChanged(auth, async user => {
      const userCode = sessionStorage.getItem("userCode");
      if (!user || !userCode) return (window.location.href = "login.html");

      const snap = await getRT(dbRef(db, `users/${userCode}`));
      if (!snap.exists()) return (window.location.href = "login.html");

      resolve({ userCode, userData: snap.val(), user });
    });
  });
}

// Load assignments and render calendar + list
async function loadAssignments(userCode) {
  const colRef = collection(firestore, "students", userCode, "activities");
  const q = query(colRef, orderBy("deadline", "asc"));
  const snap = await getDocs(q);
  const assignments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderCalendar(assignments);
  renderAssignmentsList(assignments);
}

function renderCalendar(assignments) {
  const calendarEl = document.getElementById("calendar");
  calendarEl.innerHTML = "";

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const offset = firstDay.getDay();

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach(day => {
    const el = document.createElement("div");
    el.textContent = day;
    el.className = "text-center font-semibold text-gray-600";
    calendarEl.appendChild(el);
  });

  for (let i = 0; i < offset; i++) {
    calendarEl.appendChild(document.createElement("div"));
  }

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const relevant = assignments.filter(a => a.deadline === dateStr);

    const cell = document.createElement("div");
    cell.className = "p-2 border h-20 rounded bg-white flex flex-col";
    cell.innerHTML = `<div class="font-semibold text-gray-700">${d}</div>`;

    if (relevant.length) {
      const dots = document.createElement("div");
      dots.className = "flex space-x-1 mt-auto";
      relevant.slice(0, 3).forEach(a => {
        const dot = document.createElement("div");
        dot.className = a.completed ? "w-3 h-3 bg-green-500 rounded-full" : "w-3 h-3 bg-blue-500 rounded-full";
        dots.appendChild(dot);
      });
      cell.appendChild(dots);
    }

    calendarEl.appendChild(cell);
  }
}

function renderAssignmentsList(assignments) {
  const listEl = document.getElementById("assignments-list");
  const noneEl = document.getElementById("no-assignments");
  listEl.innerHTML = "";

  if (!assignments.length) return noneEl.classList.remove("hidden");
  noneEl.classList.add("hidden");

  const todayStr = formatDate(new Date());
  const upcoming = assignments.filter(a => a.deadline >= todayStr);
  const completed = assignments.filter(a => a.deadline < todayStr);

  const section = (title, items, color) => {
    const header = document.createElement("h2");
    header.textContent = title;
    header.className = `text-xl font-semibold text-${color}-700 mt-6 mb-2`;
    listEl.appendChild(header);

    if (!items.length) {
      const p = document.createElement("p");
      p.textContent = `No ${title.toLowerCase()}.`;
      p.className = "text-gray-500 italic";
      listEl.appendChild(p);
    } else {
      items.forEach(a => listEl.appendChild(createCard(a, color)));
    }
  };

  section("Upcoming Assignments", upcoming, "blue");
  section("Completed Assignments", completed, "green");
}

function createCard(a, color) {
  const card = document.createElement("div");
  card.className = `border border-${color}-500 p-4 mb-4 rounded bg-white shadow`;
  card.innerHTML = `
    <h3 class="text-lg font-semibold text-${color}-700 mb-1">${a.title}</h3>
    <p class="text-gray-700 mb-1">${a.description || ""}</p>
    <p class="text-sm text-gray-500">Deadline: ${a.deadline}</p>
  `;
  return card;
}

// Load and render firms
async function loadFirms(field, term = "") {
  const snap = await getDocs(collection(firestore, "firms"));
  let firms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (term) {
    const t = term.toLowerCase();
    firms = firms.filter(f => f.name.toLowerCase().includes(t) || f.industry.toLowerCase().includes(t));
  } else {
    firms = firms.filter(f => f.targetFields?.includes(field));
  }

  renderFirms(firms);
}

function renderFirms(firms) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!firms.length) {
    const p = document.createElement("p");
    p.textContent = "No firms found.";
    p.className = "text-center text-gray-500 italic col-span-full";
    container.appendChild(p);
    return;
  }

  firms.forEach(f => {
    const card = document.createElement("div");
    card.className = "border p-4 rounded shadow";
    card.innerHTML = `
      <h3 class="text-xl font-semibold mb-1">${f.name}</h3>
      <p class="text-sm text-gray-600">${f.industry}</p>
      <p class="text-gray-700 mt-2">${f.description || ""}</p>
    `;
    container.appendChild(card);
  });
}

// Load and render jobs
async function loadJobs(qualification) {
  const list = document.getElementById("jobList");
  const empty = document.getElementById("noJobs");
  list.innerHTML = "";

  const snap = await getDocs(collection(firestore, "jobs"));
  const jobs = snap.docs.map(doc => doc.data()).filter(j => j.targetQualification?.toLowerCase() === qualification);

  if (!jobs.length) {
    empty.classList.remove("hidden");
    return;
  }

  empty.classList.add("hidden");

  jobs.forEach(job => {
    const div = document.createElement("div");
    div.className = "bg-white shadow p-4 rounded border";
    div.innerHTML = `
      <h3 class="text-lg font-semibold text-blue-700">${job.title}</h3>
      <p class="text-gray-600 mt-1">${job.description}</p>
      <p class="text-sm text-gray-500 mt-2">Posted by: ${job.firmName}</p>
    `;
    list.appendChild(div);
  });
}

// Upload assignment form
document.getElementById("uploadForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const deadline = document.getElementById("deadline").value;
  const file = document.getElementById("file").files[0];

  if (!file || !title || !deadline) return alert("Please fill in all fields.");

  const { userCode } = await getCurrentUserInfo();
  const path = `activities/${userCode}/${file.name}`;
  const fileRef = storageRef(storage, path);

  try {
    await uploadBytes(fileRef, file);
    const fileURL = await getDownloadURL(fileRef);

    await addDoc(collection(firestore, "students", userCode, "activities"), {
      title, description, deadline, fileURL,
      uploadedAt: new Date().toISOString()
    });

    document.getElementById("statusMsg").classList.remove("hidden");
    document.getElementById("uploadForm").reset();
  } catch (err) {
    console.error("Upload error:", err);
    alert("Upload failed.");
  }
});

// Profile update form
document.getElementById("profileForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const fname = document.getElementById("firstName").value.trim();
  const lname = document.getElementById("lastName").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const newPassword = document.getElementById("newPassword").value;

  const { userCode } = await getCurrentUserInfo();

  try {
    await updateRT(dbRef(db, `users/${userCode}`), {
      name: fname, surname: lname, contact
    });

    if (newPassword) await updatePassword(auth.currentUser, newPassword);

    document.getElementById("updateMsg").classList.remove("hidden");
  } catch (err) {
    console.error("Profile update error:", err);
    alert("Profile update failed.");
  }
});

// Logout
function setupLogout() {
  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await signOut(auth);
    sessionStorage.removeItem("userCode");
    window.location.href = "login.html";
  });
}

// Entry point
window.addEventListener("DOMContentLoaded", async () => {
  setupLogout();
  const { userCode, userData } = await getCurrentUserInfo();

  loadAssignments(userCode);
  loadFirms(userData.fieldOfStudy);
  loadJobs(userData.qualification || userData.fieldOfStudy);

  document.getElementById("searchInput")?.addEventListener("input", e => {
    loadFirms(userData.fieldOfStudy, e.target.value.trim());
  });
});
