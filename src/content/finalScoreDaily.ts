import {injectDataAndScript, normalizeDailyArray} from "./utils";
import browser from "webextension-polyfill";

async function prepareData() {
    const data: any = {};

    const dailyInfo = normalizeDailyArray(JSON.parse(localStorage.getItem("dailyArray")!));
    data.dailyInfo = dailyInfo;
    data.dailyNo = dailyInfo[0].No;

    const {uuid} = await browser.storage.local.get(["uuid"]);
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
        const dailyResults = await browser.runtime.sendMessage({
            endpoint: '/roundResult', method: 'POST', body: requestBody,
        });

        if (!dailyResults || !dailyResults.length) {
            console.error("Submitting result failed: " + JSON.stringify(dailyResults, null, 2));
        } else {
            data.dailyResults = dailyResults;
        }

        const leaderboard = await browser.runtime.sendMessage({
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

prepareData().then(injectDataAndScript).catch(err => console.error(err));