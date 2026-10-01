/*
 * WhatTheLog
 * Android error analyzer
 * The analyzer loads error definitions from the JSON knowledge base.
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
Knowledge base
========================================================= */

let errors = [];

/**

* Load the error database from JSON.
  */
  async function loadKnowledgeBase() {
  try {
  const response = await fetch("./data/errors/errors.json");

  ```
   if (!response.ok) {
       throw new Error(
           `Knowledge base returned HTTP ${response.status}`
       );
   }

   const data = await response.json();

   if (!Array.isArray(data)) {
       throw new Error("Knowledge base is not an array");
   }

   errors = data;

   analyzeButton.disabled = false;
  ```

  } catch (error) {
  console.error("Failed to load WhatTheLog knowledge base:", error);

  ```
   analyzeButton.disabled = true;
   analyzeButton.textContent = "Database error";
  ```

  }
  }

/* =========================================================
Signature matching
========================================================= */

/**

* Check whether an error signature matches the supplied log.
*
* Supported signature types:
*
* text
* regex
  */
  function matchesSignature(log, signature) {
  if (!signature || !signature.type) {
  return false;
  }

```
if (signature.type === "text") {
```

```
    return log.toLowerCase().includes(
        String(signature.value).toLowerCase()
    );
}

if (signature.type === "regex") {
    try {
        const regex = new RegExp(signature.value, "i");
        return regex.test(log);
    } catch (error) {
        console.error(
            "Invalid regex signature:",
            signature.value,
            error
        );

        return false;
    }
}

return false;
```

}

/* =========================================================
Analyzer
========================================================= */

function analyzeLog(log) {
const normalizedLog = log.trim();

```
if (!normalizedLog) {
    return null;
}

for (const error of errors) {
    for (const signature of error.signatures || []) {
        if (matchesSignature(normalizedLog, signature)) {
            return error;
        }
    }
}

return null;
```

}

/* =========================================================
Result rendering
========================================================= */

function renderList(element, items = []) {
element.replaceChildren();

```
for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    element.appendChild(li);
}
```

}

function showResult(error) {
resultTitle.textContent = error.name;
resultSeverity.textContent = error.severity;
resultComponent.textContent = error.component;
resultCategory.textContent = error.category;
resultDescription.textContent = error.description;

```
renderList(resultCauses, error.causes);
renderList(resultChecks, error.checks);

result.hidden = false;
noResult.hidden = true;

result.scrollIntoView({
    behavior: "smooth",
    block: "start"
});
```

}

function showNoResult() {
result.hidden = true;
noResult.hidden = false;

```
noResult.scrollIntoView({
    behavior: "smooth",
    block: "start"
});
```

}

/* =========================================================
Character counter
========================================================= */

function updateCharacterCount() {
const count = logInput.value.length;

```
characterCount.textContent =
    `${count.toLocaleString()} character${count === 1 ? "" : "s"}`;
```

}

logInput.addEventListener("input", updateCharacterCount);

/* =========================================================
Analyze button
========================================================= */

analyzeButton.addEventListener("click", () => {
const error = analyzeLog(logInput.value);

```
if (error) {
    showResult(error);
} else {
    showNoResult();
}
```

});

/* =========================================================
Clear button
========================================================= */

clearButton.addEventListener("click", () => {
logInput.value = "";

```
updateCharacterCount();

result.hidden = true;
noResult.hidden = true;

logInput.focus();
```

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

analyzeButton.disabled = true;
updateCharacterCount();
loadKnowledgeBase();
