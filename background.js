import * as EQUIPMENT from "./utils/equipment.js";
import * as BASE from "./utils/base.js";
// import modifyFingerPrint from "./utils/inject.js";

const UA_NET_RULE_ID = 1;

/**
 * 生成最大32位的种子
 */
const genRandomSeed = function () {
  return Math.floor(Math.random() * Math.pow(2, 32));
};
const refreshRequestHeaderUA = async () => {
  try {
    let res = await chrome.storage.local.get(["tiny_fingerprint_seed"]);
    let seed = res.tiny_fingerprint_seed;
    console.log("seed: ", seed);
    if (!seed) {
      seed = genRandomSeed();
      console.log("new seed", seed);
      await chrome.storage.local.set({
        tiny_fingerprint_seed: seed,
      });
      console.log("save new seed done", seed);
    }
    const eh = new EQUIPMENT.EquipmentInfoHandler(navigator, seed);
    console.log("2222", eh);
    const requestHeaders = [];
    if (eh.userAgent) {
      requestHeaders.push({
        header: "User-Agent",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: eh.userAgent,
      });
    }
    if (eh.brands) {
      requestHeaders.push({
        header: "Sec-Ch-Ua",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: eh.brands
          .map((brand) => `"${brand.brand}";v="${brand.version}"`)
          .join(", "),
      });
    }

    const heValues = await eh.getHighEntropyValues();
    if (heValues.fullVersionList) {
      requestHeaders.push({
        header: "Sec-Ch-Ua-Full-Version-List",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: heValues.fullVersionList
          .map((brand) => `"${brand.brand}";v="${brand.version}"`)
          .join(", "),
      });
    }
    if (heValues.uaFullVersion) {
      requestHeaders.push({
        header: "Sec-Ch-Ua-Full-Version",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: heValues.uaFullVersion,
      });
    }

    if (requestHeaders.length) {
      chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [UA_NET_RULE_ID],
        addRules: [
          {
            id: UA_NET_RULE_ID,
            // priority: 1,
            condition: {
              resourceTypes: Object.values(
                chrome.declarativeNetRequest.ResourceType
              ),
              // resourceTypes: [RT.MAIN_FRAME, RT.SUB_FRAME, RT.IMAGE, RT.FONT, RT.MEDIA, RT.STYLESHEET, RT.SCRIPT ],
            },
            action: {
              type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
              requestHeaders,
            },
          },
        ],
      });
      return;
    }
  } catch (err) {}

  chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [UA_NET_RULE_ID],
  });
};
//开启/屏蔽webrtc
const webrtcModify = function (disable = true) {
  let value = "default";
  if (disable) {
    value = "disable_non_proxied_udp";
  }
  console.log("wwww", disable, value);
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value,
  });
};
chrome.runtime.onInstalled.addListener(function () {
  refreshRequestHeaderUA();
  webrtcModify();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.greeting === "update_fingerprint") {
    refreshRequestHeaderUA();
  }
});

