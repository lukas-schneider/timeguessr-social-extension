async function prepareData() {
    const {uuid} = await chrome.storage.local.get(["uuid"]);

    if (!uuid) {
        throw new Error("missing uuid");
    }

    let roundIndex;
    if (localStorage.getItem("showResultsFive")) {
        roundIndex = 4;
    } else if (localStorage.getItem("showResultsFour")) {
        roundIndex = 3;
    } else if (localStorage.getItem("showResultsThree")) {
        roundIndex = 2;
    } else if (localStorage.getItem("showResultsTwo")) {
        roundIndex = 1;
    } else if (localStorage.getItem("showResultsOne")) {
        roundIndex = 0;
    } else {
        throw new Error("missing roundIndex");
    }

    const dailyArray = normalizeNo(JSON.parse(localStorage.getItem('dailyArray')))
    const roundInfo = dailyArray[roundIndex]
    const roundName = ["one", "two", "three", "four", "five"][roundIndex];

    const roundResult = {
        totalPoints: Number(localStorage.getItem(roundName + "Total")),
        locationPoints: Number(localStorage.getItem(roundName + "Geo")),
        timePoints: Number(localStorage.getItem(roundName + "Time")),
        yearsOff: Number(localStorage.getItem(roundName + "Year")),
        distanceOff: localStorage.getItem(roundName + "Distance"),
        latitude: Number(localStorage.getItem(roundName + "Lt")),
        longitude: Number(localStorage.getItem(roundName + "Lng")),
        guessedYear: Number(localStorage.getItem("yearStorage")),
    };

    const requestBody = {
        uuid: uuid,
        roundResult: roundResult,
        roundInfo: {
            roundIndex,
            ...roundInfo
        },
        dailyNo: roundInfo.No,
    };

    // send data to background script, get back data with other player results
    const roundResults = await chrome.runtime.sendMessage({
        endpoint: '/roundResult', method: 'POST', body: requestBody,
    });

    if (!roundResults || !roundResults.length) {
        throw new Error("Submitting result failed: " + JSON.stringify(roundResults, null, 2));
    }

    return {
        roundResults,
        roundInfo,
        playerUuid: uuid,
    };
}

function normalizeNo(dailyArray) {
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

function injectDataAndScript(data) {
    sessionStorage.setItem("tgs.data", JSON.stringify(data));
    injectScript(chrome.runtime.getURL('scripts/icsEnhancedBreakdown.js'));
}

/**
 * injectScript - Inject internal script to available access to the `window`
 *
 * @param  {string} file_path Local path of the internal script.
 * @see    {@link http://stackoverflow.com/questions/20499994/access-window-variable-from-content-script}
 */
function injectScript(file_path) {
    const body = document.getElementsByTagName('body')[0];
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', file_path);
    body.appendChild(script);
}

prepareData().then(injectDataAndScript).catch(err => console.error(err));