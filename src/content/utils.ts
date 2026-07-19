import browser from "webextension-polyfill";

export function injectEnhancedMap() {
  injectScript(browser.runtime.getURL("enhanced-map.js"));
}

export function injectEnhancedFinalMap() {
  injectScript(browser.runtime.getURL("enhanced-final-map.js"));
}

export function injectLeaderboard() {
  injectScript(browser.runtime.getURL("leaderboard.js"));
}

/**
 * injectScript - Inject internal script to available access to the `window`
 *
 * @param  {string} filePath Local path of the internal script.
 * @see    {@link http://stackoverflow.com/questions/20499994/access-window-variable-from-content-script}
 */
function injectScript(filePath: string) {
  const body = document.getElementsByTagName("body")[0];
  const script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", filePath);
  body.appendChild(script);
}
