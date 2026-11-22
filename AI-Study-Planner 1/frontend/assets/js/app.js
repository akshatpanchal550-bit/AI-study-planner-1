/*=========================================================
    SMART AI STUDY PLANNER
    app.js
=========================================================*/

(() => {

/*=========================
        PAGE LOADER
=========================*/

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (loader) {

        loader.style.opacity = "0";

        setTimeout(() => {

            loader.style.display = "none";

        }, 500);

    }

});

/*=========================
        AOS
=========================*/

if (typeof AOS !== "undefined") {

    AOS.init({

        duration: 1000,
        once: true,
        easing: "ease-in-out"

    });

}

/*=========================
      STICKY NAVBAR
=========================*/

const navbar = document.querySelector(".custom-navbar");

window.addEventListener("scroll", () => {

    if (!navbar) return;

    if (window.scrollY > 80) {

        navbar.classList.add("sticky");

    } else {

        navbar.classList.remove("sticky");

    }

});

/*=========================
      SCROLL TO TOP
=========================*/

const scrollBtn = document.getElementById("scrollTop");

window.addEventListener("scroll", () => {

    if (!scrollBtn) return;

    if (window.scrollY > 400) {

        scrollBtn.style.display = "flex";

    } else {

        scrollBtn.style.display = "none";

    }

});

if (scrollBtn) {

    scrollBtn.addEventListener("click", () => {

        window.scrollTo({

            top: 0,
            behavior: "smooth"

        });

    });

}

/*=========================
     ACTIVE NAVBAR LINK
=========================*/

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {

    let current = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 120;

        if (window.pageYOffset >= sectionTop) {

            current = section.getAttribute("id");

        }

    });

    navLinks.forEach(link => {

        link.classList.remove("active");
        link.removeAttribute("aria-current");

        if (link.getAttribute("href") === "#" + current) {

            link.classList.add("active");
            link.setAttribute("aria-current", "location");

        }

    });

});

/*=========================
      SMOOTH SCROLL
=========================*/

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

    anchor.addEventListener("click", function (e) {

        const href = this.getAttribute("href");
        const target = href && href.length > 1
            ? document.getElementById(decodeURIComponent(href.slice(1)))
            : null;
        if (!target) return;

        e.preventDefault();
        window.history.pushState(null, "", href);
        const navHeight = navbar?.getBoundingClientRect().height || 0;
        const top = window.scrollY + target.getBoundingClientRect().top - navHeight - 12;
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? "auto" : "smooth" });
        if (this.classList.contains("nav-link")) {
            navLinks.forEach(link => {
                link.classList.toggle("active", link === this);
                if (link === this) link.setAttribute("aria-current", "location");
                else link.removeAttribute("aria-current");
            });
        }

        const menu = document.getElementById("navbarNav");
        const toggler = document.querySelector(".navbar-toggler");
        if (menu?.classList.contains("show")) {
            if (typeof bootstrap !== "undefined" && bootstrap.Collapse) {
                bootstrap.Collapse.getOrCreateInstance(menu).hide();
            } else {
                menu.classList.remove("show");
                toggler?.setAttribute("aria-expanded", "false");
            }
        } else if (menu?.classList.contains("collapsing") && typeof bootstrap !== "undefined" && bootstrap.Collapse) {
            menu.addEventListener("shown.bs.collapse", () => {
                bootstrap.Collapse.getOrCreateInstance(menu).hide();
            }, { once: true });
        }

    });

});

/*=========================
        COUNTER
=========================*/

const counters = document.querySelectorAll(".stat-card h2");
const speed = 200;

const counterObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            const counter = entry.target;

            const updateCounter = () => {

                const target = +counter.dataset.count;

                const current = +counter.innerText.replace(/\D/g, "");

                const increment = Math.ceil(target / speed);

                if (current < target) {

                    counter.innerText = current + increment;

                    setTimeout(updateCounter, 10);

                } else {

                    counter.innerText = target + "+";

                }

            };

            updateCounter();

            counterObserver.unobserve(counter);

        }

    });

});

