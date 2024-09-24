// popup.js
document.addEventListener("DOMContentLoaded", function () {
  // Add your popup logic here
  document.getElementById("submit").addEventListener("click", () => {
    chrome.runtime.sendMessage(
      { greeting: "update_fingerprint" },
      function (response) {
        alert("保存成功");
      }
    );
  });
});
