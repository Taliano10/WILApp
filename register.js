// register.js - uploads go first, then Firebase (proof + images metadata)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  deleteUser,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgqE8lMevET8qRWOVMBZ-wTWi_2T5c8Uw",
  authDomain: "login-wil-47477.firebaseapp.com",
  databaseURL: "https://login-wil-47477-default-rtdb.firebaseio.com",
  projectId: "login-wil-47477",
  storageBucket: "login-wil-47477.appspot.com",
  messagingSenderId: "457032791224",
  appId: "1:457032791224:web:9dacb0d6a5658466e3304d"
};

const BACKEND_BASE = "https://project-connect-x4ei.onrender.com";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

/* ----------------------
   UI helpers (modals & loading)
   ---------------------- */
function showFailModal(message) {
  const el = document.getElementById("failMessage");
  if (el) el.textContent = message;
  const modal = document.getElementById("failModal");
  if (modal) modal.classList.remove("hidden");
}
function closeFailModal() {
  const modal = document.getElementById("failModal");
  if (modal) modal.classList.add("hidden");
}
function redirectToLogin() {
  window.location.href = "logIn.html";
}

// Loading modal control — also used as status/progress UI
function showBusyState(isBusy, msg = "", percent = null) {
  const modal = document.getElementById("loadingModal");
  const status = document.getElementById("statusMessage");
  const progressEl = document.getElementById("loadingProgress");
  const percentLabel = document.getElementById("percentLabel");

  if (isBusy) {
    if (status && msg !== undefined) status.textContent = msg || "Processing...";
    if (percent !== null && progressEl && percentLabel) {
      const p = Math.max(0, Math.min(100, Math.round(percent)));
      progressEl.style.width = p + "%";
      percentLabel.textContent = p + "%";
    }
    if (modal) modal.classList.remove("hidden");
  } else {
    if (modal) {
      // small delay to let user see 100%
      setTimeout(() => {
        modal.classList.add("hidden");
        if (progressEl) progressEl.style.width = "0%";
        if (percentLabel) percentLabel.textContent = "0%";
        if (status) status.textContent = "";
      }, 200);
    }
  }

  // disable the primary submit button when busy
  const submit = document.getElementById("submit");
  if (submit) submit.disabled = !!isBusy;
}

/* Stage progress mapping so the progress bar moves smoothly across whole flow */
const STAGE_RANGES = {
  images: [5, 50],
  proof: [50, 70],
  auth: [70, 85],
  db: [85, 100]
};

function setStageProgress(stage, fractionBetween0and1, msg) {
  const range = STAGE_RANGES[stage];
  if (!range) {
    showBusyState(true, msg || "Working...", 50);
    return;
  }
  const [start, end] = range;
  const percent = start + (end - start) * Math.max(0, Math.min(1, fractionBetween0and1));
  showBusyState(true, msg || "", percent);
}

/* ----------------------
   Auth state helper (unchanged)
   ---------------------- */
function waitForSignedIn(uid, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        try { unsubscribe(); } catch (e) {}
        reject(new Error("Timed out waiting for auth sign-in"));
      }
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === uid) {
        done = true;
        clearTimeout(timer);
        try { unsubscribe(); } catch (e) {}
        resolve(user);
      }
    });
  });
}

/* ----------------------
   Upload helpers (XHR so we can show progress)
   ---------------------- */

/**
 * Upload firm images to backend.
 * Now includes 'category' in the FormData so the backend knows user category.
 */
