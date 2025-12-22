import { getDatabase, ref, push, onChildAdded, get, set, query, orderByChild } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Globals from CDN (loaded in HTML)
const CryptoJS = window.CryptoJS;

let currentUserCode = null;
let chatPartnerCode = null;
let SECRET_KEY = null; // Will be set dynamically per chat room

async function init() {
  const urlParams = new URLSearchParams(window.location.search);
  chatPartnerCode = urlParams.get("to");

  const user = await window.Auth.getAuthenticatedUser("../login.html");
  if (!user) {
    alert("You must be logged in to chat.");
    window.location.href = "../login.html";
    return;
  }

  currentUserCode = user.userCode;
  if (!chatPartnerCode) {
    alert("No chat partner specified.");
    window.location.href = getDashboardUrl(user.category);
    return;
  }

  document.getElementById("backBtn").href = getDashboardUrl(user.category);
  await loadChatPartnerName(chatPartnerCode);

  // Get or create the chat key for this chat room
  const chatRoomId = getChatId(currentUserCode, chatPartnerCode);
  SECRET_KEY = await getOrCreateChatKey(chatRoomId);

  setupSendHandler();
  loadMessages(currentUserCode, chatPartnerCode);
}

function getDashboardUrl(category) {
  switch (category) {
    case "student": return "../student-dashboard.html";
    case "lecture":
    case "lecturer": return "lecture/lecture.html";
    case "coordinator": return "../coordinator-dashboard.html";
    case "firm":
    case "external_company":
    case "will-firm": return "../firm-dashboard.html";
    default: return "../dashboard.html";
  }
}

async function loadChatPartnerName(code) {
  try {
    const db = getDatabase();
    const refUser = ref(db, `users/${code}`);
    const snap = await get(refUser);
    const user = snap.val();
    const fullName = `${user?.firstname || user?.firstName || ""} ${user?.lastname || ""}`.trim();
    document.getElementById("chatPartnerName").textContent = fullName || code;
  } catch {
    document.getElementById("chatPartnerName").textContent = code;
  }
}

// This function tries to get the key; if none exists, generate and save a new one
async function getOrCreateChatKey(chatRoomId) {
  const db = getDatabase();
  const keyRef = ref(db, `chatKeys/${chatRoomId}`);

  const snapshot = await get(keyRef);
  if (snapshot.exists()) {
    return snapshot.val().key;
  } else {
    const newKey = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64);
    await set(keyRef, { key: newKey, createdAt: Date.now(), createdBy: currentUserCode });
    return newKey;
  }
}

// AES encryption using raw Base64 key, ECB mode, PKCS7 padding (Kotlin compatible)
function encryptMessage(message) {
  const keyWords = CryptoJS.enc.Base64.parse(SECRET_KEY);
  const encrypted = CryptoJS.AES.encrypt(message, keyWords, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext);
}

function decryptMessage(cipherTextBase64) {
  try {
    const keyWords = CryptoJS.enc.Base64.parse(SECRET_KEY);
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(cipherTextBase64) },
      keyWords,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    return decrypted.toString(CryptoJS.enc.Utf8) || "[Encrypted]";
  } catch {
    return "[Unable to decrypt]";
  }
}

function setupSendHandler() {
  const input = document.getElementById("messageInput");
  const btn = document.getElementById("sendBtn");

  btn.addEventListener("click", () => {
    const msg = input.value.trim();
    if (!msg) return;

    const encrypted = encryptMessage(msg);
    const db = getDatabase();
    const chatRef = ref(db, `messages/${getChatId(currentUserCode, chatPartnerCode)}`);

    push(chatRef, {
      from: currentUserCode,
      to: chatPartnerCode,
      message: encrypted,
      timestamp: Date.now(),
    });

    input.value = "";
  });
}

function loadMessages(userA, userB) {
  const db = getDatabase();
  const chatRef = query(
    ref(db, `messages/${getChatId(userA, userB)}`),
    orderByChild("timestamp")
  );
  const chatBox = document.getElementById("chatBox");

  // Clear old messages
  chatBox.innerHTML = "";

  onChildAdded(chatRef, (snapshot) => {
    const msg = snapshot.val();
    const fromMe = msg.from === userA;
    const text = decryptMessage(msg.message);

    // Format timestamp to HH:mm
    const date = new Date(msg.timestamp || Date.now());
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Message container
    const container = document.createElement("div");
    container.className = `flex flex-col p-2 max-w-xs rounded-lg whitespace-pre-wrap break-words ${
      fromMe ? "bg-blue-100 self-end ml-auto" : "bg-gray-200 self-start mr-auto"
    }`;

    const messageText = document.createElement("div");
    messageText.textContent = text;

    const timeText = document.createElement("div");
    timeText.textContent = timeStr;
    timeText.className = "text-xs text-gray-500 mt-1 text-right";

    container.appendChild(messageText);
    container.appendChild(timeText);

    chatBox.appendChild(container);

    // Auto scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

function getChatId(a, b) {
  return [a, b].sort().join("_");
}

init();
