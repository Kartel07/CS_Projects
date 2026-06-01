'use strict';

function validateForm(){
    const firstname = document.getElementById("firstName").value.trim();
    const lastname = document.getElementById("lastName").value.trim();
    const dateOfBirth = document.getElementById("dateOfBirth").value;
    const gender = document.getElementById("gender").value;
    const mobileNumber = document.getElementById("mobileNumber").value.trim();
    const email = document.getElementById("email").value.trim();
    const phoneRegex = /^[6-9]\d{9}$/;

    if(!firstname || !lastname || !dateOfBirth || !gender || !mobileNumber || !email) { alert("All profile registration items are required."); return false; }
    if(!phoneRegex.test(mobileNumber)) { alert("Please input a valid standard 10-digit Indian mobile number."); return false; }
    return true;
}

document.getElementById("nextPage").addEventListener("click", () => {
    if(validateForm() === true){
        sessionStorage.setItem("reg_firstName", document.getElementById("firstName").value.trim());
        sessionStorage.setItem("reg_lastName", document.getElementById("lastName").value.trim());
        sessionStorage.setItem("reg_dob", document.getElementById("dateOfBirth").value);
        sessionStorage.setItem("reg_gender", document.getElementById("gender").value);
        sessionStorage.setItem("reg_phone", document.getElementById("mobileNumber").value.trim());
        sessionStorage.setItem("reg_email", document.getElementById("email").value.trim());
        window.location.href = "register-address.html";
    }
});

window.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("reg_firstName")) {
        document.getElementById("firstName").value = sessionStorage.getItem("reg_firstName");
        document.getElementById("lastName").value = sessionStorage.getItem("reg_lastName");
        document.getElementById("dateOfBirth").value = sessionStorage.getItem("reg_dob");
        document.getElementById("gender").value = sessionStorage.getItem("reg_gender");
        document.getElementById("mobileNumber").value = sessionStorage.getItem("reg_phone");
        document.getElementById("email").value = sessionStorage.getItem("reg_email");
    }
});