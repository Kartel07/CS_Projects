'use strict';

function showAlert(id, msg) {
  ['errorMsg','successMsg'].forEach(i => { const el = document.getElementById(i); if(el) { el.classList.add('d-none'); el.textContent = ''; } });
  const el = document.getElementById(id); if(el) { el.textContent = msg; el.classList.remove('d-none'); }
}

async function submitRegistration() {
  const username = document.getElementById('userID').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const accountType = document.getElementById('accountType').value;

  if(!username || !password || !confirmPassword || !accountType) { showAlert('errorMsg', 'All fields are mandatory.'); return; }
  if(password.length < 8) { showAlert('errorMsg', 'Password must be at least 8 characters.'); return; }
  if(password !== confirmPassword) { showAlert('errorMsg', 'Password confirmation entries mismatch.'); return; }

  // Locate inside your submitRegistration() block in script-account.js and update:
const payload = {
  personal: {
    first_name: sessionStorage.getItem('reg_firstName'),
    last_name:  sessionStorage.getItem('reg_lastName'),
    email:      sessionStorage.getItem('reg_email'),
    phone:      sessionStorage.getItem('reg_phone'),
    dob:        sessionStorage.getItem('reg_dob'),
    kyc_type:   sessionStorage.getItem('reg_kycType'),
    kyc_number: sessionStorage.getItem('reg_kycNumber')
  },
  address: {
    street:  sessionStorage.getItem('reg_street'),
    city:    sessionStorage.getItem('reg_city'),
    state:   sessionStorage.getItem('reg_state'),
    zip:     sessionStorage.getItem('reg_zip'),
    country: sessionStorage.getItem('reg_country')
  },
  account: { 
    username: username, 
    account_type: accountType, 
    password: password 
  }
};

  const btn = document.getElementById('submitBtn'); btn.disabled = true; btn.textContent = 'Verifying Data...';

  try {
    const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if(!res.ok) { showAlert('errorMsg', data.message || 'Registration rejected.'); btn.disabled = false; btn.textContent = 'Submit Portfolio'; return; }

    showAlert('successMsg', 'Account line initialized cleanly inside database. Redirecting...');
    sessionStorage.clear();
    setTimeout(() => { window.location.href = '../Login/login.html'; }, 2000);
  } catch (err) {
    showAlert('errorMsg', 'Unable to reach backend gateway pipeline connection points.');
    btn.disabled = false; btn.textContent = 'Submit Portfolio';
  }
}