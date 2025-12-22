// profile.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get, set, update, child } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBgqE8lMevET8qRWOVMBZ-wTWi_2T5c8Uw",
  authDomain: "login-wil-47477.firebaseapp.com",
  projectId: "login-wil-47477",
  storageBucket: "login-wil-47477.appspot.com",
  messagingSenderId: "457032791224",
  appId: "1:457032791224:web:9dacb0d6a5658466e3304d",
  databaseURL: "https://login-wil-47477-default-rtdb.firebaseio.com"
};

const FLASK_API_URL = "https://project-connect-x4ei.onrender.com";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

/* ---------- DOM refs ---------- */
const $ = (id) => document.getElementById(id);
const els = {
  profileImage: $("profileImage"),
  profileImageUpload: $("profileImageUpload"),
  uploadBtn: $("uploadProfileBtn"),
  uploadProfileBtnText: $("uploadProfileBtnText"),
  uploadProgress: $("uploadProgress"),
  uploadProgressBar: $("uploadProgressBar"),
  imageStatus: $("imageStatus"),
  deleteProfileBtn: $("deleteProfileBtn"),
  profileVisualWrapper: $("profileVisualWrapper"),
  profileStatusCard: $("profileStatusCard"),
  profileCompletion: $("profileCompletion"),
  firstName: $("firstName"),
  middleName: $("middleName"),
  lastName: $("lastName"),
  phone: $("phone"),
  savePersonalBtn: $("savePersonalBtn"),
  savePersonalBtnText: $("savePersonalBtnText"),
  personalStatus: $("personalStatus"),
  dynamicFieldsContainer: $("dynamicFieldsContainer"),
  roleSpecificTitle: $("roleSpecificTitle"),
  saveRoleBtn: $("saveRoleBtn"),
  saveRoleBtnText: $("saveRoleBtnText"),
  roleStatus: $("roleStatus"),
  email: $("email"),
  saveEmailBtn: $("saveEmailBtn"),
  emailStatus: $("emailStatus"),
  currentPassword: $("currentPassword"),
  newPassword: $("newPassword"),
  confirmNewPassword: $("confirmNewPassword"),
  savePasswordBtn: $("savePasswordBtn"),
  passwordStatus: $("passwordStatus"),

  firmImagesCard: $("firmImagesCard"),
  firmImagesList: $("firmImagesList"),
  firmImageUpload: $("firmImageUpload"),
  uploadFirmImageBtn: $("uploadFirmImageBtn"),
  deleteAllFirmImagesBtn: $("deleteAllFirmImagesBtn"),
  firmImageUploadStatus: $("firmImageUploadStatus"),
  firmImageProgress: $("firmImageProgress"),
  firmImageProgressFill: $("firmImageProgressFill"),
  firmImageProgressText: $("firmImageProgressText"),

  firmProofCard: $("firmProofCard"),
  firmProofDetails: $("firmProofDetails"),
  firmProofUpload: $("firmProofUpload"),
  uploadFirmProofBtn: $("uploadFirmProofBtn"),
  updateFirmProofBtn: $("updateFirmProofBtn"),
  deleteFirmProofBtn: $("deleteFirmProofBtn"),
  firmProofUploadStatus: $("firmProofUploadStatus"),
  firmProofProgress: $("firmProofProgress"),
  firmProofProgressFill: $("firmProofProgressFill"),
  firmProofProgressText: $("firmProofProgressText"),

  displayUserName: $("displayUserName"),
  userRoleBadge: $("userRoleBadge"),

  // image modal
  imageModal: $("imageModal"),
  imageModalBackdrop: $("imageModal")?.querySelector('.modal-backdrop'),
  imageModalImg: $("imageModalImg"),
  imagePrevBtn: $("imagePrevBtn"),
  imageNextBtn: $("imageNextBtn"),
  imageCloseBtn: $("imageCloseBtn"),
  imageDeleteBtn: $("imageDeleteBtn"),
  imageDownloadBtn: $("imageDownloadBtn"),
  imagePositionText: $("imagePositionText"),
  imageModalMeta: $("imageModalMeta"),

  // confirm/success/fail
  confirmModal: $("confirmModal"),
  confirmTitle: $("confirmTitle"),
  confirmMessage: $("confirmMessage"),
  confirmOkBtn: $("confirmOkBtn"),
  confirmCancelBtn: $("confirmCancelBtn"),
  successModal: $("successModal"),
  successMessage: $("successMessage"),
  successOkBtn: $("successOkBtn"),
  failModal: $("failModal"),
  failMessage: $("failMessage"),
  failOkBtn: $("failOkBtn"),
};

let currentUser = null;
let userCode = null;
let userCategory = null;
let userProfileData = {};
let profileExists = false;
let currentFirmImages = [];
let currentFirmProof = null;
let currentImageIndex = -1;

/* ---------- small helpers ---------- */
function escapeHtml(s) { return s == null ? '' : String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]); }
function defaultProfileSvg() { return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzNiODJmNiIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlByb2ZpbGU8L3RleHQ+PC9zdmc+"; }
function fmtDate(iso){ try{ return iso ? new Date(iso).toLocaleString() : '—'; }catch(e){ return iso || '—'; } }
function showSmallStatus(el, msg, type){ if(!el) return; el.textContent = msg; el.className = type==='error' ? 'text-red-600' : (type==='success' ? 'text-green-600' : 'text-yellow-500'); setTimeout(()=>{ if(el) { el.textContent=''; el.className=''; } }, 4500); }

/* ---------- modals (confirm / success / fail) ---------- */
function showModal(el, autoFocusEl) {
  if(!el) return;
  el.classList.add('modal-visible');
  el.style.display = 'flex';
  if(autoFocusEl) setTimeout(()=> autoFocusEl.focus(), 80);
}
function hideModal(el) {
  if(!el) return;
  el.classList.remove('modal-visible');
  el.style.display = 'none';
}

function showConfirm(title='Confirm', message='Are you sure?') {
  return new Promise((resolve) => {
    if(!els.confirmModal) return resolve(false);
    els.confirmTitle.textContent = title;
    els.confirmMessage.textContent = message;
    showModal(els.confirmModal, els.confirmOkBtn);

    const ok = () => { cleanup(); resolve(true); };
    const cancel = () => { cleanup(); resolve(false); };
    const esc = (e) => { if(e.key==='Escape'){ cleanup(); resolve(false); } };

    function cleanup(){
      hideModal(els.confirmModal);
      els.confirmOkBtn.removeEventListener('click', ok);
      els.confirmCancelBtn.removeEventListener('click', cancel);
      document.removeEventListener('keydown', esc);
    }

    els.confirmOkBtn.addEventListener('click', ok);
    els.confirmCancelBtn.addEventListener('click', cancel);
    document.addEventListener('keydown', esc);
  });
}

function showSuccess(message='Success', autoCloseMs = 2000) {
  if(!els.successModal) return;
  els.successMessage.textContent = message;
  showModal(els.successModal, els.successOkBtn);
  const okHandler = () => cleanup();
  let timer = null;
  function cleanup(){ hideModal(els.successModal); els.successOkBtn.removeEventListener('click', okHandler); if(timer) clearTimeout(timer); }
  els.successOkBtn.addEventListener('click', okHandler);
  if(autoCloseMs) timer = setTimeout(cleanup, autoCloseMs);
}

function showFail(message='Failed') {
  if(!els.failModal) return;
  els.failMessage.textContent = message;
  showModal(els.failModal, els.failOkBtn);
  const okHandler = () => { hideModal(els.failModal); els.failOkBtn.removeEventListener('click', okHandler); };
  els.failOkBtn.addEventListener('click', okHandler);
}

/* ---------- XMLHttpRequest upload with progress ---------- */
function uploadWithProgress(url, formData, onProgress, method='POST') {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.withCredentials = false;
      if (xhr.upload && typeof onProgress === 'function') {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(e.loaded, e.total);
        };
      }
      xhr.onload = () => {
        let json = null, text = xhr.responseText || '';
        try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject({ status: xhr.status, body: json });
      };
      xhr.onerror = () => reject({ status: xhr.status || 0, body: 'Network error' });
      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}

