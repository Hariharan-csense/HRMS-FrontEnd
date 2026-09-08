declare global {
  interface Window {
    cordova?: unknown;
  }
}

export const isCordovaApp = (): boolean =>
  typeof window !== "undefined" && Boolean(window.cordova);

export const isCordovaIOS = (): boolean => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const hasCordovaRuntime = isCordovaApp();
  const userAgent = navigator.userAgent || "";
  const platform = navigator.platform || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    /iPad|iPhone|iPod/.test(platform) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return hasCordovaRuntime && isIOS;
};
