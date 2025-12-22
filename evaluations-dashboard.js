// evaluations-dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";

/* ---------- Header with dropdown navigation ---------- */
const HEADER_HTML = `
<header class="bg-blue-600 text-white shadow">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button id="burgerBtn" class="p-2 rounded-md hover:bg-blue-700" aria-label="menu">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <div>
        <div id="headerTitle" class="font-semibold">Coordinator</div>
        <div id="headerSubtitle" class="text-sm text-blue-200">Coordinator Dashboard</div>
      </div>
    </div>

    <div class="flex items-center gap-4 header-actions">
      <!-- Navigate dropdown: single button toggles the list -->
      <div class="relative">
        <button id="navToggleBtn" class="px-3 py-1 rounded hover:bg-blue-700">Navigate ▾</button>
        <div id="navDropdown" class="nav-dropdown" style="right:0;">
          <a href="coordinator-dashboard.html">Dashboard</a>
          <a href="evaluations-dashboard.html" class="font-semibold">Evaluations</a>
          <a href="allocation.html">Allocation</a>
          <a href="profile.html">Profile</a>
        </div>
      </div>

      <!-- Profile dropdown -->
      <div class="relative">
        <button id="profileBtn" class="px-3 py-1 rounded hover:bg-blue-700">Account ▾</button>
        <div id="profileDropdown" class="nav-dropdown" style="right:0;">
          <a href="profile.html">My profile</a>
          <a href="settings.html">Settings</a>
          <a href="#" id="logoutLink">Logout</a>
        </div>
      </div>

      <!-- Mobile dropdown (used by burger) -->
      <div id="mobileDropdown" class="nav-dropdown" style="right:0; left:auto;">
        <a href="coordinator-dashboard.html">Dashboard</a>
        <a href="evaluations-dashboard.html">Evaluations</a>
        <a href="allocation.html">Allocation</a>
        <a href="profile.html">Profile</a>
        <a href="#" id="logoutLinkMobile">Logout</a>
      </div>
    </div>
  </div>
</header>
`;

/* ---------- FIREBASE CONFIG ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBgqE8lMevET8qRWOVMBZ-wTWi_2T5c8Uw",
  authDomain: "login-wil-47477.firebaseapp.com",
  projectId: "login-wil-47477",
  storageBucket: "login-wil-47477.appspot.com",
  messagingSenderId: "457032791224",
  appId: "1:457032791224:web:9dacb0d6a5658466e3304d",
  databaseURL: "https://login-wil-47477-default-rtdb.firebaseio.com"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* ---------- Inject header and wire dropdowns/navigation ---------- */
(function injectHeaderAndWire() {
  const top = document.getElementById('topHeader');
  if (!top) return;
  top.innerHTML = HEADER_HTML;

  if (window.feather) feather.replace();

  const burgerBtn = document.getElementById('burgerBtn');
  const mobileDropdown = document.getElementById('mobileDropdown');
  const navToggleBtn = document.getElementById('navToggleBtn');
  const navDropdown = document.getElementById('navDropdown');
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  const logoutLink = document.getElementById('logoutLink');
  const logoutLinkMobile = document.getElementById('logoutLinkMobile');

  function closeAllDropdowns() {
    mobileDropdown?.classList.remove('open');
    navDropdown?.classList.remove('open');
    profileDropdown?.classList.remove('open');
  }

  // Burger toggles mobile dropdown
  burgerBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    mobileDropdown.classList.toggle('open');
    navDropdown?.classList.remove('open');
    profileDropdown?.classList.remove('open');
  });

  // Nav toggle (desktop)
  navToggleBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    navDropdown.classList.toggle('open');
    mobileDropdown?.classList.remove('open');
    profileDropdown?.classList.remove('open');
  });

  // Profile dropdown
  profileBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    profileDropdown.classList.toggle('open');
    navDropdown?.classList.remove('open');
    mobileDropdown?.classList.remove('open');
  });

  // close when clicking outside
  document.addEventListener('click', (ev) => {
    const tgt = ev.target;
    if (!navToggleBtn?.contains(tgt) && !navDropdown?.contains(tgt)) navDropdown?.classList.remove('open');
    if (!profileBtn?.contains(tgt) && !profileDropdown?.contains(tgt)) profileDropdown?.classList.remove('open');
    if (!burgerBtn?.contains(tgt) && !mobileDropdown?.contains(tgt)) mobileDropdown?.classList.remove('open');
  });

  // wire logout
  const doLogout = () => {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('userCode');
    window.location.href = 'logIn.html';
  };
  logoutLink?.addEventListener('click', (ev) => { ev.preventDefault(); doLogout(); });
  logoutLinkMobile?.addEventListener('click', (ev) => { ev.preventDefault(); doLogout(); });

  // close dropdown when a nav link is clicked
  navDropdown?.querySelectorAll('a')?.forEach(a => a.addEventListener('click', () => closeAllDropdowns()));
  mobileDropdown?.querySelectorAll('a')?.forEach(a => a.addEventListener('click', () => closeAllDropdowns()));

  // fallback logout element in page
  const fallbackLogout = document.getElementById('logoutBtnFallback') || document.querySelector('[data-logout]');
  if (fallbackLogout) {
    fallbackLogout.classList.remove('hidden');
    fallbackLogout.addEventListener('click', doLogout);
  }
})();

