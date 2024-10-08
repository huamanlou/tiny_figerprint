//注入到页面核心方法，修改指纹
export const modifyFingerPrint = function (tabId, config, info, win) {
  console.log("mmmmmm", tabId, config, info);
  const FINGERPRINT = {
    tabId: null,
    win: null,
    config: null,
    info: null,
    rawObjects: {},
    chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    // hardwareConcurrencys: [2, 4, 8, 12, 16],
    colorDepths: [16, 24, 32],
    pixelDepths: [16, 24, 32],
    initData: function (tabId, config, info, win) {
      console.log("wwwww", win);
      this.tabId = tabId;
      this.config = config;
      this.info = info;
      this.win = typeof win == "undefined" ? window : win;
      console.log("fffffffff", FINGERPRINT);
    },
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
          FINGERPRINT.seededRandom(seed++, 0, FINGERPRINT.chars.length)
        );
        noise += FINGERPRINT.chars[index];
      }
      return noise;
    },
    randomWebglColor: (seed) => {
      const str = Array.from({ length: 4 }, (_, i) =>
        FINGERPRINT.seededRandom(seed + i, 0, 1).toFixed(2)
      ).join(",");
      return `vec4(${str})`;
    },
    //随机屏幕宽高信息
    randomScreenSize: (seed) => {
      const offset = (seed % 100) - 50; // 偏移幅度为50
      const rawWidth = screen.width;
      const rawHeight = screen.height;
      const width = rawWidth + offset;
      return {
        width: width,
        height: Math.round((width * rawHeight) / rawWidth),
      };
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
      "ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Max, Unspecified Version)",
      "ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Laptop GPU (0x0000249C) Direct3D11 vs_5_0 ps_5_0, D3D11)",
      "ANGLE (NVIDIA GeForce GTX 1080 Direct3D11 vs_5_0 ps_5_0)",
      "ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti (0x00001B06) Direct3D11 vs_5_0 ps_5_0, D3D11)",
      "ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Ti with Max-Q Design (0x00001C8C) Direct3D11 vs_5_0 ps_5_0, D3D11)",
      "ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Ti Laptop GPU (0x00002420) Direct3D11 vs_5_0 ps_5_0, D3D11)",
    ],
    //修改audio指纹
    modifyAudio: () => {
      //还原
      //   console.log("auauauauau", config);
      if (!FINGERPRINT.config.audio) {
        if (FINGERPRINT.rawObjects.createDynamicsCompressor) {
          FINGERPRINT.win.OfflineAudioContext.prototype.createDynamicsCompressor =
            FINGERPRINT.rawObjects.createDynamicsCompressor;
          FINGERPRINT.rawObjects.createDynamicsCompressor = undefined;
        }
        return;
      }
      //写入, 有bug，有2个固定值刷新随机出现
      if (!FINGERPRINT.rawObjects.createDynamicsCompressor) {
        // console.log("modify audio oooooo");
        FINGERPRINT.rawObjects.createDynamicsCompressor =
          FINGERPRINT.win.OfflineAudioContext.prototype.createDynamicsCompressor;
        FINGERPRINT.win.OfflineAudioContext.prototype.createDynamicsCompressor =
          new Proxy(FINGERPRINT.rawObjects.createDynamicsCompressor, {
            apply: (target, thisArg, args) => {
              const value = FINGERPRINT.seededRandom(FINGERPRINT.config.seed);
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
    },
    // 修改canvas指纹;
    modifyCanvas: () => {
      //还原
      if (!FINGERPRINT.config.canvas) {
        if (FINGERPRINT.rawObjects.toDataURL) {
          FINGERPRINT.win.HTMLCanvasElement.prototype.toDataURL =
            FINGERPRINT.rawObjects.toDataURL;
          FINGERPRINT.rawObjects.toDataURL = undefined;
        }
        return;
      }
      //写入
      if (!FINGERPRINT.rawObjects.toDataURL) {
        FINGERPRINT.rawObjects.toDataURL =
          FINGERPRINT.win.HTMLCanvasElement.prototype.toDataURL;
        FINGERPRINT.win.HTMLCanvasElement.prototype.toDataURL = new Proxy(
          FINGERPRINT.rawObjects.toDataURL,
          {
            apply: (target, thisArg, args) => {
              const value = FINGERPRINT.randomCanvasNoise(
                FINGERPRINT.config.seed
              );
              if (value !== null) {
                let ctx = thisArg.getContext("2d");
                if (ctx !== null) {
                  let style = ctx.fillStyle;
                  ctx.fillStyle = "rgba(0, 0, 0, 0.01)";
                  ctx.fillText(value, 0, 2);
                  ctx.fillStyle = style;
                }
              }
              return target.apply(thisArg, args);
            },
          }
        );
      }
    },
    //修改webgl指纹
    modifyWebgl: () => {
      //还原
      if (!FINGERPRINT.config.webgl) {
        if (FINGERPRINT.rawObjects.wglGetParameter) {
          FINGERPRINT.win.WebGLRenderingContext.prototype.getParameter =
            FINGERPRINT.rawObjects.wglGetParameter;
          FINGERPRINT.rawObjects.wglGetParameter = undefined;
        }
        if (FINGERPRINT.rawObjects.wgl2GetParameter) {
          FINGERPRINT.win.WebGL2RenderingContext.prototype.getParameter =
            FINGERPRINT.rawObjects.wgl2GetParameter;
          FINGERPRINT.rawObjects.wgl2GetParameter = undefined;
        }
        if (FINGERPRINT.rawObjects.wglShaderSource) {
          FINGERPRINT.win.WebGLRenderingContext.prototype.shaderSource =
            FINGERPRINT.rawObjects.wglShaderSource;
          FINGERPRINT.rawObjects.wglShaderSource = undefined;
        }
        if (FINGERPRINT.rawObjects.wgl2ShaderSource) {
          FINGERPRINT.win.WebGL2RenderingContext.prototype.shaderSource =
            FINGERPRINT.rawObjects.wgl2ShaderSource;
          FINGERPRINT.rawObjects.wgl2ShaderSource = undefined;
        }
        return;
      }
      //写入
      if (
        !FINGERPRINT.rawObjects.wglGetParameter ||
        !FINGERPRINT.rawObjects.wgl2GetParameter
      ) {
        const UNMASKED_VENDOR_WEBGL = 0x9245;
        const UNMASKED_RENDERER_WEBGL = 0x9246;
        const getParameterApply = (target, thisArg, args) => {
          switch (args[0]) {
            case UNMASKED_RENDERER_WEBGL: {
              const value = FINGERPRINT.seededEl(
                FINGERPRINT.webglRendererList,
                FINGERPRINT.config.seed
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
          FINGERPRINT.win.WebGLRenderingContext.prototype.getParameter =
            new Proxy(FINGERPRINT.rawObjects.wglGetParameter, {
              apply: getParameterApply,
            });
        }
        if (!FINGERPRINT.rawObjects.wgl2GetParameter) {
          FINGERPRINT.rawObjects.wgl2GetParameter =
            FINGERPRINT.win.WebGL2RenderingContext.prototype.getParameter;
          FINGERPRINT.win.WebGL2RenderingContext.prototype.getParameter =
            new Proxy(FINGERPRINT.rawObjects.wgl2GetParameter, {
              apply: getParameterApply,
            });
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
              const color = FINGERPRINT.randomWebglColor(
                FINGERPRINT.config.seed
              );
              if (color) {
                args[1] = args[1].replace(
                  mainFuncRegx,
                  `void main(){gl_FragColor=${color};}`
                );
              }
            } else if (args[1].includes("gl_Position")) {
              const color = FINGERPRINT.randomWebglColor(
                FINGERPRINT.config.seed
              );
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
          FINGERPRINT.win.WebGLRenderingContext.prototype.shaderSource =
            new Proxy(FINGERPRINT.rawObjects.wglShaderSource, {
              apply: shaderSourceApply,
            });
        }
        if (!FINGERPRINT.rawObjects.wgl2ShaderSource) {
          FINGERPRINT.rawObjects.wgl2ShaderSource =
            FINGERPRINT.win.WebGL2RenderingContext.prototype.shaderSource;
          FINGERPRINT.win.WebGL2RenderingContext.prototype.shaderSource =
            new Proxy(FINGERPRINT.rawObjects.wgl2ShaderSource, {
              apply: shaderSourceApply,
            });
        }
      }
    },
    // 修改屏幕数据
    modifyScreen: () => {
      //还原
      if (!FINGERPRINT.config.screen) {
        if (FINGERPRINT.rawObjects.screenDescriptor) {
          FINGERPRINT.win.Object.defineProperty(
            FINGERPRINT.win,
            "screen",
            FINGERPRINT.rawObjects.screenDescriptor
          );
          FINGERPRINT.rawObjects.screenDescriptor = undefined;
        }
        return;
      }
      //写入
      if (!FINGERPRINT.rawObjects.screenDescriptor) {
        FINGERPRINT.rawObjects.screenDescriptor =
          FINGERPRINT.win.Object.getOwnPropertyDescriptor(
            FINGERPRINT.win,
            "screen"
          );
        const screenSize = FINGERPRINT.randomScreenSize(
          FINGERPRINT.config.seed
        );
        const colorDepth = FINGERPRINT.seededEl(
          FINGERPRINT.colorDepths,
          FINGERPRINT.config.seed
        );
        const pixelDepth = FINGERPRINT.seededEl(
          FINGERPRINT.pixelDepths,
          FINGERPRINT.config.seed
        );

        FINGERPRINT.win.Object.defineProperty(FINGERPRINT.win, "screen", {
          value: new Proxy(FINGERPRINT.win.screen, {
            get: (target, key) => {
              if (key in target) {
                let value = null;
                if (key == "height" || key == "width") {
                  value = screenSize[key];
                } else if (key == "colorDepth") {
                  value = colorDepth;
                } else if (key == "pixelDepth") {
                  value = pixelDepth;
                }
                if (value !== null) {
                  return value;
                }
                const res = target[key];
                if (typeof res === "function") return res.bind(target);
                else return res;
              } else {
                return undefined;
              }
            },
          }),
        });
      }
    },
    // 模拟navigator返回内容
    mockNavigator: () => {
      //还原
      if (!FINGERPRINT.config.useragent) {
        if (FINGERPRINT.rawObjects.navigatorDescriptor) {
          FINGERPRINT.win.Object.defineProperty(
            FINGERPRINT.win,
            "navigator",
            FINGERPRINT.rawObjects.navigatorDescriptor
          );
          FINGERPRINT.rawObjects.navigatorDescriptor = undefined;
        }
        return;
      }
      //写入
      if (!FINGERPRINT.rawObjects.navigatorDescriptor) {
        FINGERPRINT.rawObjects.navigatorDescriptor =
          FINGERPRINT.win.Object.getOwnPropertyDescriptor(
            FINGERPRINT.win,
            "navigator"
          );
        FINGERPRINT.win.Object.defineProperty(FINGERPRINT.win, "navigator", {
          value: new Proxy(FINGERPRINT.win.navigator, {
            get: (target, key) => {
              if (key in target) {
                let value = null;
                if (key === "userAgent" || key === "appVersion") {
                  // 获取useragen生成的数据，外面传进来
                  value = FINGERPRINT.info[key];
                }
                if (value !== null) {
                  return value;
                }
                const res = target[key];
                if (typeof res === "function") {
                  return res.bind(target);
                } else {
                  return res;
                }
              } else {
                return undefined;
              }
            },
          }),
        });
      }
    },
    // 监听iframe创建钩子
    iframeHtmlHook: () => {
      // 监听DOM初始化
      const observer = new MutationObserver((mutations) => {
        if (mutations.length == 1) {
          console.log("mutations.length", mutations.length);
          return;
        }
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            // console.log("for for for", node.nodeName);
            if (node.nodeName === "IFRAME") {
              fingerprint_inject(tabId, config, info, node.contentWindow);
            }
          }
        }
      });
      observer.observe(FINGERPRINT.win.document.documentElement, {
        childList: true,
        subtree: true,
      });

      const closeObserver = () => {
        observer.disconnect();
        FINGERPRINT.win.removeEventListener("DOMContentLoaded", closeObserver, {
          capture: true,
        });
        FINGERPRINT.win.removeEventListener("load", closeObserver, {
          capture: true,
        });
      };
      FINGERPRINT.win.addEventListener("DOMContentLoaded", closeObserver, {
        capture: true,
      });
      FINGERPRINT.win.addEventListener("load", closeObserver, {
        capture: true,
      });
    },
    // iframe script hook
    iframeScriptHook: () => {
      if (
        !FINGERPRINT.rawObjects.appendChild ||
        !FINGERPRINT.rawObjects.insertBefore ||
        !FINGERPRINT.rawObjects.replaceChild
      ) {
        const apply = (target, thisArg, args) => {
          const res = target.apply(thisArg, args);
          const node = args[0];
          if (node?.tagName === "IFRAME") {
            fingerprint_inject(tabId, config, info, node.contentWindow);
          }
          return res;
        };

        if (!FINGERPRINT.rawObjects.appendChild) {
          FINGERPRINT.rawObjects.appendChild =
            FINGERPRINT.win.HTMLElement.prototype.appendChild;
          FINGERPRINT.win.HTMLElement.prototype.appendChild = new Proxy(
            FINGERPRINT.rawObjects.appendChild,
            { apply }
          );
        }
        if (!FINGERPRINT.rawObjects.insertBefore) {
          FINGERPRINT.rawObjects.insertBefore =
            FINGERPRINT.win.HTMLElement.prototype.insertBefore;
          FINGERPRINT.win.HTMLElement.prototype.insertBefore = new Proxy(
            FINGERPRINT.rawObjects.insertBefore,
            { apply }
          );
        }
        if (!FINGERPRINT.rawObjects.replaceChild) {
          FINGERPRINT.rawObjects.replaceChild =
            FINGERPRINT.win.HTMLElement.prototype.replaceChild;
          FINGERPRINT.win.HTMLElement.prototype.replaceChild = new Proxy(
            FINGERPRINT.rawObjects.replaceChild,
            { apply }
          );
        }
      }
    },
  };
  const fingerprint_inject = function (tabId, config, info, win) {
    FINGERPRINT.initData(tabId, config, info, win);
    console.log("iiiiiiiiiiiii", FINGERPRINT);
    FINGERPRINT.iframeHtmlHook();
    FINGERPRINT.iframeScriptHook();
    FINGERPRINT.modifyAudio();
    FINGERPRINT.modifyCanvas();
    FINGERPRINT.modifyWebgl();
    FINGERPRINT.modifyScreen();
    FINGERPRINT.mockNavigator();
  };
  fingerprint_inject(tabId, config, info, win);
};
