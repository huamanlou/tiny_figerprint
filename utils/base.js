/**
 * url转带端口的host
 */
export const urlToHttpHost = function (url) {
  try {
    let _url = new URL(url);
    if (_url.protocol !== "http:" && _url.protocol !== "https:") {
      return undefined;
    }
    let hostname = _url.hostname;
    let port = _url.port;
    if (port === "") {
      if (_url.protocol === "http:") {
        port = "80";
      } else if (_url.protocol === "https:") {
        port = "443";
      }
    }
    return `${hostname}:${port}`;
  } catch (err) {
    return undefined;
  }
};