function uploadFirmImages(userCode, files, category) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("user_code", userCode);
    if (category != null) form.append("category", category); // <-- send category
    for (const f of files) form.append("images", f);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_BASE}/upload-images`, true);

    xhr.upload.onprogress = function (evt) {
      if (evt.lengthComputable) {
        const frac = evt.loaded / evt.total; // 0..1
        setStageProgress("images", frac, `Uploading pictures... (${Math.round(frac*100)}%)`);
      }
    };

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json);
        } catch (err) {
          reject(new Error("Invalid JSON from upload-images: " + err.message));
        }
      } else {
        reject(new Error(`Image upload failed: ${xhr.status} ${xhr.responseText || xhr.statusText}`));
      }
    };

    xhr.onerror = function () {
      reject(new Error("Network error during image upload"));
    };

    xhr.send(form);
  });
}

/**
 * Upload proof of registration file to backend.
 * Now includes 'category' in the FormData so backend can classify proof by category.
 */
function uploadFirmProof(userCode, file, category) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("user_code", userCode);
    if (category != null) form.append("category", category); // <-- send category
    form.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BACKEND_BASE}/firm-proof`, true);

    xhr.upload.onprogress = function (evt) {
      if (evt.lengthComputable) {
        const frac = evt.loaded / evt.total;
        setStageProgress("proof", frac, `Uploading proof of registration... (${Math.round(frac*100)}%)`);
      }
    };

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json);
        } catch (err) {
          reject(new Error("Invalid JSON from firm-proof: " + err.message));
        }
      } else {
        reject(new Error(`Proof upload failed: ${xhr.status} ${xhr.responseText || xhr.statusText}`));
      }
    };

    xhr.onerror = function () {
      reject(new Error("Network error during proof upload"));
    };

    xhr.send(form);
  });
}

