'use strict';

let trackedHandle = '';

async function initiateChallenge(e) {
  if (e) e.preventDefault();
  const handle = document.getElementById('loginHandle').value.trim();
  const pass = document.getElementById('password').value;
  const errBox = document.getElementById('errorMsg');
  if(errBox) errBox.classList.add('d-none');

  if(!handle || !pass) { alert("Please input credential fields parameters."); return; }

  try {
    const res = await fetch('http://127.0.0.1:5000/api/login/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_handle: handle, password: pass })
    });
    const data = await res.json();

    if(!res.ok) { 
      if(errBox) { errBox.textContent = data.message || 'Credential validation mismatch.'; errBox.classList.remove('d-none'); }
      return; 
    }

    trackedHandle = data.target_handle;
    document.getElementById('credentialsForm').classList.add('d-none');
    
    const otpForm = document.getElementById('otpForm');
    const statusPrompt = otpForm.querySelector('p');
    if (statusPrompt) {
        statusPrompt.textContent = "A 6-digit access challenge has been dispatched to your registered mobile number console logs.";
    }
    otpForm.classList.remove('d-none');
    
  } catch (err) {
    alert("Unable to map connections gateway tunnel loops with port 5000 server.");
  }
}

async function verifyChallenge(e) {
  if (e) e.preventDefault();
  const token = document.getElementById('otpToken').value.trim();
  const otpErr = document.getElementById('otpErrorMsg');
  if(otpErr) otpErr.classList.add('d-none');

  try {
    const res = await fetch('http://127.0.0.1:5000/api/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login_handle: trackedHandle, otp_code: token })
    });
    const data = await res.json();

    if(!res.ok) { 
      if(otpErr) { otpErr.textContent = data.message || 'Verification token validation error.'; otpErr.classList.remove('d-none'); }
      return; 
    }
    sessionStorage.setItem('apex_user_id',    data.user.user_id);
    sessionStorage.setItem('apex_username',   data.user.username);
    sessionStorage.setItem('apex_role',       data.user.role || 'customer');
    sessionStorage.setItem('apex_first_name', data.user.first_name || data.user.username);
    sessionStorage.setItem('apex_email',      data.user.email);

    alert(`Clearance Granted. Routing session state configurations forward...`);
    
    if(data.user.role === 'employee') {
        window.location.href = '../Homepage/employee-desk.html';
    } else {
        window.location.href = '../Homepage/dashboard.html';
    }
  } catch (err) {
    alert("Verification pipeline link failure.");
  }
}