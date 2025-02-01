import browser from "webextension-polyfill";

export function normalizeDailyArray(dailyArray: any[]) {
    dailyArray = dailyArray?.filter(obj => typeof obj === 'object');
    if (dailyArray?.length !== 5) {
        throw new Error("dailyArray length is not 5");
    }

    const nos = dailyArray.map((round) => parseInt(round.No));
    const maxNo = Math.max(...nos);
    return dailyArray.map((round) => {
        return {
            ...round,
            No: String(maxNo),
        };
    });
}

export function injectDataAndScript(data: unknown) {
    sessionStorage.setItem("tgs.data", JSON.stringify(data));
    injectScript(browser.runtime.getURL('src/content/injected/enhancedBreakdown.js'));
}

/**
 * injectScript - Inject internal script to available access to the `window`
 *
 * @param  {string} filePath Local path of the internal script.
 * @see    {@link http://stackoverflow.com/questions/20499994/access-window-variable-from-content-script}
 */
function injectScript(filePath: string) {
    const body = document.getElementsByTagName('body')[0];
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', filePath);
    body.appendChild(script);
}
