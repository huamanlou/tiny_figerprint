const UA_NET_RULE_ID = 1;
const uaRule =
  /^(?<product>.+?) \((?<systemInfo>.+?)\)( (?<engine>.+?))?( \((?<engineDetails>.+?)\))?( (?<extensions>.+?))?$/;
/**
 * 生成最大32位的种子
 */
const genRandomSeed = function () {
  return Math.floor(Math.random() * Math.pow(2, 32));
};
/**
 * 线性同余，根据seed产生随机数
 */
const seededRandom = function (seed, max, min) {
  max = max ?? 1;
  min = min ?? 0;
  seed = (seed * 9301 + 49297) % 233280;
  const rnd = seed / 233280.0;
  return min + rnd * (max - min);
};
/**
 * 版本号随机偏移
 * @param sourceVersion 源版本号
 * @param seed 种子
 * @param maxSubVersionNumber 最大子版本数量
 * @param maxMainVersionOffset 最大主版本号偏移
 * @param maxSubVersionOffset 最大子版本号偏移
 * @returns
 */
const versionRandomOffset = (
  sourceVersion,
  seed,
  maxSubVersionNumber,
  maxMainVersionOffset,
  maxSubVersionOffset
) => {
  // const seed = genRandomSeed();
  // 将源版本号分解为主版本号和子版本号
  const [mainVersion, ...subversions] = sourceVersion.split(".");
  if (mainVersion === undefined) return sourceVersion;
  let nMainVersion = Number(mainVersion);
  if (Number.isNaN(nMainVersion)) return sourceVersion;

  maxMainVersionOffset = maxMainVersionOffset ?? 2;
  maxSubVersionOffset = maxSubVersionOffset ?? 50;
  maxSubVersionNumber = maxSubVersionNumber ?? subversions.length;

  nMainVersion +=
    (seed % (maxMainVersionOffset * 2 + 1)) - maxMainVersionOffset;

  const nSubversions = [];
  for (let i = 0; i < maxSubVersionNumber; i++) {
    const subversion = subversions[i];
    let nSubversion = Number(subversion);
    if (Number.isNaN(nSubversion)) {
      nSubversions.push(subversion);
      continue;
    }
    const ss = Math.floor(
      seededRandom(seed + i, -maxSubVersionOffset, maxSubVersionOffset)
    );
    nSubversion = Math.abs((nSubversion ?? 0) + ss);
    nSubversions.push(nSubversion.toString());
  }

  // 将主版本号和子版本号重新组合成完整的版本号
  return [nMainVersion, ...nSubversions].join(".");
};
/**
 * 获取主要版本号
 */
const getMainVersion = (sourceVersion) => {
  return sourceVersion.split(".")[0];
};

class UAItem {
  constructor(name, version) {
    this.name = name;
    this.version = version;
  }
  static parse(item) {
    const parts = item.split("/");
    return new UAItem(parts[0], parts[1]);
  }
  toString() {
    return this.version ? `${this.name}/${this.version}` : this.name;
  }
  setName(name) {
    this.name = name;
  }
  setVersion(version) {
    this.version = version;
  }
}
class UAParser {
  constructor(ua) {
    let groups = ua.match(uaRule)?.groups;

    if (!groups) {
      throw new Error("unable to parse");
    }
    this.product = UAItem.parse(groups.product);
    this.systemInfo = groups.systemInfo.split(";").map((item) => item.trim());
    this.engine = groups.engine?.split(" ").map((item) => UAItem.parse(item));
    this.engineDetails = groups.engineDetails
      ?.split(",")
      .map((item) => item.trim());
    this.extensions = groups.extensions
      ?.split(" ")
      .map((item) => UAItem.parse(item));
  }

  toString(ignoreProductName) {
    let product;
    if (ignoreProductName) {
      product = this.product.version;
    } else {
      product = this.product.toString();
    }
    const systemInfo = this.systemInfo.join("; ");
    const engine = this.engine?.map((item) => item.toString()).join(" ");
    const extensions = this.extensions
      ?.map((item) => item.toString())
      .join(" ");

    const engineDetails = this.engineDetails?.join(", ");
    return `${product} (${systemInfo}) ${engine} (${engineDetails}) ${extensions}`;
  }
}

