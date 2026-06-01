'use strict';

function adaptKYCPlaceholder(type) {
    document.getElementById('kycNumber').placeholder = type === 'PAN' ? 'ABCDE1234F' : '12-Digit Numeric Sequence';
}

function validateForm(){
    const kycType = document.getElementById("kycType").value;
    const kycNum = document.getElementById("kycNumber").value.toUpperCase().replace(/\s+/g, '');
    const address = document.getElementById("residentialAddress").value.trim();
    const city = document.getElementById("city").value.trim();
    const state = document.getElementById("state").value.trim();
    const country = document.getElementById("country").value.trim();
    const pincode = document.getElementById("pincode").value.trim();

    if(!kycNum || !address || !city || !state || !country || !pincode) { alert("All verification criteria inputs are mandatory."); return false; }
    if(kycType === 'PAN' && !/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(kycNum)) { alert("Incorrect matching PAN Card formatting layout configuration."); return false; }
    if(kycType === 'AADHAAR' && !/^\d{12}$/.test(kycNum)) { alert("Incorrect layout parameter. Aadhaar requires a 12 digit numeric sequence."); return false; }
    return true;
}

document.getElementById("nextPage").addEventListener("click", () => {
    if(validateForm() === true){
        sessionStorage.setItem("reg_kycType", document.getElementById("kycType").value);
        sessionStorage.setItem("reg_kycNumber", document.getElementById("kycNumber").value.toUpperCase().replace(/\s+/g, ''));
        sessionStorage.setItem("reg_street", document.getElementById("residentialAddress").value.trim());
        sessionStorage.setItem("reg_city", document.getElementById("city").value.trim());
        sessionStorage.setItem("reg_state", document.getElementById("state").value.trim());
        sessionStorage.setItem("reg_country", document.getElementById("country").value.trim());
        sessionStorage.setItem("reg_zip", document.getElementById("pincode").value.trim());
        window.location.href = "register-account.html";
    }
});

document.getElementById("previousPage").addEventListener("click", () => { window.location.href = "register.html"; });