import {
  getDailyNo,
  getRoundInfos,
  getRoundResultValue,
} from "../utils/timeguessr.utils";
import { callApi, getSettings } from "../utils/extension.utils";
import { tgRoundNames } from "../types/timeguessr.types";
import { injectEnhancedBreakdown } from "./utils";

async function run() {
  const dailyNo = getDailyNo();
  const roundInfos = getRoundInfos();
  const { uuid, groupId } = await getSettings(["uuid", "groupId"]);
  if (!groupId) {
    throw new Error("groupId is not available");
  }

  const totalPoints = tgRoundNames
    .map((roundName) => Number(getRoundResultValue(`${roundName}Total`)))
    .reduce((acc, val) => acc + val, 0);

  // send data to background script, get back data with other player results
  await callApi("addDailyResult", {
    groupId,
    dailyNo,
    addDailyResultRequest: {
      uuid,
      totalPoints,
    },
  });
  const dailyResults = await callApi("getDailyResults", {
    groupId,
    dailyNo,
  });

  const leaderboard = await callApi("getLeaderboard", {
    groupId,
    dailyNo,
  });

  injectEnhancedBreakdown({
    dailyNo,
    uuid,
    groupId,
    leaderboard,
    dailyResults,
    roundInfos,
  });
}

run().catch((err) => console.error(err));