class EquipmentInfoHandler {
  constructor(nav, seed) {
    this.nav = nav;
    this.seed = null;
    this.userAgent = null;
    this.appVersion = null;

    this.userAgentData = null;
    this.brands = null;

    this.fullVersionList = null;
    this.uaFullVersion = null;

    this.rawUserAgentData = null;
    this.rawToJSON = null;
    this.rawGetHighEntropyValues = null;

    if (seed) {
      console.log("sssss", seed);
      this.setSeed(seed);
    }
  }

  setSeed(seed) {
    if (this.seed === seed) return;
    this.seed = seed;

    let uaParser;
    try {
      uaParser = new UAParser(this.nav.userAgent);
      console.log("uuuu", uaParser);
    } catch (err) {
      console.log("eee", err);
      return;
    }

    if (uaParser.engine) {
      uaParser.engine.forEach((item) => {
        item.setVersion(versionRandomOffset(item.version, seed));
      });
      uaParser.extensions?.forEach((item) => {
        item.version &&
          item.setVersion(versionRandomOffset(item.version, seed));
      });
    }

    /// userAgent
    this.userAgent = uaParser.toString();

    /// appVersion
    if (this.nav.appVersion) {
      this.appVersion = uaParser.toString(true);
    }

    /// userAgentData
    // @ts-ignore
    if (this.nav.userAgentData) {
      if (!uaParser.extensions) return;
      // @ts-ignore
      this.rawUserAgentData = this.nav.userAgentData;
      const brands = this.rawUserAgentData.brands;
      this.brands = brands.map((brand) => ({
        ...brand,
        version: getMainVersion(versionRandomOffset(brand.version, seed)),
      }));

      // @ts-ignore
      this.rawGetHighEntropyValues =
        NavigatorUAData.prototype.getHighEntropyValues;
    }
  }

  getValue(key) {
    switch (key) {
      case "userAgent":
        return this.userAgent ?? null;
      case "appVersion":
        return this.appVersion ?? null;
      case "userAgentData":
        return this.userAgentData ?? null;
      default:
        return null;
    }
  }

  async getHighEntropyValues() {
    // @ts-ignore
    if (
      this.seed !== undefined &&
      this.rawGetHighEntropyValues &&
      this.nav.userAgentData
    ) {
      // @ts-ignore
      const data = await this.rawGetHighEntropyValues.apply(
        this.nav.userAgentData,
        [["fullVersionList", "uaFullVersion"]]
      );

      if (data.fullVersionList) {
        const fullVersionList = data.fullVersionList;
        for (const brand of fullVersionList) {
          brand.version = versionRandomOffset(brand.version, this.seed);
        }
        this.fullVersionList = fullVersionList;
      }

      if (data.uaFullVersion) {
        this.uaFullVersion = versionRandomOffset(data.uaFullVersion, this.seed);
      }
    }

    return {
      fullVersionList: this.fullVersionList,
      uaFullVersion: this.uaFullVersion,
    };
  }
}

// const parseUserAgent = async function () {
//   const ua = navigator.userAgent;
//   // const uaRule =
//   //   /^(?<product>.+?) \((?<systemInfo>.+?)\)( (?<engine>.+?))?( \((?<engineDetails>.+?)\))?( (?<extensions>.+?))?$/;
//   agentObj = ua.match(uaRule)?.groups;
//   if (!agentObj) {
//     throw new Error("unable to parse user agent");
//   }
//   // 转化为name version
//   const parseNameVersion = function (item) {
//     const parts = item.split("/");
//     return {
//       name: parts[0],
//       version: parts[1],
//     };
//   };
//   let uaParser = {
//     product: parseNameVersion(agentObj.product),
//     systemInfo: agentObj.systemInfo.split(";").map((item) => item.trim()),
//     engine: agentObj.engine?.split(" ").map((item) => parseNameVersion(item)),
//     engineDetails: agentObj.engineDetails
//       ?.split(",")
//       .map((item) => item.trim()),
//     extensions: agentObj.extensions
//       ?.split(" ")
//       .map((item) => parseNameVersion(item)),
//   };
//   console.log("111", uaParser);
//   if (uaParser.engine && uaParser.engine.length > 0) {
//     uaParser.engine?.forEach((item) => {
//       item.version = versionRandomOffset(item.version);
//     });
//     uaParser.extensions?.forEach((item) => {
//       if (item.version) {
//         item.version = versionRandomOffset(item.version);
//       }
//     });
//   }
//   console.log("222", uaParser);

//   const toString = function (item) {
//     return item.version ? `${item.name}/${item.version}` : item.name;
//   };

