/*=========================================
        REGISTER PAGE
=========================================*/

const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const form = document.getElementById("registerForm");
const submit = document.getElementById("registerSubmit");
const status = document.getElementById("registerStatus");
const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
let submitting = false;

[fullName, email, password, confirmPassword].forEach(field => {
    field.addEventListener("input", () => {
        field.removeAttribute("aria-invalid");
        status.textContent = "";
    });
});

togglePassword?.addEventListener("click", () => {
    const visible = password.type === "password";
    password.type = visible ? "text" : "password";
    togglePassword.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    togglePassword.setAttribute("aria-pressed", String(visible));
    const icon = togglePassword.querySelector("i");
    if (icon) icon.className = `fa-solid ${visible ? "fa-eye-slash" : "fa-eye"}`;
});

form?.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting) return;
    status.textContent = "";

    const nameValue = fullName.value.trim();
    const emailValue = email.value.trim();
    let invalidField = null;
    let validationMessage = "";

    if (nameValue.length < 2 || nameValue.length > 100) {
        invalidField = fullName;
        validationMessage = "Enter your full name (2 to 100 characters).";
    } else if (!emailValue || !email.validity.valid) {
        invalidField = email;
        validationMessage = "Enter a valid email address.";
    } else if (!password.value) {
        invalidField = password;
        validationMessage = "Enter a password.";
    } else if (password.value.length < 8) {
        invalidField = password;
        validationMessage = "Your password must be at least 8 characters.";
    } else if (new TextEncoder().encode(password.value).length > 72) {
        invalidField = password;
        validationMessage = "Your password must be no more than 72 bytes.";
    } else if (!confirmPassword.value) {
        invalidField = confirmPassword;
        validationMessage = "Confirm your password.";
    }

    if (invalidField) {
        status.textContent = validationMessage;
        invalidField.setAttribute("aria-invalid", "true");
        invalidField.focus();
        return;
    }

    if (password.value !== confirmPassword.value) {
        status.textContent = "Passwords do not match.";
        confirmPassword.setAttribute("aria-invalid", "true");
        confirmPassword.focus();
        return;
    }

    submitting = true;
    submit.disabled = true;
    submit.setAttribute("aria-busy", "true");
    submit.textContent = "Creating account…";
    try {
        await window.StudyPlannerAuth.request("register.php", {
            fullName: nameValue,
            email: emailValue,
            password: password.value
        });
        window.location.replace("login.html?registered=1");
    } catch (error) {
        status.textContent = error.message;
        submitting = false;
        submit.disabled = false;
        submit.removeAttribute("aria-busy");
        submit.textContent = "Register";
    }
});

window.StudyPlannerAuth.session().then(result => {
    if (result.authenticated) window.location.replace("dashboard.html");
}).catch(error => {
    status.textContent = error.message;
});