/* ---------- DB metadata helpers ---------- */
async function saveImagesMetadataToDb(userCodeParam, imagesRes){
  if(!userCodeParam) return;
  try {
    let arr = [];
    if(!imagesRes) imagesRes = {};
    if(Array.isArray(imagesRes.images)) {
      arr = imagesRes.images.map((it, idx) => ({
        index: idx + 1,
        id: it.id || it.image_id || null,
        path: it.file_path || it.filename || null,
        url: it.url || it.file_path || null,
        original_filename: it.original_filename || it.filename || null
      }));
    } else if(Array.isArray(imagesRes.file_paths)) {
      arr = (imagesRes.file_paths || []).map((p, idx) => ({ index: idx+1, path: p, url: p }));
    }
    await set(ref(db, `users/${userCodeParam}/images`), arr);
    await set(ref(db, `profile/${userCodeParam}/images`), arr);
    return arr;
  } catch (err) {
    console.warn('saveImagesMetadataToDb failed', err);
    throw err;
  }
}

async function saveProofMetaToDb(userCodeParam, proofMeta){
  if(!userCodeParam) return;
  try {
    if(!proofMeta) {
      await set(ref(db, `users/${userCodeParam}/proofRegistration`), null);
      await set(ref(db, `profile/${userCodeParam}/proofRegistration`), null);
      return null;
    }
    const normalized = {
      id: proofMeta.id ?? null,
      original_filename: proofMeta.original_filename ?? proofMeta.filename ?? null,
      filename: proofMeta.filename ?? null,
      mime_type: proofMeta.mime_type ?? null,
      file_url: proofMeta.file_url ? (proofMeta.file_url.startsWith('http') ? proofMeta.file_url : FLASK_API_URL.replace(/\/$/,'')+proofMeta.file_url) : null,
      uploaded_at: proofMeta.uploaded_at ?? null
    };
    await set(ref(db, `users/${userCodeParam}/proofRegistration`), normalized);
    await set(ref(db, `profile/${userCodeParam}/proofRegistration`), normalized);
    return normalized;
  } catch (err) {
    console.warn('saveProofMetaToDb failed', err);
    throw err;
  }
}

async function saveProfilePicMetaToDb(userCodeParam){
  if(!userCodeParam) return;
  try {
    const meta = { file_url: `${FLASK_API_URL.replace(/\/$/,'')}/profile-picture/${encodeURIComponent(userCodeParam)}`, uploaded_at: new Date().toISOString() };
    await set(ref(db, `users/${userCodeParam}/profile_picture`), meta);
    await set(ref(db, `profile/${userCodeParam}/profile_picture`), meta);
    return meta;
  } catch(err) {
    console.warn('saveProfilePicMetaToDb failed', err);
    throw err;
  }
}

async function removeImageMetadataFromDb(userCodeParam, { id=null, path=null, url=null } = {}){
  if(!userCodeParam) return;
  try {
    const snap = await get(ref(db, `users/${userCodeParam}/images`));
    let current = snap && snap.exists() ? snap.val() : [];
    if(!Array.isArray(current)) {
      const arr = Array.isArray(Object.values(current || {})) ? Object.values(current) : [];
      current = arr;
    }
    const filtered = (current || []).filter(it => {
      if(id && it.id && String(it.id) === String(id)) return false;
      if(path && it.path && String(it.path) === String(path)) return false;
      if(url && it.url && String(it.url) === String(url)) return false;
      return true;
    });
    await set(ref(db, `users/${userCodeParam}/images`), filtered);
    await set(ref(db, `profile/${userCodeParam}/images`), filtered);
    return filtered;
  } catch(err) {
    console.warn('removeImageMetadataFromDb error', err);
    throw err;
  }
}

/* ---------- burger menu functionality ---------- */
function setupBurgerMenu() {
  // Lecturer burger menu
  const burgerBtnLect = document.getElementById('burgerBtnLect');
  const burgerDropdownLect = document.getElementById('burgerDropdownLect');
  
  if (burgerBtnLect && burgerDropdownLect) {
    burgerBtnLect.addEventListener('click', (e) => {
      e.stopPropagation();
      burgerDropdownLect.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      burgerDropdownLect.classList.remove('show');
    });
  }

  // Coordinator burger menu
  const burgerBtnCoord = document.getElementById('burgerBtnCoord');
  const burgerDropdownCoord = document.getElementById('burgerDropdownCoord');
  
  if (burgerBtnCoord && burgerDropdownCoord) {
    burgerBtnCoord.addEventListener('click', (e) => {
      e.stopPropagation();
      burgerDropdownCoord.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      burgerDropdownCoord.classList.remove('show');
    });
  }
}

/* ---------- initialization ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  if(!window.Auth || typeof window.Auth.getAuthenticatedUser !== 'function') {
    console.error('Auth helper not available');
    return;
  }

  const user = await window.Auth.getAuthenticatedUser('../logIn.html');
  if(!user) return;

  currentUser = user;
  userCode = user.userCode || user.uid || null;
  userCategory = (user.category || '') + '';

  // render header based on role (small)
  renderRoleHeader(userCategory, user);

  if(els.displayUserName) els.displayUserName.textContent = `${user.firstname || ''} ${user.lastname || ''}`.trim();
  if(els.userRoleBadge) els.userRoleBadge.textContent = (user.category || '');

  // setup listeners and UI
  setupNavForRole(userCategory);

  if((userCategory || '').toLowerCase().includes('firm') || (userCategory || '').toLowerCase() === 'external_company') {
    els.uploadBtn?.classList.add('hidden');
    els.deleteProfileBtn?.classList.add('hidden');
  }

  await loadProfileNode();
  wireProfilePictureHandlers();
  wireAccountAndPasswordHandlers();

  els.savePersonalBtn?.addEventListener('click', onSavePersonal);
  els.saveRoleBtn?.addEventListener('click', onSaveRole);

  if((userCategory || '').toLowerCase().includes('firm') || (userCategory || '').toLowerCase() === 'external_company') {
    els.firmImagesCard?.classList.remove('hidden');
    els.firmProofCard?.classList.remove('hidden');

    els.uploadFirmImageBtn?.addEventListener('click', () => els.firmImageUpload.click());
    els.firmImageUpload?.addEventListener('change', onFirmImagesSelected);
    els.deleteAllFirmImagesBtn?.addEventListener('click', onDeleteAllFirmImages);

    els.uploadFirmProofBtn?.addEventListener('click', () => els.firmProofUpload.click());
    els.updateFirmProofBtn?.addEventListener('click', () => els.firmProofUpload.click());
    els.firmProofUpload?.addEventListener('change', onFirmProofSelected);
    els.deleteFirmProofBtn?.addEventListener('click', onDeleteFirmProof);

    await loadFirmImages(userCode);
    await loadFirmProof(userCode);
  }

  // Setup burger menu
  setupBurgerMenu();

  // logout binding (header buttons)
  document.querySelectorAll('[data-logout]').forEach(btn => btn.addEventListener('click', () => {
    if(window.Auth && typeof window.Auth.logOutAndRedirect === 'function') window.Auth.logOutAndRedirect('../logIn.html');
    else { try { signOut(auth); } catch(e){}; window.location.href = '../logIn.html'; }
  }));
});

/* ---------- role header & nav helpers ---------- */
const HEADERS = {
  student: `
  <header class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-xl">
    <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <i class="fas fa-user-graduate text-2xl"></i>
        <div>
          <h1 class="text-2xl font-bold">WELAP Portal</h1>
          <span id="userNameDisplaySmall" class="text-blue-200 text-sm">Student</span>
        </div>
      </div>
      <nav>
        <ul id="navLinks" class="flex space-x-6 text-sm font-medium">
          <li><a href="student/studentdashboard.html" class="hover:underline">Dashboard</a></li>
          <li><a href="profile.html" class="underline font-semibold">Profile</a></li>
          <li><button data-logout class="bg-white text-blue-700 px-3 py-1 rounded hover:bg-gray-100">Logout</button></li>
        </ul>
      </nav>
    </div>
  </header>`,

  lecturer: `
  <header class="bg-blue-600 shadow-md p-4">
    <div class="max-w-7xl mx-auto flex justify-between items-center relative">
      <div class="flex items-center gap-4">
        <div class="relative burger-menu">
          <button id="burgerBtnLect" class="text-2xl font-bold text-white">&#9776;</button>
          <div id="burgerDropdownLect" class="burger-dropdown">
            <a href="lecture/lecture.html">Dashboard</a>
            <a href="profile.html">Profile</a>
          </div>
        </div>
        <h1 id="welcomeLect" class="text-white font-semibold text-lg">Lecture Portal</h1>
      </div>
      <div class="flex items-center gap-4">
        <button id="chatBtnLect" class="text-white hover:text-gray-200">Chat</button>
        <button id="notifyBtnLect" class="text-white hover:text-gray-200">Notify</button>
        <button data-logout id="logoutBtnLect" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
      </div>
    </div>
  </header>`,

  coordinator: `
  <header class="bg-blue-600 shadow-md p-4">
    <div class="max-w-7xl mx-auto flex justify-between items-center relative">
      <div class="flex items-center gap-4">
        <div class="relative burger-menu">
          <button id="burgerBtnCoord" class="text-2xl font-bold text-white">&#9776;</button>
          <div id="burgerDropdownCoord" class="burger-dropdown">
            <a href="coordinator/dashboard.html">Dashboard</a>
            <a href="profile.html">Profile</a>
          </div>
        </div>
        <div class="text-white font-semibold">Welcome <span id="coordinatorNameTop">Coordinator</span></div>
      </div>
      <div class="flex items-center gap-4">
        <button id="chatBtnCoord" class="text-white hover:text-gray-200">Chat</button>
        <button data-logout id="logoutBtnCoord" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
      </div>
    </div>
  </header>`,

  firm: `
  <header class="bg-white shadow p-4">
    <div class="flex justify-between items-center max-w-7xl mx-auto px-4">
      <div>
        <p class="text-xl font-semibold" id="firmHeaderName">Firm Dashboard</p>
      </div>
      <div class="flex items-center gap-4">
        <a href="Firm/index.html" class="text-sm text-gray-700 hover:underline">Dashboard</a>
        <button data-logout id="logoutBtnFirm" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
      </div>
    </div>
  </header>`
};

