/*=========================================
        LOGIN PAGE
=========================================*/

// Show / Hide Password
const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("loginPassword");

if (togglePassword && password) {

    togglePassword.addEventListener("click", () => {

        if (password.type === "password") {

            password.type = "text";
            togglePassword.innerHTML =
                '<i class="fa-solid fa-eye-slash"></i>';
            togglePassword.setAttribute("aria-label", "Hide password");
            togglePassword.setAttribute("aria-pressed", "true");

        } else {

            password.type = "password";
            togglePassword.innerHTML =
                '<i class="fa-solid fa-eye"></i>';
            togglePassword.setAttribute("aria-label", "Show password");
            togglePassword.setAttribute("aria-pressed", "false");

        }

    });

}

// Login Form
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("loginEmail");
const emailFeedback = document.getElementById("loginEmailError");
const passwordFeedback = document.getElementById("loginPasswordError");
const loginSubmit = document.getElementById("loginSubmit");
const loginStatus = document.getElementById("loginStatus");

function updateFieldError(field, feedback, message) {

    const invalid = Boolean(message);
    field.classList.toggle("is-invalid", invalid);
    field.setAttribute("aria-invalid", String(invalid));
    feedback.textContent = message;
    feedback.hidden = !invalid;
    return !invalid;

}

function validateEmail() {

    if (!emailInput.value.trim()) return "Enter your email address.";
    if (!emailInput.validity.valid) return "Enter a valid email address.";
    return "";

}

function validatePassword() {

    return password.value ? "" : "Enter your password.";

}

emailInput.addEventListener("blur", () => {

    updateFieldError(emailInput, emailFeedback, validateEmail());

});

password.addEventListener("blur", () => {

    updateFieldError(password, passwordFeedback, validatePassword());

});

loginForm.addEventListener("input", event => {

    if (event.target === emailInput && emailInput.classList.contains("is-invalid")) {
        updateFieldError(emailInput, emailFeedback, validateEmail());
    }

    if (event.target === password && password.classList.contains("is-invalid")) {
        updateFieldError(password, passwordFeedback, validatePassword());
    }

    if (loginStatus) loginStatus.textContent = "";

});

const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const forgotPasswordHelp = document.getElementById("forgotPasswordHelp");

if (forgotPasswordLink && forgotPasswordHelp) {

    forgotPasswordLink.addEventListener("click", event => {
        event.preventDefault();
        const expanded = forgotPasswordLink.getAttribute("aria-expanded") === "true";
        forgotPasswordLink.setAttribute("aria-expanded", String(!expanded));
        forgotPasswordHelp.hidden = expanded;
    });

}

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = emailInput.value.trim();

        const pass = password.value;

        const emailValid = updateFieldError(emailInput, emailFeedback, validateEmail());
        const passwordValid = updateFieldError(password, passwordFeedback, validatePassword());

        if (!emailValid || !passwordValid) {

            loginStatus.textContent = "Review the highlighted fields to continue.";
            (emailValid ? password : emailInput).focus();
            return;

        }

        if (loginSubmit.disabled) return;

        loginSubmit.disabled = true;
        loginSubmit.setAttribute("aria-busy", "true");
        loginSubmit.querySelector("[data-submit-label]").textContent = "Signing in…";
        loginSubmit.querySelector(".login-spinner").hidden = false;
        loginSubmit.querySelector(".login-spinner").setAttribute("aria-hidden", "false");
        loginStatus.textContent = "Signing in…";

        try {
            await window.StudyPlannerAuth.request("login.php", {
                email,
                password: pass,
                remember: document.getElementById("remember").checked
            });
            const remember = document.getElementById("remember").checked;
            if (remember) localStorage.setItem("userEmail", email);
            else localStorage.removeItem("userEmail");
            window.location.replace("dashboard.html");
        } catch (error) {
            loginStatus.textContent = error.message;
            loginSubmit.disabled = false;
            loginSubmit.removeAttribute("aria-busy");
            loginSubmit.querySelector("[data-submit-label]").textContent = "Sign in";
            loginSubmit.querySelector(".login-spinner").hidden = true;
            loginSubmit.querySelector(".login-spinner").setAttribute("aria-hidden", "true");
        }

    });

}

// Remember Email
window.addEventListener("load", () => {

    const email = localStorage.getItem("userEmail");

    if (email) {

        document.getElementById("loginEmail").value = email;
        document.getElementById("remember").checked = true;

    }

});

window.StudyPlannerAuth.session().then(result => {
    if (result.authenticated) window.location.replace("dashboard.html");
}).catch(error => {
    loginStatus.textContent = error.message;
});
