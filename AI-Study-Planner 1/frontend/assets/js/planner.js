/* ==========================================================
                PLANNER JS
        Smart AI Study Planner
========================================================== */

/* ==========================================================
                PAGE LOADER
========================================================== */

window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (loader) {

        setTimeout(() => {

            loader.style.opacity = "0";
            loader.style.visibility = "hidden";

        }, 600);

    }

});

/* ==========================================================
                LOAD USER NAME
========================================================== */

const user = window.StudyPlanner.storage.read("studyPlannerUser", null);

if (user) {

    const dashboardUser = document.getElementById("dashboardUser");

    const studentName = document.getElementById("studentName");

    if (dashboardUser) {

        dashboardUser.textContent = user.fullName;

    }

    if (studentName) {

        studentName.value = user.fullName;

    }

}

/* ==========================================================
                AUTO SET TODAY DATE
========================================================== */

const startDate = document.getElementById("startDate");

if (startDate) {

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    startDate.value = today;

}

/* ==========================================================
                FORM ELEMENTS
========================================================== */

const plannerForm = document.getElementById("plannerForm");

const planOutput = document.getElementById("planOutput");
const escapeHtml = window.StudyPlanner.escapeHtml;
let planGenerated = false;

/* ==========================================================
                GENERATE AI PLAN
========================================================== */

if (plannerForm) {

    plannerForm.addEventListener("submit", function (e) {

        e.preventDefault();

        const name = document.getElementById("studentName").value.trim();

        const subject = document.getElementById("subject").value.trim();

        const goal = document.getElementById("studyGoal").value;

        const hours = document.getElementById("studyHours").value;

        const difficulty = document.getElementById("difficulty").value;

        const breakTime = document.getElementById("breakTime").value;

        const startDateValue = document.getElementById("startDate").value;

        const endDateValue = document.getElementById("endDate").value;

        if (!subject || !name || Number(hours) < 1 || Number(hours) > 12 || endDateValue < startDateValue) {

            window.StudyPlanner.notify("Check the name, subject, hours, and date range.", "error");

            return;

        }

        planOutput.innerHTML = `
        
        <div class="alert alert-success">

            <h4>Your study plan</h4>

            <hr>

            <p><strong>Student:</strong> ${escapeHtml(name)}</p>

            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>

            <p><strong>Goal:</strong> ${escapeHtml(goal)}</p>

            <p><strong>Study Time:</strong> ${escapeHtml(hours)} Hours / Day</p>

            <p><strong>Difficulty:</strong> ${escapeHtml(difficulty)}</p>

            <p><strong>Break:</strong> ${escapeHtml(breakTime)}</p>

            <p><strong>Schedule:</strong> ${escapeHtml(startDateValue)} to ${escapeHtml(endDateValue)}</p>

            <hr>

            <p><strong>Suggested routine:</strong> Split each study day into focused blocks with ${escapeHtml(breakTime)} breaks. Use the final block to review the topics covered.</p>
            <p class="mb-0"><small>This plan is generated locally from your inputs. No AI service is connected.</small></p>

        </div>

        `;

        planGenerated = true;
        window.StudyPlanner.notify("Your study plan is ready. This planner uses your inputs locally.");

    });

}

/* ==========================================================
                SAVE STUDY PLAN
========================================================== */

const savePlanBtn = document.getElementById("savePlan");

if (savePlanBtn) {

    savePlanBtn.addEventListener("click", () => {

        if (!planGenerated) {

            window.StudyPlanner.notify("Generate a study plan before saving it.", "error");

            return;

        }

        window.StudyPlanner.storage.write("savedStudyPlan", planOutput.innerText);
        window.StudyPlanner.notify("Study plan saved.");

    });

}

/* ==========================================================
                LOAD SAVED STUDY PLAN
========================================================== */

const savedPlan = window.StudyPlanner.storage.read("savedStudyPlan", "");

if (savedPlan) {

    planOutput.textContent = new DOMParser().parseFromString(savedPlan, "text/html").body.textContent;
    planGenerated = true;

}

/* ==========================================================
                DOWNLOAD STUDY PLAN
========================================================== */

const downloadBtn = document.getElementById("downloadPlan");

if (downloadBtn) {

    downloadBtn.addEventListener("click", () => {

        const content = planOutput.innerText;

        if (!planGenerated || !content.trim()) {

            window.StudyPlanner.notify("Generate a study plan before downloading it.", "error");

            return;

        }

        const blob = new Blob([content], { type: "text/plain" });

        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);

        link.download = "AI_Study_Plan.txt";

        link.click();

        URL.revokeObjectURL(link.href);

    });

}