function renderRoleHeader(roleKey, userData) {
  const container = document.getElementById('roleHeaderContainer');
  if(!container) return;
  const key = (roleKey||'').toLowerCase();
  let html = HEADERS.student;
  if(key.includes('firm') || key.includes('external_company')) html = HEADERS.firm;
  else if(key.includes('lecture') || key.includes('lecturer')) html = HEADERS.lecturer;
  else if(key.includes('coordinator')) html = HEADERS.coordinator;
  container.innerHTML = html;
  try {
    if(userData && document.getElementById('userNameDisplaySmall')) document.getElementById('userNameDisplaySmall').textContent = `${userData.firstname||''} ${userData.lastname||''}`.trim();
    if(userData && document.getElementById('firmHeaderName')) document.getElementById('firmHeaderName').textContent = userData.companyName || `${userData.firstname||''} ${userData.lastname||''}`.trim() || 'Firm';
    if(userData && document.getElementById('coordinatorNameTop')) document.getElementById('coordinatorNameTop').textContent = `${userData.firstname||''}`.toUpperCase();
    if(userData && document.getElementById('welcomeLect')) document.getElementById('welcomeLect').textContent = `Welcome ${(userData.firstname||'Lecturer')}`;
  } catch(e){}
}

/* ---------- nav helper ---------- */
function setupNavForRole(category){
  const elsNav = document.getElementById('navLinks');
  if(!elsNav) return;
  const roleKey = (category || '').toString().toLowerCase();
  const navMap = {
    coordinator: [['coordinator/dashboard.html', 'Dashboard']],
    student: [['student/studentdashboard.html', 'Dashboard']],
    'will-firm': [['Firm/index.html', 'Dashboard']],
    'external_company': [['Firm/index.html', 'Dashboard']],
    firm: [['Firm/index.html','Dashboard']],
    lecture: [['lecture/lecture.html','Dashboard']],
  };
  const items = navMap[roleKey] || [];
  let html = items.map(([href,label]) => `<li><a href="${href}" class="hover:underline">${label}</a></li>`).join('');
  html += `<li><a href="profile.html" class="font-semibold underline">Profile</a></li>`;
  html += `<li><button data-logout class="bg-white text-blue-700 px-3 py-1 rounded hover:bg-gray-100">Logout</button></li>`;
  elsNav.innerHTML = html;
}

/* ---------- load profile node (profile/) ---------- */
async function loadProfileNode(){
  if(!userCode) return;
  try {
    const snap = await get(child(ref(db), `profile/${userCode}`));
    if(snap && snap.exists()){
      profileExists = true;
      userProfileData = snap.val() || {};
      populateProfileFields(userProfileData);
    } else {
      profileExists = false;
      userProfileData = {};
      const fallback = {
        firstname: currentUser.firstname || '',
        middlename: currentUser.middlename || '',
        lastname: currentUser.lastname || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
        userCode,
        category: currentUser.category || ''
      };
      populateProfileFields(fallback);
      if(els.savePersonalBtnText) els.savePersonalBtnText.textContent = 'Upload Profile';
      if(els.saveRoleBtnText) els.saveRoleBtnText.textContent = 'Upload Role Info';
    }
  } catch(err) {
    console.error('loadProfileNode error', err);
    profileExists = false;
    userProfileData = {};
  }
}

function populateProfileFields(data = {}) {
  if(els.firstName) els.firstName.value = data.firstname || '';
  if(els.middleName) els.middleName.value = data.middlename || data.middleName || '';
  if(els.lastName) els.lastName.value = data.lastname || '';
  if(els.phone) els.phone.value = data.phone || '';
  if(els.email) els.email.value = data.email || (currentUser.email || '');
  if(els.displayUserName) els.displayUserName.textContent = `${data.firstname || currentUser.firstname || ''} ${data.lastname || currentUser.lastname || ''}`.trim();
  if(els.userRoleBadge) els.userRoleBadge.textContent = (data.category || currentUser.category || '').toString();
  createDynamicFields(currentUser.category, data || {});
}

