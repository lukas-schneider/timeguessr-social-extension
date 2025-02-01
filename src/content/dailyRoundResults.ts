import { callApi, getSettings } from "../utils/extension.utils";
import {
  getDailyNo,
  getRoundInfos,
  getRoundResultValue,
} from "../utils/timeguessr.utils";
import { ImageInfo, RoundResult } from "../api";
import { tgRoundNames } from "../types/timeguessr.types";
import { injectEnhancedBreakdown } from "./utils";

async function run() {
  const dailyNo = getDailyNo();
  const { uuid, groupId } = await getSettings(["uuid", "groupId"]);
  if (!groupId) {
    throw new Error("groupId is not available");
  }

  let roundIndex: number;
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

  const roundInfos = getRoundInfos();
  const roundInfo = roundInfos[roundIndex];
  const roundName = tgRoundNames[roundIndex];

  const roundResult: RoundResult = {
    totalPoints: Number(getRoundResultValue(`${roundName}Total`)),
    locationPoints: Number(getRoundResultValue(`${roundName}Geo`)),
    timePoints: Number(getRoundResultValue(`${roundName}Time`)),
    yearsOff: Number(getRoundResultValue(`${roundName}Year`)),
    distanceOff: getRoundResultValue(`${roundName}Distance`)!,
    latitude: Number(getRoundResultValue(`${roundName}Lt`)),
    longitude: Number(getRoundResultValue(`${roundName}Lng`)),
    guessedYear: Number(getRoundResultValue("yearStorage")),
    roundIndex: roundIndex,
  };

  const imageInfo: ImageInfo = {
    latitude: roundInfo.Location.lat,
    longitude: roundInfo.Location.lng,
    country: roundInfo.Country,
    year: Number(roundInfo.Year),
    imageDescription: roundInfo.Description,
    imageUrl: roundInfo.URL,
  };

  // submit own round result
  await callApi("addRoundResult", {
    groupId,
    dailyNo,
    roundIndex: String(roundIndex),
    addRoundResultRequest: {
      roundResult,
      uuid,
      imageInfo,
    },
  });

  // get all player results
  const roundResults = await callApi("getRoundResults", {
    groupId,
    dailyNo,
    roundIndex: String(roundIndex),
  });

  injectEnhancedBreakdown({
    groupId,
    uuid,
    dailyNo,
    roundResults,
    roundInfo,
  });
}

run().catch((err) => console.error(err));
