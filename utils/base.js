const seededRandom = function (
    seed,
    max,
    min
  ) {
    max = max ?? 1;
    min = min ?? 0;
    seed = (seed * 9301 + 49297) % 233280;
    const rnd = seed / 233280.0;
    return min + rnd * (max - min);
  };



/**
 * 生成最大32位的种子
 */
export const genRandomSeed = function () {
  return Math.floor(Math.random() * Math.pow(2, 32))
}

/**
 * 对字符串hash，生成32位种子
 */
export const hashNumberFromString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
      let char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
  }
  return hash % 2147483647;
}

/**
 * 过滤arr中的undefined和false值
 */
export const arrayFilter = function<T>(arr: (T | undefined | boolean)[]): T[] {
  return arr.filter(item => item !== undefined && item !== false) as T[]
}

/**
 * url转带端口的host
 */
export const urlToHttpHost = function (url: string) {
  try {
    let _url = new URL(url);
    if(_url.protocol !== 'http:' && _url.protocol !== 'https:'){
      return undefined
    }
    let hostname = _url.hostname
    let port = _url.port
    if (port === "") {
      if (_url.protocol === "http:") {
        port = "80";
      } else if (_url.protocol === "https:") {
        port = "443";
      }
    }
    return `${hostname}:${port}`
  } catch (err) {
    return undefined
  }
}

/**
 * 版本号随机偏移
 * @param sourceVersion 源版本号
 * @param seed 种子
 * @param maxSubVersionNumber 最大子版本数量 
 * @param mainVersionOffset 最大主版本号偏移
 * @param subVersionOffset 最大子版本号偏移
 * @returns 
 */
export const versionRandomOffset = (sourceVersion: string, seed: number, maxSubVersionNumber?: number, maxMainVersionOffset?: number, maxSubVersionOffset?: number): string => {
  // 将源版本号分解为主版本号和子版本号
  const [mainVersion, ...subversions] = sourceVersion.split('.')
  if(mainVersion === undefined) return sourceVersion
  let nMainVersion = Number(mainVersion)
  if(Number.isNaN(nMainVersion)) return sourceVersion

  maxMainVersionOffset = maxMainVersionOffset ?? 2
  maxSubVersionOffset = maxSubVersionOffset ?? 50
  maxSubVersionNumber = maxSubVersionNumber ?? subversions.length

  nMainVersion += (seed % ((maxMainVersionOffset * 2) + 1)) - maxMainVersionOffset;

  const nSubversions: string[] = []
  for (let i = 0; i < maxSubVersionNumber; i++) {
    const subversion = subversions[i]
    let nSubversion = Number(subversion)
    if(Number.isNaN(nSubversion)) {
      nSubversions.push(subversion)
      continue
    }
    const ss = Math.floor(seededRandom(seed+i, -maxSubVersionOffset, maxSubVersionOffset))
    nSubversion = Math.abs((nSubversion ?? 0) + ss)
    nSubversions.push(nSubversion.toString())
  }

  // 将主版本号和子版本号重新组合成完整的版本号
  return [nMainVersion, ...nSubversions].join('.');
}

/**
 * 获取主要版本号
 */
export const getMainVersion = (sourceVersion: string) => {
  return sourceVersion.split('.')[0]
}