/* ---------- dynamic role fields ---------- */
function createDynamicFields(userCategoryParam, profileData = {}){
  const container = els.dynamicFieldsContainer;
  if(!container) return;
  const role = (userCategoryParam || '').toString().toLowerCase();
  container.innerHTML = '';
  if(role === 'student'){
    container.innerHTML = `<div><label class="block font-semibold mb-1">Student ID *</label><input id="studentId" class="w-full border rounded px-3 py-2" value="${escapeHtml(profileData.studentId || profileData.studentID || '')}" ${profileData.studentId ? 'disabled' : ''}></div>`;
    els.roleSpecificTitle.textContent = 'Student Info';
  } else if(role === 'lecture' || role === 'lecturer'){
    container.innerHTML = `<div><label class="block font-semibold mb-1">Department *</label><input id="department" class="w-full border rounded px-3 py-2" value="${escapeHtml(profileData.department || '')}"></div>`;
    els.roleSpecificTitle.textContent = 'Lecturer Info';
  } else if(role === 'will-firm' || role === 'will firm' || role === 'external_company' || role === 'firm'){
    container.innerHTML = `
      <div><label class="block font-semibold mb-1">Company Name *</label><input id="companyName" class="w-full border rounded px-3 py-2" value="${escapeHtml(profileData.companyName || '')}"></div>
      <div><label class="block font-semibold mb-1">Industry *</label><input id="industry" class="w-full border rounded px-3 py-2" value="${escapeHtml(profileData.industry || '')}"></div>
      <div><label class="block font-semibold mb-1">Capacity</label><input id="capacity" class="w-full border rounded px-3 py-2" value="${escapeHtml(profileData.capacity || '')}"></div>
      <div><label class="block font-semibold mb-1">Manual Location</label><input id="manual-location" class="w-full border rounded px-3 py-2" value="${escapeHtml(profileData.manualLocation || profileData.manual_location || '')}"></div>
      <div><label class="block font-semibold mb-1">Description</label><textarea id="description" class="w-full border rounded px-3 py-2">${escapeHtml(profileData.description || '')}</textarea></div>
    `;
    els.roleSpecificTitle.textContent = 'Firm Info';
  } else if(role === 'coordinator'){
    container.innerHTML = `<div><label class="block font-semibold mb-1">Faculty *</label><input id="faculty" class="w-full border rounded px-3 py-2" value="${escapeHtml(profileData.faculty || '')}"></div>`;
    els.roleSpecificTitle.textContent = 'Coordinator Info';
  } else {
    container.innerHTML = `<div class="text-sm text-gray-600">No role-specific fields</div>`;
  }
}

/* ---------- save personal / role ---------- */
async function onSavePersonal(){
  if(!userCode) return;
  if(!els.firstName.value.trim() || !els.lastName.value.trim() || !els.phone.value.trim()){
    els.personalStatus.textContent = 'Please fill required fields: First name, Last name, Phone';
    els.personalStatus.className = 'text-red-600';
    return;
  }

  els.savePersonalBtn.disabled = true;
  els.personalStatus.textContent = 'Saving...';
  els.personalStatus.className = 'text-yellow-500';

  const profileToSave = {
    firstname: els.firstName.value.trim(),
    middlename: els.middleName.value.trim() || null,
    lastname: els.lastName.value.trim(),
    phone: els.phone.value.trim(),
    email: els.email.value?.trim() || (currentUser.email || null),
    userCode,
    category: currentUser.category || userCategory || null,
    dynamicField: (document.getElementById("dynamic-options") || {}).value || currentUser.dynamicField || null,
    date: new Date().toISOString()
  };

  const roleKey = (currentUser.category || '').toString().toLowerCase();
  if(roleKey === 'student'){
    const v = document.getElementById('studentId')?.value?.trim();
    if(v) profileToSave.studentId = v;
  } else if(roleKey === 'lecture' || roleKey === 'lecturer'){
    const v = document.getElementById('department')?.value?.trim();
    if(v) profileToSave.department = v;
  } else if(roleKey.includes('firm') || roleKey === 'external_company'){
    profileToSave.companyName = document.getElementById('companyName')?.value?.trim() || null;
    profileToSave.industry = document.getElementById('industry')?.value?.trim() || null;
    profileToSave.capacity = document.getElementById('capacity')?.value?.trim() || null;
    profileToSave.manualLocation = document.getElementById('manual-location')?.value?.trim() || null;
    profileToSave.description = document.getElementById('description')?.value?.trim() || null;
  } else if(roleKey === 'coordinator'){
    const v = document.getElementById('faculty')?.value?.trim();
    if(v) profileToSave.faculty = v;
  }

  try {
    await set(ref(db, `profile/${userCode}`), profileToSave);
    userProfileData = profileToSave;
    profileExists = true;
    showSmallStatus(els.personalStatus, 'Saved!', 'success');
    if(els.savePersonalBtnText) els.savePersonalBtnText.textContent = 'Save Personal Info';
    checkProfileCompletion(userProfileData, currentUser.category);
    showSuccess('Personal info saved');
  } catch(err) {
    console.error('save personal error', err);
    showSmallStatus(els.personalStatus, 'Error saving profile', 'error');
    showFail('Failed to save personal info');
  } finally {
    els.savePersonalBtn.disabled = false;
  }
}

async function onSaveRole(){
  if(!userCode) return;
  els.saveRoleBtn.disabled = true;
  els.roleStatus.textContent = 'Saving...';
  els.roleStatus.className = 'text-yellow-500';
  try {
    const updates = {};
    const rc = (currentUser.category || '').toString().toLowerCase();

    if(rc === 'student'){
      const v = document.getElementById('studentId')?.value?.trim();
      if(v) updates.studentId = v;
    } else if(rc === 'lecture' || rc === 'lecturer'){
      const v = document.getElementById('department')?.value?.trim();
      if(v) updates.department = v;
    } else if(rc.includes('firm') || rc === 'external_company'){
      const companyName = document.getElementById('companyName')?.value?.trim();
      const industry = document.getElementById('industry')?.value?.trim();
      const capacity = document.getElementById('capacity')?.value?.trim();
      const manualLocation = document.getElementById('manual-location')?.value?.trim();
      const description = document.getElementById('description')?.value?.trim();
      if(companyName) updates.companyName = companyName;
      if(industry) updates.industry = industry;
      if(capacity) updates.capacity = capacity;
      if(manualLocation) updates.manualLocation = manualLocation;
      if(description) updates.description = description;
    } else if(rc === 'coordinator'){
      const v = document.getElementById('faculty')?.value?.trim();
      if(v) updates.faculty = v;
    }

    if(Object.keys(updates).length === 0){
      els.roleStatus.textContent = 'No changes to save';
      els.roleStatus.className = 'text-gray-600';
      els.saveRoleBtn.disabled = false;
      return;
    }

    const existingSnap = await get(child(ref(db), `profile/${userCode}`));
    if(existingSnap && existingSnap.exists()){
      await update(ref(db, `profile/${userCode}`), { ...updates, updatedAt: new Date().toISOString() });
    } else {
      const createObj = {
        firstname: els.firstName.value || currentUser.firstname || '',
        lastname: els.lastName.value || currentUser.lastname || '',
        phone: els.phone.value || currentUser.phone || '',
        email: els.email.value || currentUser.email || '',
        userCode,
        category: currentUser.category || '',
        ...updates,
        date: new Date().toISOString()
      };
      await set(ref(db, `profile/${userCode}`), createObj);
      userProfileData = createObj;
      profileExists = true;
    }

    showSmallStatus(els.roleStatus, 'Saved!', 'success');
    checkProfileCompletion(userProfileData || {}, currentUser.category);
    showSuccess('Role info saved');
  } catch(err) {
    console.error('save role error', err);
    showSmallStatus(els.roleStatus, 'Error saving role info', 'error');
    showFail('Failed to save role info');
  } finally {
    els.saveRoleBtn.disabled = false;
  }
}

