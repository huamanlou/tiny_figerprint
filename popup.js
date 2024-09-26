// popup.js
document.addEventListener("DOMContentLoaded", function () {
  // 从 local 存储区域获取数据
  chrome.storage.local.get(["tiny_fingerprint_seed"], function (res) {
    document.getElementById("seed").value = res.tiny_fingerprint_seed;
  });
  // Add your popup logic here
  document.getElementById("submit").addEventListener("click", () => {
    tiny_fingerprint_seed = document.getElementById("seed").value || "";
    // 存储数据到 local 存储区域
    chrome.storage.local.set(
      {
        tiny_fingerprint_seed: tiny_fingerprint_seed,
      },
      function () {
        // alert('保存成功')
        chrome.runtime.sendMessage(
          { greeting: "update_fingerprint" },
          function (response) {
            alert("生成成功");
          }
        );
      }
    );
  });
});
