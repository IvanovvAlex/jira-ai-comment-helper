document.addEventListener("DOMContentLoaded", () => {
  const keyInput = document.getElementById("key");
  const modelInput = document.getElementById("model");
  const saveBtn = document.getElementById("saveAll");
  const nameInput = document.getElementById("myName");

  // Load
  chrome.storage.sync.get(["OPENAI_KEY", "MODEL", "MY_NAME"], (v) => {
    keyInput.value = v.OPENAI_KEY || "";
    modelInput.value = v.MODEL || "gpt-5";
    nameInput.value = v.MY_NAME || nameInput.value || "Alex Ivanov";
  });

  // Save
  saveBtn.addEventListener("click", () => {
    chrome.storage.sync.set(
      {
        OPENAI_KEY: keyInput.value.trim(),
        MODEL: (modelInput.value || "gpt-5").trim(),
        MY_NAME: (nameInput.value || "Alex Ivanov").trim(),
      },
      () => alert("Saved ✔")
    );
  });
});