/* ---------- profile picture handlers ---------- */
function wireProfilePictureHandlers(){
  els.uploadBtn?.addEventListener('click', () => els.profileImageUpload.click());
  els.profileImageUpload?.addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;
    if(!file.type.startsWith('image/')) { showSmallStatus(els.imageStatus, 'Please select an image', 'error'); return; }

    els.uploadBtn.disabled = true;
    els.uploadProfileBtnText.textContent = 'Uploading...';
    els.imageStatus.textContent = 'Uploading...';
    els.imageStatus.className = 'text-yellow-500';
    if(els.uploadProgress) els.uploadProgress.classList.remove('hidden');
    if(els.uploadProgressBar) els.uploadProgressBar.style.width = '0%';

    try {
      const form = new FormData();
      form.append('image', file);
      const res = await uploadWithProgress(`${FLASK_API_URL}/profile-picture/${encodeURIComponent(userCode)}`, form, (loaded, total) => {
        const pct = Math.round((loaded/total)*100);
        if(els.uploadProgressBar) els.uploadProgressBar.style.width = pct + '%';
        if(els.imageStatus) els.imageStatus.textContent = `Uploading: ${pct}%`;
      });
      showSmallStatus(els.imageStatus, res.message || 'Uploaded!', 'success');
      await loadProfilePicture(userCode);
      try { await saveProfilePicMetaToDb(userCode); } catch(e){ console.warn('saveProfilePicMetaToDb failed', e); }
      showSuccess('Profile picture uploaded');
    } catch(err) {
      console.error('profile pic upload', err);
      let msg = 'Upload failed';
      if(err && err.body) msg = (err.body.error || JSON.stringify(err.body));
      showSmallStatus(els.imageStatus, msg, 'error');
      showFail('Upload failed: ' + msg);
    } finally {
      els.uploadBtn.disabled = false;
      els.uploadProfileBtnText.textContent = 'Update Picture';
      if(els.profileImageUpload) els.profileImageUpload.value = '';
      setTimeout(()=>{ if(els.uploadProgress) els.uploadProgress.classList.add('hidden'); if(els.imageStatus) els.imageStatus.textContent=''; }, 900);
    }
  });

  els.deleteProfileBtn?.addEventListener('click', async () => {
    const ok = await showConfirm('Remove profile picture', 'Remove profile picture?');
    if(!ok) return;
    els.deleteProfileBtn.disabled = true;
    els.deleteProfileBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Removing...';
    try {
      const resp = await fetch(`${FLASK_API_URL}/profile-picture/${encodeURIComponent(userCode)}`, { method: 'DELETE', credentials: 'omit' });
      if(!resp.ok) {
        const body = await resp.json().catch(()=>({ error: `Status ${resp.status}` }));
        throw new Error(body.error || `Delete failed (${resp.status})`);
      }
      // clear metadata in RTDB
      try { await set(ref(db, `users/${userCode}/profile_picture`), null); await set(ref(db, `profile/${userCode}/profile_picture`), null); } catch(e){ console.warn('clearing metadata failed', e); }
      if(els.profileImage) els.profileImage.src = defaultProfileSvg();
      showSuccess('Profile picture removed');
    } catch(err) {
      console.error('delete profile pic', err);
      let msg = err && err.message ? err.message : 'Failed to remove';
      showFail(msg);
    } finally {
      els.deleteProfileBtn.disabled = false;
      els.deleteProfileBtn.innerHTML = '<i class="fas fa-trash mr-2"></i>Remove Picture';
      setTimeout(()=> { if(els.imageStatus) els.imageStatus.textContent=''; }, 800);
    }
  });

  loadProfilePicture(userCode).catch(()=>{});
}

async function loadProfilePicture(uid){
  try {
    const resp = await fetch(`${FLASK_API_URL}/profile-picture/${encodeURIComponent(uid)}`, { credentials: 'omit' });
    if(resp.status === 404) return;
    if(!resp.ok) throw new Error(`Status ${resp.status}`);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    if(els.profileImage) els.profileImage.src = url;
  } catch(err) {
    console.warn('loadProfilePicture failed', err);
  }
}

/* ---------- firm images ---------- */
async function loadFirmImages(userCodeParam){
  if(!els.firmImagesList) return;
  els.firmImagesList.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">Loading images...</div>';
  try {
    const resp = await fetch(`${FLASK_API_URL}/get-images/${encodeURIComponent(userCodeParam)}`, { credentials: 'omit' });
    if(resp.status === 404){
      currentFirmImages = [];
      renderFirmImages();
      renderLeftFirmVisual();
      return;
    }
    if(!resp.ok) throw new Error(`Failed to fetch images (${resp.status})`);
    const data = await resp.json();

    if(Array.isArray(data.file_paths)) {
      currentFirmImages = data.file_paths.map((p, idx) => ({ id: null, url: p, path: p, index: idx+1 }));
    } else if(Array.isArray(data.images)) {
      currentFirmImages = data.images.map(img => ({
        id: img.id || img.image_id || null,
        url: img.url || img.file_path || null,
        file_path: img.file_path || null,
        original_filename: img.original_filename || img.filename || null
      }));
    } else {
      currentFirmImages = [];
    }

    // try to save metadata to RTDB (best-effort)
    try { await saveImagesMetadataToDb(userCodeParam, data); } catch(e){ console.warn('saveImagesMetadataToDb failed', e); }

    renderFirmImages();
    renderLeftFirmVisual();
  } catch(err) {
    console.error('loadFirmImages error', err);
    currentFirmImages = [];
    renderFirmImages();
    renderLeftFirmVisual();
    showSmallStatus(els.firmImageUploadStatus, 'Failed to load firm images', 'error');
  }
}

function renderFirmImages(){
  const list = els.firmImagesList;
  if(!list) return;
  list.innerHTML = '';
  if(!currentFirmImages.length){
    list.innerHTML = `
      <div class="col-span-full text-center text-gray-500 py-8">
        <i class="fas fa-images text-4xl mb-2"></i>
        <p>No images uploaded yet</p>
        <p class="text-sm mt-2">Upload images of your company premises or office</p>
      </div>
    `;
    return;
  }

  currentFirmImages.forEach((img, idx) => {
    const url = img.url;
    const id = img.id;
    const card = document.createElement('div');
    card.className = 'bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200';

    const wrapper = document.createElement('div');
    wrapper.className = 'relative';

    const image = document.createElement('img');
    image.className = 'w-full h-36 object-cover cursor-pointer';
    image.alt = img.original_filename || `Firm image ${idx+1}`;
    image.src = url || '';
    image.addEventListener('click', () => openImageModal(idx));
    wrapper.appendChild(image);

    const footer = document.createElement('div');
    footer.className = 'p-2 flex items-center justify-between';

    const left = document.createElement('div');

    const viewBtn = document.createElement('button');
    viewBtn.className = 'text-sm text-blue-600 underline mr-3';
    viewBtn.innerHTML = '<i class="fas fa-eye mr-1"></i>View';
    viewBtn.addEventListener('click', () => openImageModal(idx));

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'text-sm text-green-600 underline mr-3';
    downloadBtn.innerHTML = '<i class="fas fa-download mr-1"></i>Download';
    downloadBtn.addEventListener('click', () => {
      if(!url) return;
      window.open(url + (url.includes('?') ? '&download=true' : '?download=true'), '_blank');
    });

    left.appendChild(viewBtn);
    left.appendChild(downloadBtn);

    // delete OR replace if id present
    if(id){
      const editBtn = document.createElement('button');
      editBtn.className = 'text-sm text-yellow-600 underline mr-3';
      editBtn.innerHTML = '<i class="fas fa-edit mr-1"></i>Replace';
      editBtn.addEventListener('click', () => openReplaceImageDialog(id));

      const delBtn = document.createElement('button');
      delBtn.className = 'text-sm text-red-600 underline';
      delBtn.innerHTML = '<i class="fas fa-trash mr-1"></i>Delete';
      delBtn.addEventListener('click', async () => {
        const ok = await showConfirm('Delete image', 'Delete this image? This action cannot be undone.');
        if(!ok) return;
        await confirmAndDeleteImage(id);
      });

      left.appendChild(editBtn);
      left.appendChild(delBtn);
    } else {
      const delBtn = document.createElement('button');
      delBtn.className = 'text-sm text-red-600 underline';
      delBtn.innerHTML = '<i class="fas fa-trash mr-1"></i>Delete';
      delBtn.addEventListener('click', async () => {
        const ok = await showConfirm('Delete image', 'Delete this image?');
        if(!ok) return;
        try {
          await removeImageMetadataFromDb(userCode, { path: img.path, url: img.url });
          currentFirmImages = currentFirmImages.filter(it => !(it.url === img.url && it.path === img.path));
          renderFirmImages();
          renderLeftFirmVisual();
          showSuccess('Image removed');
        } catch(e) {
          console.error('delete local image error', e);
          showFail('Failed to delete image');
        }
      });
      left.appendChild(delBtn);
    }

    const right = document.createElement('div');
    right.className = 'text-xs text-gray-500 truncate';
    right.textContent = img.original_filename || '';

    footer.appendChild(left);
    footer.appendChild(right);
    card.appendChild(wrapper);
    card.appendChild(footer);
    list.appendChild(card);
  });
}