counters.forEach(counter => {

    counterObserver.observe(counter);

});

/*=========================
      BUTTON RIPPLE EFFECT
=========================*/

document.querySelectorAll(".btn").forEach(button => {

    button.addEventListener("click", function (e) {

        const circle = document.createElement("span");

        const diameter = Math.max(this.clientWidth, this.clientHeight);

        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;

        circle.style.left = `${e.clientX - this.offsetLeft - radius}px`;

        circle.style.top = `${e.clientY - this.offsetTop - radius}px`;

        circle.classList.add("ripple");

        const ripple = this.querySelector(".ripple");

        if (ripple) ripple.remove();

        this.appendChild(circle);

    });

});

/*=========================
    DASHBOARD CARD EFFECT
=========================*/

document.querySelectorAll(".dashboard-card").forEach(card => {

    card.addEventListener("mouseenter", () => {

        card.style.transform = "translateY(-8px)";

        card.style.transition = "0.3s";

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform = "translateY(0px)";

    });

});

/*=========================
      FEATURE CARD EFFECT
=========================*/

document.querySelectorAll(".feature-card").forEach(card => {

    card.addEventListener("mousemove", (e) => {

        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;

        const y = e.clientY - rect.top;

        card.style.background = `
        radial-gradient(
            circle at ${x}px ${y}px,
            rgba(37,99,235,.30),
            rgba(255,255,255,.05)
        )`;

    });

    card.addEventListener("mouseleave", () => {

        card.style.background = "";

    });

});

/*=========================
        NEWSLETTER
=========================*/

const newsletter = document.querySelector(".newsletter-form");

if (newsletter) {

    newsletter.addEventListener("submit", (e) => {

        e.preventDefault();

        showFormMessage(newsletter, "Newsletter signup is not configured. Your email was not sent or saved.");

    });

}

/*=========================
        CONTACT FORM
=========================*/

const contactForm = document.querySelector(".contact-form form");

if (contactForm) {

    contactForm.addEventListener("submit", (e) => {

        e.preventDefault();

        showFormMessage(contactForm, "Contact is not configured. Your message was not sent.");

    });

}

function showFormMessage(form, message) {
    let status = form.querySelector("[data-form-status]");
    if (!status) {
        status = document.createElement("p");
        status.dataset.formStatus = "true";
        status.className = "form-status mt-3 mb-0";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        form.append(status);
    }
    status.textContent = message;
}

/*=========================
        FOOTER YEAR
=========================*/

const year = document.getElementById("year");

if (year) {

    year.innerHTML = new Date().getFullYear();

}

/*=========================
      DARK / LIGHT THEME
=========================*/

const themeToggle = document.getElementById("themeToggle");

const body = document.body;

const savedTheme = localStorage.getItem("theme");

if (savedTheme) {

    body.setAttribute("data-theme", savedTheme);

    if (themeToggle) {

        themeToggle.innerHTML =
            savedTheme === "light"
                ? '<i class="fa-solid fa-sun"></i>'
                : '<i class="fa-solid fa-moon"></i>';

    }

}

if (themeToggle && !document.querySelector(".sidebar")) {

    themeToggle.addEventListener("click", () => {

        let currentTheme = body.getAttribute("data-theme");

        if (currentTheme === "light") {

            body.setAttribute("data-theme", "dark");

            localStorage.setItem("theme", "dark");

            themeToggle.innerHTML =
                '<i class="fa-solid fa-moon"></i>';

        } else {

            body.setAttribute("data-theme", "light");

            localStorage.setItem("theme", "light");

            themeToggle.innerHTML =
                '<i class="fa-solid fa-sun"></i>';

        }

    });

}

console.log("✅ Smart AI Study Planner Loaded Successfully");

