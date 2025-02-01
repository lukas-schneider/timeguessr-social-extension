import browser from "webextension-polyfill";
import {injectDataAndScript, normalizeDailyArray} from "./utils";

async function prepareData() {
    const {uuid} = await browser.storage.local.get(["uuid"]);

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

    const dailyArray = normalizeDailyArray(JSON.parse(localStorage.getItem('dailyArray')!))
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
    const roundResults = await browser.runtime.sendMessage({
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

prepareData().then(injectDataAndScript).catch(err => console.error(err));