function renderLeftFirmVisual(){
  const wrapper = els.profileVisualWrapper;
  if(!wrapper) return;
  wrapper.innerHTML = '';
  if(!currentFirmImages.length){
    const img = document.createElement('img');
    img.id = 'profileImage';
    img.src = defaultProfileSvg();
    img.className = 'w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg mx-auto';
    wrapper.appendChild(img);
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'grid grid-cols-3 gap-1';
  const toShow = currentFirmImages.slice(0,3);
  toShow.forEach((it, idx) => {
    const thumb = document.createElement('img');
    thumb.src = it.url || '';
    thumb.alt = it.original_filename || 'firm';
    thumb.className = 'w-16 h-16 object-cover rounded-md cursor-pointer';
    thumb.addEventListener('click', () => openImageModal(idx));
    grid.appendChild(thumb);
  });
  wrapper.appendChild(grid);
}

/* ---------- upload images ---------- */
async function onFirmImagesSelected(evt){
  const files = Array.from(evt.target.files || []);
  if(!files.length) return;
  els.uploadFirmImageBtn.disabled = true;
  els.uploadFirmImageBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';
  els.firmImageUploadStatus.textContent = `Uploading ${files.length} image(s)...`;
  els.firmImageUploadStatus.className = 'text-yellow-500';

  if(els.firmImageProgress) els.firmImageProgress.classList.remove('hidden');
  if(els.firmImageProgressFill) els.firmImageProgressFill.style.width = '0%';
  if(els.firmImageProgressText) els.firmImageProgressText.textContent = '';

  const form = new FormData();
  form.append('user_code', userCode);
  for(const f of files) {
    if(!f.type.startsWith('image/')) {
      showSmallStatus(els.firmImageUploadStatus, `Not an image: ${f.name}`, 'error');
      els.uploadFirmImageBtn.disabled = false;
      els.firmImageUpload.value = '';
      if(els.firmImageProgress) els.firmImageProgress.classList.add('hidden');
      return;
    }
    if(f.size > 5_000_000) {
      showSmallStatus(els.firmImageUploadStatus, `File too big: ${f.name}`, 'error');
      els.uploadFirmImageBtn.disabled = false;
      els.firmImageUpload.value = '';
      if(els.firmImageProgress) els.firmImageProgress.classList.add('hidden');
      return;
    }
    form.append('images', f);
  }

  try {
    const res = await uploadWithProgress(`${FLASK_API_URL}/upload-images`, form, (loaded, total) => {
      const pct = Math.round((loaded/total)*100);
      if(els.firmImageProgressFill) els.firmImageProgressFill.style.width = pct + '%';
      if(els.firmImageProgressText) els.firmImageProgressText.textContent = `${pct}%`;
    });
    showSmallStatus(els.firmImageUploadStatus, res.message || 'Uploaded!', 'success');

    try { await saveImagesMetadataToDb(userCode, res); } catch(e){ console.warn('saveImagesMetadataToDb failed', e); }

    // reload list - best-effort
    await loadFirmImages(userCode);
    showSuccess('Firm images uploaded');
  } catch(err) {
    console.error('upload images error', err);
    let msg = 'Upload failed';
    if(err && err.body) msg = err.body.error || JSON.stringify(err.body);
    showSmallStatus(els.firmImageUploadStatus, msg, 'error');
    showFail(msg);
  } finally {
    els.uploadFirmImageBtn.disabled = false;
    els.uploadFirmImageBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Upload Images';
    els.firmImageUpload.value = '';
    setTimeout(()=> { if(els.firmImageProgress) els.firmImageProgress.classList.add('hidden'); if(els.firmImageProgressText) els.firmImageProgressText.textContent=''; }, 800);
  }
}

/* ---------- delete single image (by id) ---------- */
async function confirmAndDeleteImage(imageId){
  if(!imageId) return;
  try {
    const resp = await fetch(`${FLASK_API_URL}/firm-images/${encodeURIComponent(imageId)}`, { method: 'DELETE', credentials: 'omit' });
    if(!resp.ok) {
      const body = await resp.json().catch(()=>({error:`Status ${resp.status}`}));
      throw new Error(body.error || `Delete failed (${resp.status})`);
    }

    // Remove locally and update DB metadata (best-effort)
    currentFirmImages = currentFirmImages.filter(it => !(it.id && String(it.id) === String(imageId)));
    try { await removeImageMetadataFromDb(userCode, { id: imageId }); } catch(e){ console.warn('removeImageMetadataFromDb failed', e); }

    renderFirmImages();
    renderLeftFirmVisual();

    // if modal open and showing that image, move to next/close
    if(currentImageIndex >= 0) {
      if(currentFirmImages.length === 0) closeImageModal();
      else {
        const nextIndex = Math.min(currentImageIndex, currentFirmImages.length - 1);
        openImageModal(nextIndex);
      }
    }

    showSuccess('Image deleted');
  } catch(err) {
    console.error('delete image error', err);
    let msg = err && err.message ? err.message : 'Failed to delete';
    showFail(msg);
  }
}

/* ---------- replace single image ---------- */
function openReplaceImageDialog(imageId){
  const tmp = document.createElement('input');
  tmp.type = 'file';
  tmp.accept = 'image/*';
  tmp.addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if(!file) return;
    const ok = await showConfirm('Replace image', 'Replace this image with selected file?');
    if(!ok) return;
    await replaceSingleFirmImage(imageId, file);
  });
  tmp.click();
}

async function replaceSingleFirmImage(imageId, file){
  if(!imageId) return;
  if(els.firmImageProgress) els.firmImageProgress.classList.remove('hidden');
  if(els.firmImageProgressFill) els.firmImageProgressFill.style.width = '0%';
  try {
    const form = new FormData();
    form.append('image', file);
    const res = await uploadWithProgress(`${FLASK_API_URL}/firm-images/${encodeURIComponent(imageId)}`, form, (loaded, total) => {
      const pct = Math.round((loaded/total)*100);
      if(els.firmImageProgressFill) els.firmImageProgressFill.style.width = pct + '%';
      if(els.firmImageProgressText) els.firmImageProgressText.textContent = `${pct}%`;
    }, 'PUT');

    // refresh list
    await loadFirmImages(userCode);
    showSmallStatus(els.firmImageUploadStatus, res.message || 'Replaced image', 'success');
    showSuccess('Image replaced');
  } catch(err) {
    console.error('replace image error', err);
    showSmallStatus(els.firmImageUploadStatus, 'Replace failed', 'error');
    showFail('Replace image failed');
  } finally {
    setTimeout(()=> { if(els.firmImageProgress) els.firmImageProgress.classList.add('hidden'); if(els.firmImageProgressText) els.firmImageProgressText.textContent=''; }, 800);
  }
}