/*=========================================================
        TOAST NOTIFICATION
=========================================================*/

function showToast(message, type = "success") {

    const toast = document.createElement("div");

    toast.className = `toast-box${type === "error" ? " error" : ""}`;

    toast.innerHTML = `
        <i class="fa-solid ${type === "error" ? "fa-circle-exclamation" : "fa-circle-check"}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("show");

    }, 100);

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3000);

}

/*=========================================================
        POMODORO TIMER
=========================================================*/

let minutes = 25;
let seconds = 0;
let timer = null;

const min = document.getElementById("minutes");
const sec = document.getElementById("seconds");
const userId = document.querySelector('meta[name="study-user-id"]')?.content;
const sessionsKey = userId ? `studyPlanner:user:${userId}:studySessions` : "studySessions";

function updateTimer() {

    if (min) min.textContent = String(minutes).padStart(2, "0");
    if (sec) sec.textContent = String(seconds).padStart(2, "0");

}

function startPomodoro() {

    if (timer || (minutes === 0 && seconds === 0)) return;

    timer = setInterval(() => {

        if (minutes === 0 && seconds === 1) {
            seconds = 0;
            clearInterval(timer);
            timer = null;
            updateTimer();
            const completedAt = new Date();
            try {
                const saved = localStorage.getItem(sessionsKey);
                const sessions = saved ? JSON.parse(saved) : [];
                if (!Array.isArray(sessions)) throw new Error("Saved focus sessions are not a list.");
                sessions.push({
                    id: String(Date.now()),
                    minutes: 25,
                    date: `${completedAt.getFullYear()}-${String(completedAt.getMonth() + 1).padStart(2, "0")}-${String(completedAt.getDate()).padStart(2, "0")}`,
                    completedAt: completedAt.toISOString()
                });
                localStorage.setItem(sessionsKey, JSON.stringify(sessions));
                showToast("Focus session completed and saved.");
            } catch (error) {
                console.error("Unable to save the completed focus session.", error);
                showToast("Focus session completed, but it could not be saved.", "error");
            }
            return;
        }

        if (seconds === 0) {

            minutes--;
            seconds = 59;

        } else {

            seconds--;

        }

        updateTimer();

    }, 1000);

}

const startBtn = document.getElementById("startTimer");

if (startBtn) {

    startBtn.addEventListener("click", startPomodoro);

}

const resetBtn = document.getElementById("resetTimer");

if (resetBtn) {

    resetBtn.addEventListener("click", () => {

        clearInterval(timer);
        timer = null;

        minutes = 25;
        seconds = 0;

        updateTimer();

    });

}

updateTimer();

/*=========================================================
        AI BUTTON EFFECT
=========================================================*/

const aiButton = document.querySelector(".ai-btn");

if (aiButton) {

    setInterval(() => {

        aiButton.classList.toggle("pulse");

    }, 1200);

}

/*=========================================================
        AI STUDY TIPS
=========================================================*/

const tips = [

    "Study 45 minutes then take a 10 minute break.",
    "Revise difficult subjects first.",
    "Practice coding daily.",
    "Stay hydrated while studying.",
    "Review your notes before sleeping."

];

const tip = document.getElementById("aiTip");

if (tip) {

    setInterval(() => {

        const random = Math.floor(Math.random() * tips.length);

        tip.textContent = tips[random];

    }, 5000);

}

/*=========================================================
        GLASS CARD EFFECT
=========================================================*/

document.querySelectorAll(".glass-card").forEach(card => {

    card.addEventListener("mouseenter", () => {

        card.style.transform = "translateY(-8px)";
        card.style.transition = "0.3s";

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform = "translateY(0)";

    });

});

/*=========================================================
        PAGE READY
=========================================================*/

console.log("%cSmart AI Study Planner Ready 🚀",
    "color:#22c55e;font-size:18px;font-weight:bold;");

})();