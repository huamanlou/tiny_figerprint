import * as EQUIPMENT from "./utils/equipment.js";
import * as BASE from "./utils/base.js";
// import modifyFingerPrint from "./utils/inject.js";
import * as CORE from "./utils/core.js";

const UA_NET_RULE_ID = 1;

/**
 * 生成最大32位的种子
 */
const genRandomSeed = function () {
  return Math.floor(Math.random() * Math.pow(2, 32));
};

const defaultData = {
  config: {
    seed: "",
    useragent: false,
    webgl: false,
    canvas: false,
    audio: false,
    screen: false,
    webrtc: false,
  },
  info: {
    userAgent: "",
    appVersion: "",
    // userAgentData: "", //插件数据太难搞了，懒得mock回去了
  },
};

const refreshRequestHeaderUA = async (config, info) => {
  try {
    if (!config.useragent) {
      chrome.declarativeNetRequest.updateSessionRules({
        removeRuleIds: [UA_NET_RULE_ID],
      });
      return;
    }
    const seed = config.seed;
    const eh = new EQUIPMENT.EquipmentInfoHandler(navigator, seed);

    const requestHeaders = [];
    if (eh.userAgent) {
      requestHeaders.push({
        header: "User-Agent",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value: eh.userAgent,
      });

      //保存数据，inject的时候，会mock navigator数据
      info.userAgent = eh.userAgent;
      info.appVersion = eh.appVersion;
      //写入本地，防止刷新页面数据丢失
      chrome.storage.local.set({
        tiny_fingerprint_info: info,
      });
      console.log("infoinfoinfo", info);
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
      const value = heValues.fullVersionList
        .map((brand) => `"${brand.brand}";v="${brand.version}"`)
        .join(", ");
      requestHeaders.push({
        header: "Sec-Ch-Ua-Full-Version-List",
        operation: chrome.declarativeNetRequest.HeaderOperation.SET,
        value,
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

  //这里没搞懂，为啥要remove rules
  // chrome.declarativeNetRequest.updateSessionRules({
  //   removeRuleIds: [UA_NET_RULE_ID],
  // });
};
//开启/屏蔽webrtc
const webrtcModify = (config) => {
  let value = "default";
  if (config.webrtc) {
    value = "disable_non_proxied_udp";
  }
  chrome.privacy.network.webRTCIPHandlingPolicy.set({
    value,
  });
};

// 初始化配置
const initConfig = async () => {
  let res = await chrome.storage.local.get();
  console.log("local", res);
  if (res["tiny_fingerprint_config"]) {
    console.log("merge config");
    defaultData.config = {
      ...defaultData.config,
      ...res["tiny_fingerprint_config"],
    };
  }
  if (res["tiny_fingerprint_info"]) {
    console.log("merge info");
    defaultData.config = {
      ...defaultData.config,
      ...res["tiny_fingerprint_info"],
    };
  }
  console.log("defaultData", defaultData);
  //创建随机数
  if (!defaultData.config.seed) {
    defaultData.config.seed = genRandomSeed();
    chrome.storage.local.set({
      tiny_fingerprint_config: defaultData.config,
    });
  }
};

//初始化入口
const initLoader = async () => {
  await initConfig();
  refreshRequestHeaderUA(defaultData.config, defaultData.info);
  webrtcModify(defaultData.config);
};

//浏览器初始化启动
chrome.runtime.onInstalled.addListener(async function () {
  initLoader();
});
//监听插件配置修改
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.greeting === "update_fingerprint") {
    initLoader();
  }
});

const injectScriptSolution = async (tabId, url) => {
  const host = BASE.urlToHttpHost(url);
  if (!host) {
    return;
  }
  // 注入参数
  await initConfig();
  const config = defaultData.config;
  const info = defaultData.info;
  chrome.scripting.executeScript({
    target: {
      tabId,
      allFrames: true,
    },
    world: "MAIN",
    injectImmediately: true,
    args: [tabId, { ...config }, { ...info }],
    func: CORE.modifyFingerPrint,
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