/* Fetch proof metadata (keeps using fetch since no upload) */
async function fetchProofMetadata(userCode) {
  const res = await fetch(`${BACKEND_BASE}/firm-proof/${encodeURIComponent(userCode)}`, {
    method: "GET"
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Failed to fetch proof metadata: ${res.status} ${body}`);
  }
  return await res.json();
}

/* Keep absoluteUrl helper (unchanged) */
function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  try {
    const u = new URL(pathOrUrl);
    return u.href;
  } catch (e) {
    return BACKEND_BASE.replace(/\/$/, "") + "/" + pathOrUrl.replace(/^\//, "");
  }
}

/* Helper: try to extract a backend storage path from a returned URL */
function extractPathFromUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const base = BACKEND_BASE.replace(/\/$/, "");
    // If the URL host/path starts with our backend and contains a known storage segment:
    if (url.startsWith(base)) {
      // take everything after the host (remove leading slash)
      return url.replace(base, "").replace(/^\//, "") || null;
    }
    // fallback: try to find common 'wil-firm-pics' segment anywhere
    const m = url.match(/\/(wil-firm-pics\/.+)$/);
    if (m && m[1]) return m[1];
  } catch (e) {
    // not a full URL - maybe a path already
    if (typeof url === "string" && url.indexOf("wil-firm-pics/") !== -1) {
      const idx = url.indexOf("wil-firm-pics/");
      return url.slice(idx);
    }
  }
  return null;
}

/* ----------------------
   Send signup email helper
   ---------------------- */
async function sendSignupEmail(payload) {
  try {
    const res = await fetch(`${BACKEND_BASE}/send-signup-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await (res.headers.get("content-type") || "").includes("application/json")
      ? await res.json().catch(() => null)
      : await res.text().catch(() => null);
    if (!res.ok) {
      console.warn("[register] send-signup-email returned non-OK:", res.status, body);
      throw new Error(`Email API returned ${res.status}`);
    }
    return body;
  } catch (err) {
    console.warn("[register] send-signup-email error:", err);
    throw err;
  }
}

/* ----------------------
   Main submit wiring (keeps your flow; adds progress & loading modal)
   ---------------------- */
const submitBtn = document.getElementById("submit");
if (!submitBtn) {
  console.error("Submit button (#submit) not found in DOM.");
} else {
  submitBtn.onclick = null;

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    showBusyState(true, "Starting registration...", 2);
    console.log("[register] submit clicked");

    const email = (document.getElementById("email") || {}).value?.trim() || "";
    const password = (document.getElementById("password") || {}).value || "";
    const confirmPassword = (document.getElementById("confirmPassword") || {}).value || "";
    const category = (document.getElementById("category") || {}).value || "";

    if (!email || !password) {
      showBusyState(false);
      showFailModal("Please provide email and password.");
      return;
    }
    if (password !== confirmPassword) {
      showBusyState(false);
      showFailModal("Passwords do not match.");
      return;
    }

    const userCode = (typeof window.generateUserCode === "function")
      ? window.generateUserCode()
      : ("UC" + Date.now());
    console.log("[register] userCode:", userCode);

    let userCredential = null;
    let imagesRes = null;
    let proofUploadResp = null;
    let proofMeta = null;

    try {
      // 1) If will-firm, perform uploads FIRST (with progress)
      if (category === "will-firm") {
        showBusyState(true, "Preparing uploads...", STAGE_RANGES.images[0]);

        const picsInput = document.getElementById("upload-pics");
        const files = picsInput ? Array.from(picsInput.files) : null;
        if (!files || files.length < 5 || files.length > 10) {
          throw new Error("Please upload between 5 and 10 pictures for the firm.");
        }

        // images
        // <-- pass category to backend so it knows which user category this upload is for
        imagesRes = await uploadFirmImages(userCode, files, category);
        setStageProgress("images", 1, "Pictures uploaded");

        // proof
        const proofInput = document.getElementById("proof-registration");
        const proofFile = proofInput ? proofInput.files[0] : null;
        if (!proofFile) {
          throw new Error("Proof of Registration file is required.");
        }
        // <-- pass category to proof upload as well
        proofUploadResp = await uploadFirmProof(userCode, proofFile, category);
        setStageProgress("proof", 1, "Proof uploaded");

        try {
          showBusyState(true, "Retrieving proof metadata...", 66);
          proofMeta = await fetchProofMetadata(userCode);
          console.log("[register] proof metadata fetched:", proofMeta);
        } catch (metaErr) {
          console.warn("[register] fetchProofMetadata failed, will fall back to POST response:", metaErr);
          proofMeta = proofUploadResp || null;
        }
      } else {
        // Non-firm users: proof/images not required
        proofMeta = null;
        imagesRes = null;
      }

      // 2) Create Auth user AFTER uploads succeed
      setStageProgress("auth", 0.05, "Creating account...");
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setStageProgress("auth", 0.8, "Finalizing account...");
      console.log("[register] auth created uid:", userCredential.user.uid);

      // 3) Wait for client sign-in visibility
      await waitForSignedIn(userCredential.user.uid, 8000);
      setStageProgress("auth", 1, "Signed in");
      console.log("[register] client signed-in confirmed");

      // 4) Prepare userData (attach proof/images metadata)
      const userData = {
        email,
        firstname: (document.getElementById("firstName") || {}).value || null,
        lastname: (document.getElementById("lastName") || {}).value || null,
        middlename: (document.getElementById("middleName") || {}).value || null,
        phone: (document.getElementById("phone") || {}).value || null,
        userCode,
        category, // saved to RTDB as before
        dynamicField: (document.getElementById("dynamic-options") || {}).value || null,
        date: new Date().toISOString()
      };

      if (category === "lecture") userData.status = false;
      if (category === "student") userData.placement = "";
      if (category === "external_company") {
        userData.companyName = (document.getElementById("external-company-name") || {}).value || null;
      }
      if (category === "will-firm") {
        userData.geoLocation = (document.getElementById("geo-location-output") || {}).textContent || null;
        userData.manualLocation = (document.getElementById("manual-location") || {}).value || null;
        userData.description = (document.getElementById("description") || {}).value || null;
        userData.paysSalaries = !!(document.getElementById("paysSalaries") || {}).checked;
        userData.offersAccommodation = !!(document.getElementById("offersAccommodation") || {}).checked;
        userData.capacity = (document.getElementById("capacity") || {}).value || null;
        userData.companyName = (document.getElementById("company-name") || {}).value || null;
        userData.status = false;
      }

      userData.proofRegistration = {
        id: proofMeta?.id ?? null,
        original_filename: proofMeta?.original_filename ?? proofMeta?.filename ?? null,
        filename: proofMeta?.filename ?? null,
        mime_type: proofMeta?.mime_type ?? null,
        file_url: proofMeta?.file_url ? absoluteUrl(proofMeta.file_url) : (proofMeta?.file_url ? absoluteUrl(proofMeta.file_url) : null),
        uploaded_at: proofMeta?.uploaded_at ?? null
      };

      // accept backend response shapes containing image ids
      if (imagesRes) {
        if (Array.isArray(imagesRes.images)) {
          userData.images = imagesRes.images.map((it, idx) => {
            const url = it.url ? absoluteUrl(it.url) : null;
            const path = it.path ?? extractPathFromUrl(it.path ?? it.url ?? null);
            return {
              index: it.index ?? (idx + 1),
              id: it.id ?? null,
              path: path ?? null,
              url: url
            };
          });
        } else if (Array.isArray(imagesRes.file_paths)) {
          const paths = imagesRes.file_paths || [];
          const urls = imagesRes.file_urls || null;
          userData.images = paths.map((p, idx) => {
            return {
              index: idx + 1,
              id: null,
              path: p,
              url: (urls && urls[idx]) ? absoluteUrl(urls[idx]) : absoluteUrl(p)
            };
          });
        } else {
          // unknown shape: store raw response under images_raw for debugging
          userData.images = null;
          userData.images_raw = imagesRes;
          console.warn("[register] upload returned unknown images shape:", imagesRes);
        }
      }

      // 5) Save to Firebase Realtime Database
      setStageProgress("db", 0.02, "Saving account data...");
      try {
        // show some progress while saving
        showBusyState(true, "Saving account data... (starting)", 88);
        await set(ref(db, `users/${userCode}`), userData);
        showBusyState(true, "Saving account data... (finalizing)", 98);
        console.log("[register] RTDB write successful for users/" + userCode);
      } catch (dbErr) {
        console.error("[register] RTDB set() failed:", dbErr);
        try {
          if (userCredential?.user) {
            console.warn("[register] deleting Auth user due to DB write failure...");
            await deleteUser(userCredential.user);
            console.warn("[register] Auth user deleted");
          }
        } catch (delErr) {
          console.error("[register] failed to delete auth user after DB error:", delErr);
          try { await signOut(auth); } catch(e){/*ignore*/ }
        }
        throw new Error("Saving user data to Firebase failed. Please try again.");
      }

      // 5.5) Call send-signup-email route (non-blocking for success UI; we await to log errors)
      try {
        const emailPayload = {
          firstName: userData.firstname || "",
          lastName: userData.lastname || "",
          email: userData.email || "",
          phone: userData.phone || "",
          userCode: userData.userCode || "",
          category: userData.category || "" // <-- include category in email payload
          // optionally: from_email/from_name if you want
        };
        console.log("[register] calling send-signup-email with payload:", emailPayload);
        const emailResp = await sendSignupEmail(emailPayload);
        console.log("[register] send-signup-email response:", emailResp);
      } catch (emailErr) {
        // warn but don't abort the success flow
        console.warn("[register] sending signup email failed:", emailErr);
      }

      // 6) Success UI
      showBusyState(false);
      const successModal = document.getElementById("successModal");
      if (successModal) successModal.classList.remove("hidden");
      setTimeout(() => { window.location.href = "logIn.html"; }, 1600);

    } catch (err) {
      console.error("[register] overall error:", err);
      showBusyState(false);

      // Cleanup: if auth was created, delete it to avoid orphaned auth
      if (userCredential?.user) {
        try {
          await deleteUser(userCredential.user);
          console.warn("[register] Auth user deleted due to failed registration flow.");
        } catch (delErr) {
          console.error("[register] cleanup deleteUser failed:", delErr);
          try { await signOut(auth); } catch (e) {}
        }
      }

      showFailModal("Registration failed: " + (err.message || err));
    }
  });
}