/* ---------- delete all images ---------- */
async function onDeleteAllFirmImages(){
  const ok = await showConfirm('Delete all images', 'Delete ALL firm images? This cannot be undone.');
  if(!ok) return;
  els.deleteAllFirmImagesBtn.disabled = true;
  els.deleteAllFirmImagesBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...';
  try {
    const resp = await fetch(`${FLASK_API_URL}/firm-images/user/${encodeURIComponent(userCode)}`, { method: 'DELETE', credentials: 'omit' });
    if(!resp.ok) {
      const body = await resp.json().catch(()=>({error:`Status ${resp.status}`}));
      throw new Error(body.error || `Delete failed (${resp.status})`);
    }
    await set(ref(db, `users/${userCode}/images`), null);
    await set(ref(db, `profile/${userCode}/images`), null);
    currentFirmImages = [];
    renderFirmImages();
    renderLeftFirmVisual();
    showSuccess('All images deleted');
  } catch(err) {
    console.error('delete all images error', err);
    showFail(err && err.message ? err.message : 'Delete all images failed');
  } finally {
    els.deleteAllFirmImagesBtn.disabled = false;
    els.deleteAllFirmImagesBtn.innerHTML = '<i class="fas fa-trash mr-2"></i>Delete All';
  }
}

/* ---------- image modal (slideshow) ---------- */
function openImageModal(index){
  if(!Array.isArray(currentFirmImages) || currentFirmImages.length === 0) return;
  currentImageIndex = index;
  const item = currentFirmImages[index];
  if(!item) return;
  showModal(els.imageModal, els.imageCloseBtn);
  if(els.imageModalImg) els.imageModalImg.src = item.url || '';
  if(els.imagePositionText) els.imagePositionText.textContent = `${index+1} / ${currentFirmImages.length}`;
  if(els.imageModalMeta) els.imageModalMeta.textContent = item.original_filename || '';
  if(els.imageDeleteBtn) {
    els.imageDeleteBtn.style.display = item.id ? 'inline-block' : 'none';
    els.imageDeleteBtn.onclick = async () => {
      if(!item.id) return showFail('Cannot delete this image');
      const ok = await showConfirm('Delete image', 'Delete this image?');
      if(!ok) return;
      await confirmAndDeleteImage(item.id);
    };
  }
  if(els.imageDownloadBtn) {
    els.imageDownloadBtn.onclick = () => {
      if(!item.url) return;
      window.open(item.url + (item.url.includes('?') ? '&download=true' : '?download=true'), '_blank');
    };
  }
  updateModalNavButtons();
}

function updateModalNavButtons(){
  if(!els.imagePrevBtn || !els.imageNextBtn) return;
  els.imagePrevBtn.disabled = (currentImageIndex <= 0);
  els.imageNextBtn.disabled = (currentImageIndex >= currentFirmImages.length - 1);
  els.imagePrevBtn.onclick = () => { if(currentImageIndex > 0) openImageModal(currentImageIndex - 1); };
  els.imageNextBtn.onclick = () => { if(currentImageIndex < currentFirmImages.length - 1) openImageModal(currentImageIndex + 1); };
  els.imageCloseBtn.onclick = closeImageModal;
  els.imageModal.querySelector('.modal-backdrop')?.addEventListener('click', closeImageModal);
  document.onkeydown = (e) => {
    if(els.imageModal && els.imageModal.classList.contains('modal-visible')) {
      if(e.key === 'ArrowLeft') { if(currentImageIndex > 0) openImageModal(currentImageIndex - 1); }
      if(e.key === 'ArrowRight') { if(currentImageIndex < currentFirmImages.length - 1) openImageModal(currentImageIndex + 1); }
      if(e.key === 'Escape') { closeImageModal(); }
    }
  };
}

function closeImageModal(){
  hideModal(els.imageModal);
  if(els.imageModalImg) els.imageModalImg.src = '';
  currentImageIndex = -1;
  document.onkeydown = null;
}

/* ---------- firm proof ---------- */
async function loadFirmProof(userCodeParam){
  try {
    const resp = await fetch(`${FLASK_API_URL}/firm-proof/${encodeURIComponent(userCodeParam)}`, { credentials: 'omit' });
    if(resp.status === 404){
      currentFirmProof = null;
      renderFirmProof();
      return;
    }
    if(!resp.ok) throw new Error(`Failed to fetch proof (${resp.status})`);
    currentFirmProof = await resp.json();
    renderFirmProof();
  } catch(err) {
    console.error('loadFirmProof', err);
    currentFirmProof = null;
    renderFirmProof();
  }
}