//   const stringUA = function (uaParser, ignoreProductName = false) {
//     let product = "";
//     if (ignoreProductName) {
//       product = uaParser.product.version;
//     } else {
//       product = toString(uaParser.product);
//     }
//     const systemInfo = uaParser.systemInfo.join("; ");
//     const engine = uaParser.engine?.map((item) => toString(item)).join(" ");
//     const extensions = uaParser.extensions
//       ?.map((item) => toString(item))
//       .join(" ");

//     const engineDetails = uaParser.engineDetails?.join(", ");
//     return `${product} (${systemInfo}) ${engine} (${engineDetails}) ${extensions}`;
//   };

//   let userAgent = stringUA(uaParser);
//   let appVersion = stringUA(uaParser, true);

//   let resData = {
//     userAgent,
//     appVersion,
//   };
//   let rawUserAgentData = navigator.userAgentData;

//   if (navigator.userAgentData) {
//     if (!uaParser.extensions) return;
//     let brands = rawUserAgentData.brands;
//     resData.brands = brands.map((brand) => ({
//       ...brand,
//       version: getMainVersion(versionRandomOffset(brand.version)),
//     }));
//   }
//   console.log("3333", resData);
//   // return resData;
//   let rawGetHighEntropyValues = NavigatorUAData.prototype.getHighEntropyValues;
//   if (rawGetHighEntropyValues && rawUserAgentData) {
//     console.log("44444");
//     const data = await rawGetHighEntropyValues.apply(navigator.userAgentData, [
//       ["fullVersionList", "uaFullVersion"],
//     ]);
//     console.log("555", data);
//     if (data.fullVersionList) {
//       const fullVersionList = data.fullVersionList;
//       for (const brand of fullVersionList) {
//         brand.version = versionRandomOffset(brand.version);
//       }
//       resData.fullVersionList = fullVersionList;
//     }

//     if (data.uaFullVersion) {
//       const uaFullVersion = versionRandomOffset(data.uaFullVersion);
//       resData.uaFullVersion = uaFullVersion;
//     }
//   }

//   console.log("zzz", resData);

//   return resData;
// };

// const refreshRequestHeaderUA = async function () {
//   try {
//     const ua_obj = await parseUserAgent();
//     const requestHeaders = [];
//     if (ua_obj.userAgent) {
//       requestHeaders.push({
//         header: "User-Agent",
//         operation: chrome.declarativeNetRequest.HeaderOperation.SET,
//         value: ua_obj.userAgent,
//       });
//     }
//     if (ua_obj.brands) {
//       requestHeaders.push({
//         header: "Sec-Ch-Ua",
//         operation: chrome.declarativeNetRequest.HeaderOperation.SET,
//         value: ua_obj.brands
//           .map((brand) => `"${brand.brand}";v="${brand.version}"`)
//           .join(", "),
//       });
//     }
//     if (ua_obj.fullVersionList) {
//       requestHeaders.push({
//         header: "Sec-Ch-Ua-Full-Version-List",
//         operation: chrome.declarativeNetRequest.HeaderOperation.SET,
//         value: ua_obj.fullVersionList
//           .map((brand) => `"${brand.brand}";v="${brand.version}"`)
//           .join(", "),
//       });
//     }
//     if (ua_obj.uaFullVersion) {
//       requestHeaders.push({
//         header: "Sec-Ch-Ua-Full-Version",
//         operation: chrome.declarativeNetRequest.HeaderOperation.SET,
//         value: ua_obj.uaFullVersion,
//       });
//     }

//     if (requestHeaders.length) {
//       chrome.declarativeNetRequest.updateSessionRules({
//         removeRuleIds: [UA_NET_RULE_ID],
//         addRules: [
//           {
//             id: UA_NET_RULE_ID,
//             // priority: 1,
//             condition: {
//               resourceTypes: Object.values(
//                 chrome.declarativeNetRequest.ResourceType
//               ),
//               // resourceTypes: [RT.MAIN_FRAME, RT.SUB_FRAME, RT.IMAGE, RT.FONT, RT.MEDIA, RT.STYLESHEET, RT.SCRIPT ],
//             },
//             action: {
//               type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
//               requestHeaders,
//             },
//           },
//         ],
//       });
//       return;
//     }
//   } catch (err) {}

//   chrome.declarativeNetRequest.updateSessionRules({
//     removeRuleIds: [UA_NET_RULE_ID],
//   });
// };

const refreshRequestHeaderUA = async () => {
  try {
    let seed = genRandomSeed();
    console.log("1111", seed);
    const eh = new EquipmentInfoHandler(navigator, seed);
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