/* ==========================================================
                AUTO SCROLL TO RESULT
========================================================== */

if (plannerForm) {

    plannerForm.addEventListener("submit", () => {

        setTimeout(() => {

            document.getElementById("planResult")
                .scrollIntoView({

                    behavior: "smooth"

                });

        }, 300);

    });

}

/* ==========================================================
                CHARACTER COUNTER (SUBJECT)
========================================================== */

const subjectInput = document.getElementById("subject");

if (subjectInput) {

    subjectInput.addEventListener("input", () => {

        console.log(
            `Subject Length: ${subjectInput.value.length}`
        );

    });

}

/* ==========================================================
                RESET FORM
========================================================== */

const resetBtn = document.createElement("button");

if (plannerForm) {

    resetBtn.type = "button";

    resetBtn.className = "btn btn-secondary btn-lg ms-3";

    resetBtn.innerHTML = `

        <i class="fa-solid fa-rotate-left"></i>

        Reset

    `;

    plannerForm.querySelector(".text-center").appendChild(resetBtn);

    resetBtn.addEventListener("click", () => {

        plannerForm.reset();

        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

        if (startDate) {

            startDate.value = today;

        }

        planOutput.innerHTML = `

            <div class="alert alert-info">

                <i class="fa-solid fa-circle-info"></i>

                Fill out the form above and click
                <strong>"Generate AI Study Plan"</strong>
                to see your personalized study schedule.

            </div>

        `;

        planGenerated = false;

    });

}

/* ==========================================================
                SAVE LAST FORM DATA
========================================================== */

plannerForm?.addEventListener("input", () => {

    const formData = {

        studentName: document.getElementById("studentName").value,

        subject: document.getElementById("subject").value,

        studyGoal: document.getElementById("studyGoal").value,

        studyHours: document.getElementById("studyHours").value,

        difficulty: document.getElementById("difficulty").value,

        breakTime: document.getElementById("breakTime").value,

        startDate: document.getElementById("startDate").value,

        endDate: document.getElementById("endDate").value

    };

    window.StudyPlanner.storage.write("plannerFormData", formData);

});

/* ==========================================================
                LOAD LAST FORM DATA
========================================================== */

const lastData = window.StudyPlanner.storage.read("plannerFormData", null);

if (lastData) {

    document.getElementById("studentName").value = lastData.studentName || "";

    document.getElementById("subject").value = lastData.subject || "";

    document.getElementById("studyGoal").value = lastData.studyGoal || "";

    document.getElementById("studyHours").value = lastData.studyHours || "";

    document.getElementById("difficulty").value = lastData.difficulty || "Easy";

    document.getElementById("breakTime").value = lastData.breakTime || "10 Minutes";

    document.getElementById("startDate").value = lastData.startDate || "";

    document.getElementById("endDate").value = lastData.endDate || "";

}

/* ==========================================================
                BUTTON ANIMATION
========================================================== */

document.querySelectorAll(".btn").forEach((button) => {

    button.addEventListener("click", function () {

        this.classList.add("active-btn");

        setTimeout(() => {

            this.classList.remove("active-btn");

        }, 200);

    });

});

/* ==========================================================
                AI GREETING
========================================================== */

const currentHour = new Date().getHours();

let greeting = "Hello";

if (currentHour < 12) {

    greeting = "🌅 Good Morning";

} else if (currentHour < 17) {

    greeting = "☀️ Good Afternoon";

} else {

    greeting = "🌙 Good Evening";

}

const plannerTitle = document.querySelector(".planner-content h1");

if (plannerTitle) {

    plannerTitle.innerHTML = `${greeting}, Welcome to Smart AI Study Planner`;

}

/* ==========================================================
                AUTO MIN END DATE
========================================================== */

const endDateInput = document.getElementById("endDate");

if (startDate && endDateInput) {

    endDateInput.min = startDate.value;

    startDate.addEventListener("change", () => {

        endDateInput.min = startDate.value;

    });

}

/* ==========================================================
                SUCCESS MESSAGE
========================================================== */

/* ==========================================================
                CONSOLE MESSAGE
========================================================== */

console.log("====================================");

console.log(" Smart AI Study Planner Loaded ");

console.log(" Developed by Team Smart AI Study Planner ");

console.log("====================================");