//注入文件，修改指纹
const modifyFingerPrint = function (tabId, data) {
  const FINGERPRINT = {
    win: window,
    rawObjects: {},
    seededRandom: (seed, max, min) => {
      max = max ?? 1;
      min = min ?? 0;
      seed = (seed * 9301 + 49297) % 233280;
      const rnd = seed / 233280.0;
      return min + rnd * (max - min);
    },
    /**
     * 根据种子随机获取数组中的元素
     */
    seededEl: (arr, seed) => {
      return arr[seed % arr.length];
    },
    randomCanvasNoise: (seed) => {
      let noise = "";
      for (let i = 0; i < 10; i++) {
        let index = Math.floor(
          FINGERPRINT.seededRandom(seed++, 0, chars.length)
        );
        noise += chars[index];
      }
      return noise;
    },
    randomWebglColor: (seed) => {
      const str = Array.from({ length: 4 }, (_, i) =>
        FINGERPRINT.seededRandom(seed + i, 0, 1).toFixed(2)
      ).join(",");
      return `vec4(${str})`;
    },
    webglRendererList: [
      "ANGLE (NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA GeForce GTX 1650 Direct3D9Ex vs_3_0 ps_3_0)",
      "ANGLE (Intel, Intel(R) UHD Graphics 630 (0x00003E9B) Direct3D11 vs_5_0 ps_5_0, D3D11)",
      "ANGLE (Intel(R) HD Graphics 630 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (Intel(R) HD Graphics 4400 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (Intel(R) HD Graphics 3000 Direct3D11 vs_4_1 ps_4_1)",
      "ANGLE (Intel(R) HD Graphics 4000 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA GeForce GTX 560 Ti Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA GeForce GTS 450 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA GeForce GTX 570 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA GeForce 210 Direct3D11 vs_4_1 ps_4_1)",
      "ANGLE (NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA GeForce GTX 750 Ti Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA GeForce GTX 960 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA GeForce RTX 2070 SUPER Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (AMD Mobility Radeon HD 5000 Series Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (AMD Radeon(TM) R5 Graphics Direct3D11 vs_5_0 ps_5_0)",
    ],
  };
  console.log("fffff", data, FINGERPRINT);

  //修改canvas指纹
  // if (!FINGERPRINT.rawObjects.toDataURL) {
  //   FINGERPRINT.rawObjects.toDataURL =
  //     FINGERPRINT.win.HTMLCanvasElement.prototype.toDataURL;
  //   FINGERPRINT.win.HTMLCanvasElement.prototype.toDataURL = new Proxy(
  //     FINGERPRINT.rawObjects.toDataURL,
  //     {
  //       apply: (target, thisArg, args) => {
  //         // const value = FINGERPRINT.getValue("other", "canvas");
  //         const value = FINGERPRINT.randomCanvasNoise(data.seed);
  //         if (value !== null) {
  //           let ctx = thisArg.getContext("2d");
  //           if (ctx !== null) {
  //             let style = ctx.fillStyle;
  //             ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
  //             ctx.fillText(value, 0, 2);
  //             ctx.fillStyle = style;
  //           }
  //         }
  //         return target.apply(thisArg, args);
  //       },
  //     }
  //   );
  // }

  //修改audio指纹
  if (!FINGERPRINT.rawObjects.createDynamicsCompressor) {
    FINGERPRINT.rawObjects.createDynamicsCompressor =
      FINGERPRINT.win.OfflineAudioContext.prototype.createDynamicsCompressor;
    FINGERPRINT.win.OfflineAudioContext.prototype.createDynamicsCompressor =
      new Proxy(FINGERPRINT.rawObjects.createDynamicsCompressor, {
        apply: (target, thisArg, args) => {
          const value = FINGERPRINT.seededRandom(data.seed);
          if (value === null) return target.apply(thisArg, args);
          const compressor = target.apply(thisArg, args);
          // 创建一个增益节点，添加噪音
          const gain = thisArg.createGain();
          // 根据需要设置噪音的强度
          gain.gain.value = value ?? Math.random() * 0.01;
          compressor.connect(gain);
          // 将增益节点的输出连接到上下文的目标
          gain.connect(thisArg.destination);
          return compressor;
        },
      });
  }

  //修改webgl指纹
  if (
    !FINGERPRINT.rawObjects.wglGetParameter ||
    !FINGERPRINT.rawObjects.wgl2GetParameter
  ) {
    const UNMASKED_VENDOR_WEBGL = 0x9245;
    const UNMASKED_RENDERER_WEBGL = 0x9246;
    const getParameterApply = (target, thisArg, args) => {
      switch (args[0]) {
        case UNMASKED_RENDERER_WEBGL: {
          // const value = FINGERPRINT.getValue("other", "webgl", "info");
          const value = FINGERPRINT.seededEl(
            FINGERPRINT.webglRendererList,
            data.seed
          );
          if (value === null) break;
          return value;
        }
        case UNMASKED_VENDOR_WEBGL: {
          return "Google Inc.";
        }
      }
      return target.apply(thisArg, args);
    };

    if (!FINGERPRINT.rawObjects.wglGetParameter) {
      FINGERPRINT.rawObjects.wglGetParameter =
        FINGERPRINT.win.WebGLRenderingContext.prototype.getParameter;
      FINGERPRINT.win.WebGLRenderingContext.prototype.getParameter = new Proxy(
        FINGERPRINT.rawObjects.wglGetParameter,
        { apply: getParameterApply }
      );
    }
    if (!FINGERPRINT.rawObjects.wgl2GetParameter) {
      FINGERPRINT.rawObjects.wgl2GetParameter =
        FINGERPRINT.win.WebGL2RenderingContext.prototype.getParameter;
      FINGERPRINT.win.WebGL2RenderingContext.prototype.getParameter = new Proxy(
        FINGERPRINT.rawObjects.wgl2GetParameter,
        { apply: getParameterApply }
      );
    }
  }

  if (
    !FINGERPRINT.rawObjects.wglShaderSource ||
    !FINGERPRINT.rawObjects.wgl2ShaderSource
  ) {
    const mainFuncRegx = /void\s+main\s*\(\s*(void)?\s*\)\s*\{[^}]*\}/;
    const shaderSourceApply = (target, thisArg, args) => {
      if (args[1]) {
        if (args[1].includes("gl_FragColor")) {
          // const color = FINGERPRINT.getValue("other", "webgl", "color");
          const color = FINGERPRINT.randomWebglColor(data.seed);
          if (color) {
            args[1] = args[1].replace(
              mainFuncRegx,
              `void main(){gl_FragColor=${color};}`
            );
          }
        } else if (args[1].includes("gl_Position")) {
          // const color = FINGERPRINT.getValue("other", "webgl", "color");
          const color = FINGERPRINT.randomWebglColor(data.seed);
          if (color) {
            args[1] = args[1].replace(
              mainFuncRegx,
              `void main(){gl_Position=${color};}`
            );
          }
        }
      }
      return target.apply(thisArg, args);
    };

    if (!FINGERPRINT.rawObjects.wglShaderSource) {
      FINGERPRINT.rawObjects.wglShaderSource =
        FINGERPRINT.win.WebGLRenderingContext.prototype.shaderSource;
      FINGERPRINT.win.WebGLRenderingContext.prototype.shaderSource = new Proxy(
        FINGERPRINT.rawObjects.wglShaderSource,
        { apply: shaderSourceApply }
      );
    }
    if (!FINGERPRINT.rawObjects.wgl2ShaderSource) {
      FINGERPRINT.rawObjects.wgl2ShaderSource =
        FINGERPRINT.win.WebGL2RenderingContext.prototype.shaderSource;
      FINGERPRINT.win.WebGL2RenderingContext.prototype.shaderSource = new Proxy(
        FINGERPRINT.rawObjects.wgl2ShaderSource,
        { apply: shaderSourceApply }
      );
    }
  }
};
const injectScriptSolution = (tabId, url) => {
  const host = BASE.urlToHttpHost(url);
  if (!host) {
    return;
  }
  // 注入参数
  const storage = {
    seed: 123456,
  };
  chrome.scripting.executeScript({
    target: {
      tabId,
      allFrames: true,
    },
    world: "MAIN",
    injectImmediately: true,
    args: [tabId, { ...storage }],
    func: modifyFingerPrint,
  });
};
/**
 * 监听tab变化吗，注入脚本
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.url) return;
  if (changeInfo.status === "loading") {
    injectScriptSolution(tabId, tab.url);
  }
});