/* ---------- DOM references for evaluation logic ---------- */
const els = {
  dynamicFieldBadge: document.getElementById('dynamicFieldBadge'),
  monthDisplay: document.getElementById('monthDisplay'),
  prevMonthBtn: document.getElementById('prevMonthBtn'),
  nextMonthBtn: document.getElementById('nextMonthBtn'),
  statsRow: document.getElementById('statsRow'),
  dashboardTable: document.getElementById('dashboardTable'),
  welcome: document.getElementById('welcome'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modalTitle'),
  modalBody: document.getElementById('modalBody'),
  modalClose: document.getElementById('modalClose')
};

/* ---------- STATE ---------- */
const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
if (!currentUser) {
  window.location.href = 'logIn.html';
  throw new Error('No currentUser — redirecting');
}
const dynamicField = currentUser.dynamicField || currentUser.userCode;
if (els.dynamicFieldBadge) els.dynamicFieldBadge.textContent = dynamicField || '—';

if (currentUser.firstname || currentUser.name) {
  const nameText = `${currentUser.firstname || currentUser.name || ''}`.trim();
  const coordTop = document.getElementById('headerTitle');
  const coordSub = document.getElementById('headerSubtitle');
  if (coordTop) coordTop.textContent = (currentUser.role || 'Coordinator').toString();
  if (coordSub) coordSub.textContent = `Coordinator: ${nameText}`;
  if (els.welcome) els.welcome.textContent = `Coordinator: ${nameText}`;
} else {
  if (els.welcome) els.welcome.textContent = `Coordinator`;
}

let months = [];
let currentMonthIndex = 0;
let evaluations = [];
const studentCache = {};
const competencyFields = ['qualityWork','responsibility','theoreticalKnowledge','practicalSkills','motivation','communication','humanRelations','punctuality','initiative','reportWriting'];

function escapeHtml(s=''){ return String(s || '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function formatDate(iso){ if(!iso) return '—'; const d = new Date(iso); return isNaN(d.getTime()) ? iso : d.toLocaleString(); }
function humanize(k){ return k ? k.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : k; }

/* ---------- FETCH MONTHS ---------- */
async function loadMonths(){
  try {
    const snap = await get(ref(db, `evaluations/${dynamicField}`));
    if (!snap.exists()) { months = []; currentMonthIndex = -1; return; }
    const val = snap.val();
    months = Object.keys(val || []);
    const monthOrder = { January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12 };
    months.sort((a,b) => {
      const ai = monthOrder[a] ?? 0, bi = monthOrder[b] ?? 0;
      if (ai && bi) return ai - bi;
      if (ai && !bi) return -1;
      if (!ai && bi) return 1;
      return a.localeCompare(b);
    });
    currentMonthIndex = Math.max(0, months.length - 1);
  } catch (err) {
    console.error('loadMonths error', err);
    months = []; currentMonthIndex = -1;
  }
}

/* ---------- LOAD EVALUATIONS FOR SELECTED MONTH ---------- */
async function loadEvaluationsForCurrentMonth(){
  evaluations = [];
  if (!months.length || currentMonthIndex < 0) {
    renderEmpty();
    return;
  }
  const month = months[currentMonthIndex];
  if (els.monthDisplay) els.monthDisplay.textContent = month || '—';

  try {
    const snap = await get(ref(db, `evaluations/${dynamicField}/${month}`));
    if (!snap.exists()) { renderEmpty(); return; }
    const data = snap.val();

    for (const [studentId, studentNode] of Object.entries(data || {})){
      if (!studentCache[studentId]) {
        try {
          const userSnap = await get(ref(db, `users/${studentId}`));
          studentCache[studentId] = userSnap.exists() ? userSnap.val() : { firstname: '', lastname: '' };
        } catch (e) {
          studentCache[studentId] = { firstname: '', lastname: '' };
        }
      }
      const studentName = `${studentCache[studentId].firstname || ''} ${studentCache[studentId].lastname || ''}`.trim() || studentId;

      for (const [pushId, evalData] of Object.entries(studentNode || {})){
        const comps = evalData.competencies || {};
        evaluations.push({
          assignmentNumber: evalData.assignmentNumber ?? evalData.assignment ?? '—',
          studentId,
          studentName,
          firmName: evalData.firmName ?? evalData.firm ?? '—',
          evaluatorName: evalData.evaluatorName ?? evalData.evaluator ?? '—',
          overallRating: evalData.overallRating ?? '—',
          comments: evalData.comments ?? evalData.text ?? '',
          competencies: comps,
          createdAt: evalData.createdAt ?? evalData.dates?.evaluationDate ?? '',
          raw: evalData
        });
      }
    }

    evaluations.sort((a,b) => {
      const an = Number(a.assignmentNumber) || 0;
      const bn = Number(b.assignmentNumber) || 0;
      if (an && bn && an !== bn) return an - bn;
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });

    renderTableAndStats();

  } catch (err) {
    console.error('loadEvaluations error', err);
    renderEmpty();
  }
}

/* ---------- RENDER ---------- */
function renderEmpty(){
  const colspan = 7 + competencyFields.length;
  if (els.dashboardTable) els.dashboardTable.innerHTML = `<tr><td class="p-4" colspan="${colspan}">No evaluations for this month.</td></tr>`;
  if (els.statsRow) els.statsRow.innerHTML = `<div class="bg-white p-3 rounded shadow-sm">Month: <strong>${months[currentMonthIndex] ?? '—'}</strong></div>`;
}

function renderTableAndStats(){
  const rowsHtml = evaluations.map(ev => {
    const compTds = competencyFields.map(k => `<td class="p-2 align-top">${escapeHtml(ev.competencies[k] ?? '—')}</td>`).join('');
    return `
      <tr class="bg-white">
        <td class="p-2 align-top">${escapeHtml(ev.assignmentNumber)}</td>
        <td class="p-2 align-top">${escapeHtml(ev.studentName)}</td>
        <td class="p-2 align-top">${escapeHtml(ev.studentId)}</td>
        <td class="p-2 align-top">${escapeHtml(ev.firmName)}</td>
        <td class="p-2 align-top">${escapeHtml(ev.evaluatorName)}</td>
        <td class="p-2 align-top font-medium">${escapeHtml(ev.overallRating)}</td>
        <td class="p-2 align-top">${escapeHtml(ev.comments)}</td>
        ${compTds}
        <td class="p-2 align-top">${formatDate(ev.createdAt)}</td>
      </tr>
    `;
  });

  if (els.dashboardTable) els.dashboardTable.innerHTML = rowsHtml.length ? rowsHtml.join('') : `<tr><td class="p-4" colspan="${7 + competencyFields.length}">No evaluations for this month.</td></tr>`;

  const avgOverall = evaluations.length ? evaluations.reduce((s, e) => s + (Number(e.overallRating) || 0), 0) / evaluations.length : null;
  const avgText = avgOverall !== null ? avgOverall.toFixed(2) : '—';
  const studentsCount = new Set(evaluations.map(e => e.studentId)).size;
  const evalCount = evaluations.length;

  if (els.statsRow) els.statsRow.innerHTML = `
    <div class="bg-white p-3 rounded shadow-sm">Month: <strong>${months[currentMonthIndex] ?? '—'}</strong></div>
    <div class="bg-white p-3 rounded shadow-sm">Evaluations: <strong>${evalCount}</strong></div>
    <div class="bg-white p-3 rounded shadow-sm">Distinct students: <strong>${studentsCount}</strong></div>
    <div class="bg-white p-3 rounded shadow-sm">Avg Overall: <strong>${avgText}</strong></div>
  `;
}

/* ---------- NAV BUTTONS ---------- */
if (els.prevMonthBtn) els.prevMonthBtn.addEventListener('click', async () => {
  if (!months.length) return;
  currentMonthIndex = Math.max(0, currentMonthIndex - 1);
  await loadEvaluationsForCurrentMonth();
  updateButtons();
});
if (els.nextMonthBtn) els.nextMonthBtn.addEventListener('click', async () => {
  if (!months.length) return;
  currentMonthIndex = Math.min(months.length - 1, currentMonthIndex + 1);
  await loadEvaluationsForCurrentMonth();
  updateButtons();
});
function updateButtons(){
  if (els.prevMonthBtn) els.prevMonthBtn.disabled = currentMonthIndex <= 0;
  if (els.nextMonthBtn) els.nextMonthBtn.disabled = currentMonthIndex >= months.length - 1;
}

/* ---------- MODAL ---------- */
if (els.modalClose) els.modalClose.addEventListener('click', ()=> {
  const m = document.getElementById('modal');
  if (m) m.classList.add('hidden');
});
window.showEvaluationModal = (ev) => {
  const html = `
    <div><strong>Assignment:</strong> ${escapeHtml(ev.assignmentNumber)}</div>
    <div><strong>Student:</strong> ${escapeHtml(ev.studentName)} (${escapeHtml(ev.studentId)})</div>
    <div><strong>Firm:</strong> ${escapeHtml(ev.firmName)}</div>
    <div><strong>Evaluator:</strong> ${escapeHtml(ev.evaluatorName)}</div>
    <div><strong>Overall rating:</strong> ${escapeHtml(ev.overallRating)}</div>
    <div class="mt-2"><strong>Comments:</strong><div class="mt-1 p-2 bg-gray-50 rounded">${escapeHtml(ev.comments)}</div></div>
    <div class="mt-3"><strong>Competencies:</strong>${competencyHtml(ev.competencies)}</div>
  `;
  if (els.modalBody) els.modalBody.innerHTML = html;
  if (els.modalTitle) els.modalTitle.textContent = `Evaluation — ${escapeHtml(ev.assignmentNumber || '')}`;
  const modalEl = document.getElementById('modal');
  if (modalEl) modalEl.classList.remove('hidden');
};

function competencyHtml(comps){
  if(!comps || !Object.keys(comps).length) return '<div class="text-sm text-slate-500">No competencies</div>';
  return `<table class="w-full text-sm border-collapse mt-2">
    <thead><tr class="bg-gray-100"><th class="p-2 text-left">Competency</th><th class="p-2 text-left">Rating</th></tr></thead>
    <tbody>${Object.entries(comps).map(([k,v])=>`<tr><td class="p-2 border">${escapeHtml(humanize(k))}</td><td class="p-2 border">${escapeHtml(String(v))}</td></tr>`).join('')}</tbody>
  </table>`;
}

/* ---------- BOOTSTRAP ---------- */
(async function bootstrap(){
  await loadMonths();
  if (!months.length) {
    if (els.monthDisplay) els.monthDisplay.textContent = 'No months';
    renderEmpty();
    updateButtons();
    return;
  }
  await loadEvaluationsForCurrentMonth();
  updateButtons();

  if (window.feather) feather.replace();
})();

/* ---------- clicking a row to open modal ---------- */
const tableEl = document.getElementById('dashboardTable');
if (tableEl) {
  tableEl.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const idx = Array.from(tr.parentNode.children).indexOf(tr);
    if (idx < 0 || idx >= evaluations.length) return;
    const ev = evaluations[idx];
    if (ev) window.showEvaluationModal(ev);
  });
}
