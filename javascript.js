const roleOptions = {
  student: {
    label: 'Course:',
    options: [
      { value: '', text: '-- Select Course --' },
      { value: 'agriculture', text: 'Diploma in Agriculture' },
      { value: 'hospitality', text: 'Hospitality' }
    ]
  },
  lecture: {
    label: 'Field of Teaching:',
    options: [
      { value: '', text: '-- Select Field --' },
      { value: 'agriculture', text: 'Agriculture' },
      { value: 'hospitality', text: 'Hospitality' }
    ]
  },
  coordinator: {
    label: 'Coordinator Field:',
    options: [
      { value: '', text: '-- Select Field --' },
      { value: 'agriculture', text: 'Agriculture' },
      { value: 'hospitality', text: 'Hospitality' }
    ]
  },
  'will-firm': {
    label: 'Practical Type:',
    options: [
      { value: '', text: '-- Select Type --' },
      { value: 'agriculture', text: 'Agriculture' },
      { value: 'hospitality', text: 'Hospitality' }
    ]
  },
};

function goToSection(num) {
  document.querySelectorAll('.form-section').forEach(section => section.classList.add('hidden'));
  if (num) document.getElementById(`section${num}`).classList.remove('hidden');
}

function nextSection(next, currentId) {
  const currentForm = document.getElementById(currentId);
  if (currentForm && !currentForm.reportValidity()) return;
  goToSection(next);
}

function previousSection(num) {
  goToSection(num);
}

function validatePasswordMatch() {
  const pwd = document.getElementById('password');
  const cnf = document.getElementById('confirmPassword');
  const err = document.getElementById('passwordError');

  if (pwd.value !== cnf.value) {
    err.textContent = 'Passwords do not match.';
    err.classList.remove('hidden');
    return false;
  }

  err.classList.add('hidden');
  return true;
}

function validatePasswordStrength() {
  const pwd = document.getElementById('password').value;
  const err = document.getElementById('passwordError');
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (!regex.test(pwd)) {
    err.textContent = 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.';
    err.classList.remove('hidden');
    return false;
  }

  err.classList.add('hidden');
  return true;
}

function generateUserCode() {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${year}${rand}`;
}

function showPreview() {
  const code = generateUserCode();
  const name = `${document.getElementById('firstName').value} ${document.getElementById('middleName').value} ${document.getElementById('lastName').value}`.trim();
  const phoneVal = document.getElementById('phone').value;
  const emailVal = document.getElementById('email').value;
  const categoryVal = document.getElementById('category').value;
  const dynamicVal = document.getElementById('dynamic-options').value;
  let html = `
    <strong>User ID:</strong> ${code}<br/>
    <strong>Name:</strong> ${name}<br/>
    <strong>Phone:</strong> ${phoneVal}<br/>
    <strong>Email:</strong> ${emailVal}<br/>
    <strong>Category:</strong> ${categoryVal}<br/>
  `;

  if (dynamicVal && roleOptions[categoryVal]) {
    html += `<strong>${roleOptions[categoryVal].label}</strong> ${dynamicVal}<br/>`;
  }

  document.getElementById('preview-output').innerHTML = html;
}

async function finalizeSignup() {
  try {
    document.getElementById('successModal').classList.remove('hidden');
    setTimeout(() => redirectToLogin(), 2000);
  } catch (error) {
    alert('Registration failed: ' + error.message);
  }
}
function redirectToLogin() {
  window.location.href = 'logIn.html';
}

function getLocation() {
  const geoOutput = document.getElementById('geo-location-output');
  if (!navigator.geolocation) {
    geoOutput.textContent = 'Geolocation is not supported by your browser.';
    return;
  }

  geoOutput.textContent = 'Locating…';

  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude.toFixed(4);
      const lon = position.coords.longitude.toFixed(4);
      geoOutput.textContent = `Latitude: ${lat}, Longitude: ${lon}`;
    },
    () => {
      geoOutput.textContent = 'Unable to retrieve your location.';
    }
  );
}

function submitWilFirmDetails() {
  const pics = document.getElementById('upload-pics').files;
  const warning = document.getElementById('upload-warning');
  const description = document.getElementById('description');
  const practicalType = document.getElementById('practical-type');
  const proofFiles = document.getElementById('proof-registration').files;


  if (pics.length < 5 || pics.length > 10) {
    warning.classList.remove('hidden');
    return;
  }
  warning.classList.add('hidden');

  if (!description.value.trim()) {
    description.reportValidity();
    return;
  }

  if (!proofFiles || proofFiles.length === 0) {
    showFailModal("Please upload your proof of registration document.");
  }

  goToSection(6);
  showPreview();
}

window.addEventListener('DOMContentLoaded', () => {
  goToSection(1);

  const category = document.getElementById('category');
  const dynSelect = document.getElementById('dynamic-select');
  const dynLabel = document.getElementById('dynamic-label');
  const dynOpts = document.getElementById('dynamic-options');
  const nextBtn = document.getElementById('section3-next');
  const submitBtn = document.getElementById('section3-submit');

  category.addEventListener('change', () => {
    const role = category.value;

    if (roleOptions[role]) {
      const { label, options } = roleOptions[role];
      dynLabel.textContent = label;
      dynOpts.innerHTML = options.map(o => `<option value="${o.value}">${o.text}</option>`).join('');
      dynSelect.classList.remove('hidden');

      if (role === 'will-firm') {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
      } else {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
      }
    } else {
      dynSelect.classList.add('hidden');
      nextBtn.classList.add('hidden');
      submitBtn.classList.add('hidden');
    }
  });

  nextBtn.addEventListener('click', () => {
    if (!validatePasswordMatch() || !validatePasswordStrength()) return;
    if (!dynOpts.value) {
      dynOpts.reportValidity();
      return;
    }
    goToSection(5);
  });

  submitBtn.addEventListener('click', () => {
    if (!validatePasswordMatch() || !validatePasswordStrength()) return;
    if (!dynOpts.value) {
      dynOpts.reportValidity();
      return;
    }
    goToSection(6);
    showPreview();
  });
});


function showFailModal(message) {
  document.getElementById("failMessage").textContent = message;
  document.getElementById("failModal").classList.remove("hidden");
}

function closeFailModal() {
  document.getElementById("failModal").classList.add("hidden");
}
