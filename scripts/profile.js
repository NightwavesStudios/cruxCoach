/* Export Local Storage Function */
function exportLocalStorage() {
  const keysToSave = [
    "grades",
    "trainingData",
    "traits",
    "accountInfo",
    "journalData",
  ]; // Include journalData

  // Include any other keys ending in "Grades"
  Object.keys(localStorage).forEach((key) => {
    if (key.endsWith("Grades") && !keysToSave.includes(key)) {
      keysToSave.push(key);
    }
  });

  const exportData = {
    _meta: {
      source: "cruxcoach",
      version: 1,
      timestamp: new Date().toISOString(),
    },
  };

  keysToSave.forEach((key) => {
    try {
      exportData[key] = JSON.parse(localStorage.getItem(key));
    } catch (err) {
      console.warn(`Could not parse key "${key}":`, err);
    }
  });

  const saveString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([saveString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "cruxcoach_data.json";
  a.click();
  URL.revokeObjectURL(url);

  console.log("Exported localStorage:", exportData);
}

/* Import Local Storage Function */
function importLocalStorage() {
  const fileInput = document.getElementById("importFileInput");
  if (!fileInput.files.length) {
    alert("No file selected.");
    return;
  }

  const file = fileInput.files[0];

  // File size check (~1MB)
  if (file.size > 1024 * 1024) {
    alert("File too large. Max 1MB allowed.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const importedData = JSON.parse(event.target.result);

      // Validate metadata
      if (!importedData._meta || importedData._meta.source !== "cruxcoach") {
        alert("Invalid or unsupported file.");
        return;
      }

      // Backup all current keys
      const backup = {};
      Object.keys(localStorage).forEach((key) => {
        backup[key] = localStorage.getItem(key);
      });
      localStorage.setItem("backup_data", JSON.stringify(backup));

      // Confirm before overwriting
      const confirmed = confirm(
        "This will overwrite your current data. Proceed?"
      );
      if (!confirmed) return;

      // Clear localStorage before importing
      Object.keys(localStorage).forEach((key) => {
        if (key !== "backup_data") {
          localStorage.removeItem(key);
        }
      });

      // Restore all keys from the imported data
      let importedCount = 0;
      Object.entries(importedData).forEach(([key, value]) => {
        if (key === "_meta") return; // Skip metadata
        try {
          // Simple validation: only store if it's serializable JSON
          const test = JSON.stringify(value);
          localStorage.setItem(key, test);
          importedCount++;
        } catch (err) {
          console.warn(`Skipping invalid key "${key}":`, err);
        }
      });

      alert(`Import complete (${importedCount} key(s) loaded). Refreshing.`);
      location.reload();
    } catch (e) {
      alert("Error reading save file.");
      console.error(e);
    }
  };

  reader.readAsText(file);
}

/* Backup Data Restoration */
function restoreBackup() {
  const backupRaw = localStorage.getItem("backup_data");

  Object.keys(localStorage).forEach((key) => {
    if (key !== "backup_data") {
      localStorage.removeItem(key);
    }
  });

  if (!backupRaw) {
    alert("No backup data found.");
    return;
  }

  let backupData;
  try {
    backupData = JSON.parse(backupRaw);
  } catch (err) {
    alert("Backup data is corrupted.");
    console.error("Failed to parse backup:", err);
    return;
  }

  const confirmed = confirm(
    "Restore backup? This will overwrite your current data."
  );
  if (!confirmed) return;

  let restoredCount = 0;
  Object.entries(backupData).forEach(([key, value]) => {
    try {
      localStorage.setItem(key, value);
      restoredCount++;
    } catch (err) {
      console.warn(`Failed to restore key "${key}":`, err);
    }
  });

  alert(`Backup restored (${restoredCount} key(s)). Reloading...`);
  location.reload();
}

/* Hide Backup Button if No Backup Exists */
window.addEventListener("DOMContentLoaded", () => {
  const backup = localStorage.getItem("backup_data");
  if (!backup) {
    document.getElementById("restoreButton").style.display = "none";
  } else {
    document.getElementById("restoreButton").style.display = "inline-block";
  }
});

/* Display Profile Data */
document.getElementById("usernameDisplay").textContent = accountInfo.username;
document.getElementById("emailDisplay").textContent = accountInfo.email;
document.getElementById("joinDateDisplay").textContent = accountInfo.joinDate;

/* Update Profile Data */
document
  .getElementById("accountInfoForm")
  .addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameInput = document.getElementById("username").value.trim();
    const emailInput = document.getElementById("email").value.trim();

    if (usernameInput || emailInput) {
    } else {
      alert("Please fill out all fields.");
      return;
    }

    accountInfo.username = usernameInput;
    accountInfo.email = emailInput;

    saveToStorage("accountInfo", accountInfo);

    document.getElementById("usernameDisplay").textContent =
      accountInfo.username;
    document.getElementById("emailDisplay").textContent = accountInfo.email;

    alert("Account information updated successfully!");
  });
