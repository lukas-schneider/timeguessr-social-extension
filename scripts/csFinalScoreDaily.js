async function prepareData() {
    const data = {};

    const dailyInfo = JSON.parse(localStorage.getItem("dailyArray"))?.filter(obj => typeof obj === 'object');
    data.dailyInfo = dailyInfo;
    data.dailyNo = dailyInfo[0].No;

    const {uuid} = await chrome.storage.local.get(["uuid"]);
    data.playerUuid = uuid;

    if (uuid) {
        const totalPoints = ["one", "two", "three", "four", "five"]
            .map(roundName => Number(localStorage.getItem(roundName + "Total")))
            .reduce((acc, val) => acc + val, 0);

        // send data to background script, get back data with other player results
        const requestBody = {
            uuid: uuid,
            dailyNo: data.dailyNo,
            totalPoints,
        };

        // send data to background script, get back data with other player results
        const dailyResults = await chrome.runtime.sendMessage({
            endpoint: '/roundResult', method: 'POST', body: requestBody,
        });

        if (!dailyResults || !dailyResults.length) {
            console.error("Submitting result failed: " + JSON.stringify(dailyResults, null, 2));
        } else {
            data.dailyResults = dailyResults;
        }

        const leaderboard = await chrome.runtime.sendMessage({
            endpoint: '/leaderboard?dailyNo=' + data.dailyNo, method: 'GET',
        });

        if (!leaderboard || !leaderboard.today || !leaderboard.allTime) {
            console.error("Fetching leaderboard failed: " + JSON.stringify(leaderboard, null, 2));
        } else {
            data.leaderboard = leaderboard;
        }
    }

    return data;
}

function injectDataAndScript(data) {
    sessionStorage.setItem("tgs.data", JSON.stringify(data));
    injectScript(chrome.runtime.getURL('scripts/icsEnhancedBreakdown.js'));
}

/**
 * injectScript - Inject internal script to available access to the `window`
 *
 * @param  {string} filePath Local path of the internal script.
 * @see    {@link http://stackoverflow.com/questions/20499994/access-window-variable-from-content-script}
 */
function injectScript(filePath) {
    const body = document.getElementsByTagName('body')[0];
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', filePath);
    body.appendChild(script);
}

prepareData().then(injectDataAndScript).catch(err => console.error(err));