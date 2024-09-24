import * as EQUIPMENT from "./utils/equipment.js";
const UA_NET_RULE_ID = 1;

/**
 * 生成最大32位的种子
 */
const genRandomSeed = function () {
  return Math.floor(Math.random() * Math.pow(2, 32));
};

const refreshRequestHeaderUA = async () => {
  try {
    let seed = genRandomSeed();
    console.log("1111", seed);
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

chrome.runtime.onInstalled.addListener(refreshRequestHeaderUA);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.greeting === "update_fingerprint") {
    refreshRequestHeaderUA();
  }
});
