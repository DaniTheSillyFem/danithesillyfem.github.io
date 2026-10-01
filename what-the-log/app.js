/*
 * WhatTheLog
 * Android error analyzer
 *
 * This is the initial analyzer.
 * Error definitions will eventually move into the database.
 */

const logInput = document.getElementById("log-input");
const analyzeButton = document.getElementById("analyze-button");
const clearButton = document.getElementById("clear-button");
const characterCount = document.getElementById("character-count");

const result = document.getElementById("result");
const noResult = document.getElementById("no-result");

const resultTitle = document.getElementById("result-title");
const resultSeverity = document.getElementById("result-severity");
const resultComponent = document.getElementById("result-component");
const resultCategory = document.getElementById("result-category");
const resultDescription = document.getElementById("result-description");
const resultCauses = document.getElementById("result-causes");
const resultChecks = document.getElementById("result-checks");


/* =========================================================
   Temporary error database
   ========================================================= */

const errors = [
    {
        id: "java-null-pointer",
        name: "NullPointerException",
        component: "Android Runtime / Application",
        category: "Java",
        severity: "fatal",

        signatures: [
            "java.lang.NullPointerException",
            "NullPointerException"
        ],

        description:
            "The application attempted to use an object reference that was null. " +
            "In practice, this usually means some code expected an object to exist " +
            "but it had not been initialized or was unavailable.",

        causes: [
            "An object was never initialized.",
            "A method returned null unexpectedly.",
            "A required Android component was unavailable.",
            "Application code did not handle a null value."
        ],

        checks: [
            "Read the stack trace and find the first line belonging to the application.",
            "Check the referenced source line for a null object.",
            "Look at the preceding calls in the stack trace for where the value came from."
        ]
    },

    {
        id: "selinux-avc-denied",
        name: "SELinux access denial",
        component: "SELinux",
        category: "Security",
        severity: "error",

        signatures: [
            "avc: denied"
        ],

        description:
            "SELinux blocked an operation because the security policy does not " +
            "allow the requesting domain to perform that operation on the target.",

        causes: [
            "A required SELinux rule is missing.",
            "A process is running in an unexpected SELinux domain.",
            "A file, property, socket, or service has an unexpected security context.",
            "A vendor or framework modification introduced a policy mismatch."
        ],

        checks: [
            "Capture the complete AVC denial rather than only the first line.",
            "Check the source and target SELinux contexts.",
            "Check whether the denial occurs on a stock or modified system.",
            "Inspect the relevant vendor and device SELinux policy."
        ]
    },

    {
        id: "linker-library-not-found",
        name: "Native library not found",
        component: "Dynamic Linker",
        category: "Native",
        severity: "fatal",

        signatures: [
            "library \"",
            "cannot locate symbol",
            "CANNOT LINK EXECUTABLE"
        ],

        description:
            "A native executable or shared library could not be loaded because " +
            "a required shared library or symbol was unavailable or incompatible.",

        causes: [
            "A required .so file is missing.",
            "The library exists but is in an unexpected location.",
            "The library ABI does not match the caller.",
            "A required symbol is missing from the loaded library."
        ],

        checks: [
            "Check the complete linker error for the missing library or symbol.",
            "Verify that the required .so exists on the device.",
            "Compare the library against the corresponding vendor/framework version.",
            "Check the architecture and ABI of the involved binaries."
        ]
    },

    {
        id: "ims-service-timeout",
        name: "IMS service timeout",
        component: "IMS / Telephony",
        category: "Telephony",
        severity: "error",

        signatures: [
            "ImsService not up yet",
            "ImsService.*timeout"
        ],

        description:
            "The Android framework attempted to communicate with the IMS service, " +
            "but the service was not available within the expected time.",

        causes: [
            "The IMS service failed to start.",
            "The vendor IMS implementation is missing or incompatible.",
            "Framework and vendor IMS components do not match.",
            "Carrier configuration is preventing IMS from becoming available."
        ],

        checks: [
            "Run dumpsys ims and inspect the current IMS service state.",
            "Search logcat for additional IMS-related errors.",
            "Check whether the device has a working vendor IMS implementation.",
            "Inspect the carrier configuration relevant to IMS."
        ]
    }
];


/* =========================================================
   Utility functions
   ========================================================= */

/**
 * Escape text before inserting it into HTML.
 *
 * This matters because logs are user-provided input.
 */
function escapeHtml(text) {
    const element = document.createElement("div");
    element.textContent = text;
    return element.innerHTML;
}


/**
 * Check whether an error signature exists in the supplied log.
 *
 * Plain strings use a case-insensitive substring search.
 * Signatures containing regex syntax can use a RegExp instead.
 */
function matchesSignature(log, signature) {
    if (signature instanceof RegExp) {
        return signature.test(log);
    }

    return log.toLowerCase().includes(signature.toLowerCase());
}


/* =========================================================
   Analyzer
   ========================================================= */

function analyzeLog(log) {
    const normalizedLog = log.trim();

    if (!normalizedLog) {
        return null;
    }

    for (const error of errors) {
        for (const signature of error.signatures) {
            if (matchesSignature(normalizedLog, signature)) {
                return error;
            }
        }
    }

    return null;
}


/* =========================================================
   Result rendering
   ========================================================= */

function renderList(element, items) {
    element.replaceChildren();

    for (const item of items) {
        const li = document.createElement("li");
        li.textContent = item;
        element.appendChild(li);
    }
}


function showResult(error) {
    resultTitle.textContent = error.name;
    resultSeverity.textContent = error.severity;
    resultComponent.textContent = error.component;
    resultCategory.textContent = error.category;
    resultDescription.textContent = error.description;

    renderList(resultCauses, error.causes);
    renderList(resultChecks, error.checks);

    result.hidden = false;
    noResult.hidden = true;

    result.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function showNoResult() {
    result.hidden = true;
    noResult.hidden = false;

    noResult.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   Character counter
   ========================================================= */

function updateCharacterCount() {
    const count = logInput.value.length;

    characterCount.textContent =
        `${count.toLocaleString()} character${count === 1 ? "" : "s"}`;
}

logInput.addEventListener("input", updateCharacterCount);


/* =========================================================
   Analyze button
   ========================================================= */

analyzeButton.addEventListener("click", () => {
    const error = analyzeLog(logInput.value);

    if (error) {
        showResult(error);
    } else {
        showNoResult();
    }
});


/* =========================================================
   Clear button
   ========================================================= */

clearButton.addEventListener("click", () => {
    logInput.value = "";

    updateCharacterCount();

    result.hidden = true;
    noResult.hidden = true;

    logInput.focus();
});


/* =========================================================
   Keyboard shortcuts
   ========================================================= */

logInput.addEventListener("keydown", (event) => {
    /*
     * Ctrl + Enter / Cmd + Enter
     * Analyze the current log.
     */
    if (
        event.key === "Enter" &&
        (event.ctrlKey || event.metaKey)
    ) {
        event.preventDefault();
        analyzeButton.click();
    }
});


/* =========================================================
   Initial state
   ========================================================= */

updateCharacterCount();