function renderFirmProof(){
  if(!els.firmProofDetails) return;
  if(!currentFirmProof){
    els.firmProofDetails.innerHTML = `
      <div class="text-center text-gray-500">
        <i class="fas fa-file-contract text-4xl mb-2"></i>
        <p>No proof of registration uploaded</p>
        <p class="text-sm mt-2">Upload your company registration document (PDF, DOC, or image)</p>
      </div>
    `;
    els.uploadFirmProofBtn?.classList.remove('hidden');
    els.updateFirmProofBtn?.classList.add('hidden');
    els.deleteFirmProofBtn?.classList.add('hidden');
    return;
  }

  const uploadedDate = currentFirmProof.uploaded_at ? fmtDate(currentFirmProof.uploaded_at) : 'Unknown';
  els.firmProofDetails.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <h4 class="font-semibold text-gray-800">${escapeHtml(currentFirmProof.original_filename || currentFirmProof.filename || 'Proof')}</h4>
        <p class="text-sm text-gray-600">Uploaded: ${uploadedDate}</p>
        <p class="text-sm text-gray-600">File type: ${escapeHtml(currentFirmProof.mime_type || '')}</p>
      </div>
      <div class="flex gap-2">
        <button id="view-proof-btn" class="bg-blue-500 text-white px-3 py-1 rounded text-sm"><i class="fas fa-eye mr-1"></i>View</button>
        <button id="download-proof-btn" class="bg-green-500 text-white px-3 py-1 rounded text-sm"><i class="fas fa-download mr-1"></i>Download</button>
      </div>
    </div>
  `;

  document.getElementById('view-proof-btn')?.addEventListener('click', () => {
    if(!currentFirmProof?.file_url) return;
    window.open(`${FLASK_API_URL}${currentFirmProof.file_url}`, '_blank');
  });
  document.getElementById('download-proof-btn')?.addEventListener('click', () => {
    if(!currentFirmProof?.file_url) return;
    window.open(`${FLASK_API_URL}${currentFirmProof.file_url}?download=true`, '_blank');
  });

  els.uploadFirmProofBtn?.classList.add('hidden');
  els.updateFirmProofBtn?.classList.remove('hidden');
  els.deleteFirmProofBtn?.classList.remove('hidden');
}

async function onFirmProofSelected(evt){
  const file = evt.target.files && evt.target.files[0];
  if(!file) return;
  const isUpdate = !!currentFirmProof?.id;
  const btn = isUpdate ? els.updateFirmProofBtn : els.uploadFirmProofBtn;

  const ok = await showConfirm(isUpdate ? 'Update proof' : 'Upload proof', isUpdate ? 'Replace existing proof?' : 'Upload selected proof?');
  if(!ok) return;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Uploading...';
  els.firmProofUploadStatus.textContent = 'Uploading proof...';
  els.firmProofUploadStatus.className = 'text-yellow-500';
  if(els.firmProofProgress) els.firmProofProgress.classList.remove('hidden');

  try {
    const form = new FormData();
    form.append('file', file);
    form.append('user_code', userCode);
    const url = (isUpdate && currentFirmProof?.id) ? `${FLASK_API_URL}/firm-proof/${encodeURIComponent(currentFirmProof.id)}` : `${FLASK_API_URL}/firm-proof`;
    const method = isUpdate ? 'PUT' : 'POST';

    const res = await uploadWithProgress(url, form, (loaded, total) => {
      const pct = Math.round((loaded/total)*100);
      if(els.firmProofProgressFill) els.firmProofProgressFill.style.width = pct + '%';
      if(els.firmProofProgressText) els.firmProofProgressText.textContent = `${pct}%`;
    }, method);

    els.firmProofUploadStatus.textContent = res.message || (isUpdate ? 'Updated' : 'Uploaded');
    els.firmProofUploadStatus.className = 'text-green-600';

    let meta = res;
    if(!meta || !meta.id) {
      try { meta = await (await fetch(`${FLASK_API_URL}/firm-proof/${encodeURIComponent(userCode)}`, { credentials: 'omit' })).json(); } catch(e){ console.warn('fallback fetch failed', e); }
    }
    if(meta) {
      currentFirmProof = meta;
      try { await saveProofMetaToDb(userCode, meta); } catch(e){ console.warn('saveProofMetaToDb failed', e); }
    }
    await loadFirmProof(userCode);
    showSuccess(isUpdate ? 'Proof updated' : 'Proof uploaded');
  } catch(err) {
    console.error('firm proof upload', err);
    let msg = 'Upload failed';
    if(err && err.body) msg = err.body.error || JSON.stringify(err.body);
    els.firmProofUploadStatus.textContent = msg;
    showFail(msg);
  } finally {
    btn.disabled = false;
    btn.innerHTML = isUpdate ? '<i class="fas fa-sync mr-2"></i>Update Proof' : '<i class="fas fa-upload mr-2"></i>Upload Proof';
    els.firmProofUpload.value = '';
    setTimeout(()=> { if(els.firmProofProgress) els.firmProofProgress.classList.add('hidden'); if(els.firmProofProgressText) els.firmProofProgressText.textContent=''; }, 800);
  }
}

async function onDeleteFirmProof(){
  if(!currentFirmProof) return;
  const ok = await showConfirm('Delete proof', 'Delete proof of registration?');
  if(!ok) return;
  els.deleteFirmProofBtn.disabled = true;
  els.deleteFirmProofBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Deleting...';
  try {
    const resp = await fetch(`${FLASK_API_URL}/firm-proof/${encodeURIComponent(currentFirmProof.id)}`, { method: 'DELETE', credentials: 'omit' });
    if(!resp.ok) throw new Error(`Delete failed (${resp.status})`);
    try { await saveProofMetaToDb(userCode, null); } catch(e){ console.warn('saveProofMetaToDb clear failed', e); }
    currentFirmProof = null;
    await loadFirmProof(userCode);
    showSuccess('Proof deleted');
  } catch(err) {
    console.error('deleteFirmProof', err);
    showFail(err && err.message ? err.message : 'Failed to delete proof');
  } finally {
    els.deleteFirmProofBtn.disabled = false;
    els.deleteFirmProofBtn.innerHTML = '<i class="fas fa-trash mr-2"></i>Delete Proof';
  }
}

/* ---------- account & password (uses firebase v8 for reauth flows) ---------- */
function wireAccountAndPasswordHandlers(){
  els.saveEmailBtn?.addEventListener('click', async () => {
    els.saveEmailBtn.disabled = true;
    els.emailStatus.textContent = 'Saving...';
    els.emailStatus.className = 'text-yellow-500';
    try {
      const newEmail = els.email.value.trim();
      const authUser = (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) || null;
      if(!authUser) throw new Error('Not authenticated (auth global missing)');
      if(newEmail && newEmail !== authUser.email){
        const pwd = prompt('Enter current password to change email:');
        if(!pwd) throw new Error('Password required');
        const cred = window.firebase.auth.EmailAuthProvider.credential(authUser.email, pwd);
        await authUser.reauthenticateWithCredential(cred);
        await authUser.updateEmail(newEmail);
        await update(ref(db, `profile/${userCode}`), { email: newEmail, updatedAt: new Date().toISOString() });
        showSmallStatus(els.emailStatus, 'Email updated', 'success');
        showSuccess('Email updated');
      } else {
        showSmallStatus(els.emailStatus, 'No changes', 'info');
      }
    } catch(err) {
      console.error('save email error', err);
      showSmallStatus(els.emailStatus, 'Error updating email', 'error');
      showFail('Failed to update email');
    } finally {
      els.saveEmailBtn.disabled = false;
    }
  });

  els.savePasswordBtn?.addEventListener('click', async () => {
    els.savePasswordBtn.disabled = true;
    els.passwordStatus.textContent = 'Processing...';
    els.passwordStatus.className = 'text-yellow-500';
    try {
      const current = els.currentPassword.value;
      const newPass = els.newPassword.value;
      const confirm = els.confirmNewPassword.value;
      if(!current) throw new Error('Current password required');
      if(!newPass) throw new Error('New password required');
      if(newPass !== confirm) throw new Error('Passwords do not match');
      if(newPass.length < 6) throw new Error('Password must be at least 6 chars');

      const authUser = (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) || null;
      if(!authUser) throw new Error('Not authenticated (auth global missing)');
      const cred = window.firebase.auth.EmailAuthProvider.credential(authUser.email, current);
      await authUser.reauthenticateWithCredential(cred);
      await authUser.updatePassword(newPass);
      await update(ref(db, `profile/${userCode}`), { updatedAt: new Date().toISOString() });
      showSmallStatus(els.passwordStatus, 'Password changed', 'success');
      showSuccess('Password changed');
      els.currentPassword.value = els.newPassword.value = els.confirmNewPassword.value = '';
    } catch(err) {
      console.error('password error', err);
      showSmallStatus(els.passwordStatus, err.message || 'Error changing password', 'error');
      showFail('Password change failed: ' + (err.message || ''));
    } finally {
      els.savePasswordBtn.disabled = false;
    }
  });
}

/* ---------- profile completion ---------- */
function checkProfileCompletion(profileData, userCategoryParam){
  if(!els.profileStatusCard) return;
  els.profileStatusCard.classList.remove('hidden');
  const personalReq = ['firstname','lastname','phone'];
  const roleReq = getRoleRequirements(userCategoryParam);
  const firmReq = (userCategoryParam || '').toString().toLowerCase().includes('firm') ? ['companyName','industry'] : [];

  const personalComplete = personalReq.every(k => (profileData && profileData[k]));
  const roleComplete = roleReq.length === 0 ? true : roleReq.every(k => (profileData && profileData[k]));
  const firmComplete = firmReq.length === 0 ? true : firmReq.every(k => (profileData && profileData[k]));

  let total = 2; let done = 0;
  if(personalComplete) done++;
  if(roleComplete) done++;
  if((userCategoryParam || '').toString().toLowerCase().includes('firm')){ total = 3; if(firmComplete) done++; }
  const percent = Math.round((done/total)*100) || 0;

  els.profileCompletion.innerHTML = `
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700">Profile Completion</span>
      <span class="text-sm font-semibold ${percent === 100 ? 'text-green-600' : 'text-blue-600'}">${percent}%</span>
    </div>
    <div class="w-full bg-gray-200 rounded-full h-2.5">
      <div class="h-2.5 rounded-full ${percent === 100 ? 'bg-green-600' : 'bg-blue-600'}" style="width: ${percent}%"></div>
    </div>
    <div class="mt-3 space-y-2 text-sm">
      <div class="flex items-center"><i class="fas ${personalComplete ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2"></i><span>Personal Information ${personalComplete ? 'Complete' : 'Incomplete'}</span></div>
      <div class="flex items-center"><i class="fas ${roleComplete ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2"></i><span>Role Information ${roleComplete ? 'Complete' : 'Incomplete'}</span></div>
      ${(userCategoryParam || '').toString().toLowerCase().includes('firm') ? `<div class="flex items-center"><i class="fas ${firmComplete ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2"></i><span>Company Information ${firmComplete ? 'Complete' : 'Incomplete'}</span></div>` : ''}
    </div>
  `;
}

function getRoleRequirements(userCategoryParam){
  const r = (userCategoryParam || '').toString().toLowerCase();
  if(r === 'student') return ['studentId'];
  if(r === 'lecture' || r === 'lecturer') return ['department'];
  if(r.includes('firm') || r === 'external_company') return ['industry','companyName'];
  if(r === 'coordinator') return ['faculty'];
  return [];
}

export {};