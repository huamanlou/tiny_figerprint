const checkKeys = ["useragent", "webgl", "canvas", "audio", "screen", "webrtc"];
// popup.js
document.addEventListener("DOMContentLoaded", function () {
  // 从 local 存储区域获取数据
  chrome.storage.local.get(["tiny_fingerprint_config"], function (res) {
    let config = res.tiny_fingerprint_config;
    // console.log("config", config);
    if (config) {
      document.getElementById("seed").value = config.seed;

      for (let key of checkKeys) {
        if (config[key]) {
          document.getElementById(key).checked = config[key] ? true : false;
        }
      }
    }
  });
  document.getElementById("unlock_seed").addEventListener("click", () => {
    document.getElementById("seed").removeAttribute("disabled");
  });
  document.getElementById("submit").addEventListener("click", () => {
    let config = {
      seed: document.getElementById("seed").value || "",
    };
    if (!seed) {
      alert("seed 非法");
      return;
    }
    config.seed = parseInt(config.seed);
    for (let key of checkKeys) {
      config[key] = document.getElementById(key).checked ? true : false;
    }
    // 存储数据到 local 存储区域
    chrome.storage.local.set(
      {
        tiny_fingerprint_config: config,
      },
      function () {
        // alert('保存成功')
        chrome.runtime.sendMessage(
          { greeting: "update_fingerprint" },
          function (response) {
            alert("保存成功");
          }
        );
      }
    );
  });
});
