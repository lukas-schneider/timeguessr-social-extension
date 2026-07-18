import { callApi, getSettings } from "../utils/extension.utils";
import { getTgProgressData } from "../utils/timeguessr.utils";
import { ImageInfo, RoundResult } from "../api";
import { setTgsRoundData } from "../utils/utils";
import { injectEnhancedMap } from "./utils";

async function submitGuess(uuid: string, groupId: string) {
  const data = getTgProgressData();
  const currentResult = data.currentResult;
  if (!currentResult) {
    console.log(data);
    throw new Error("no current result available");
  }

  const roundIndex = data.round - 1;
  if (roundIndex < 0 || roundIndex > 4) {
    throw new Error("invalid round index");
  }

  const roundResult: RoundResult = {
    totalPoints: currentResult.totalScore,
    locationPoints: currentResult.distanceScoreValue,
    timePoints: currentResult.yearScoreValue,
    yearsOff: currentResult.actualYear - currentResult.guessYear,
    distanceOff: currentResult.distanceMeters.toFixed(0) + " m",
    latitude: currentResult.guessCoords.lat,
    longitude: currentResult.guessCoords.lng,
    guessedYear: currentResult.guessYear,
    roundIndex: data.round - 1,
  };

  let roundInfo = data.playArray[roundIndex];
  const imageInfo: ImageInfo = {
    latitude: currentResult.actualCoords.lat,
    longitude: currentResult.actualCoords.lng,
    year: currentResult.actualYear,
    country: roundInfo.Country,
    imageDescription: roundInfo.Description,
    imageUrl: roundInfo.URL,
  };

  // submit own round result
  await callApi("addRoundResult", {
    groupId,
    dailyNo: data.dailyNumber,
    roundIndex: String(roundIndex),
    addRoundResultRequest: {
      roundResult,
      uuid,
      imageInfo,
    },
  });
}

function submitFinalScore(uuid: string, groupId: string) {
  const data = getTgProgressData();
  const currentResult = data.currentResult;
  if (!currentResult) {
    console.log(data);
    throw new Error("no current result available");
  }

  const roundIndex = data.round - 1;
  if (roundIndex < 0 || roundIndex > 4) {
    throw new Error("invalid round index");
  }
  void callApi("addDailyResult", {
    groupId,
    dailyNo: data.dailyNumber,
    addDailyResultRequest: {
      uuid,
      totalPoints: data.score,
    },
  });
}

async function loadRoundResults(uuid: string, groupId: string) {
  const data = getTgProgressData();
  const roundIndex = data.round - 1;
  const roundInfo = data.playArray[roundIndex];

  const roundResults = await callApi("getRoundResults", {
    groupId,
    dailyNo: data.dailyNumber,
    roundIndex: String(roundIndex),
  });

  setTgsRoundData({
    groupId,
    uuid,
    dailyNo: data.dailyNumber,
    roundIndex,
    roundResults,
    roundInfo,
  });
}

function handleGuessClick(uuid: string, groupId: string) {
  setTimeout(
    () =>
      submitGuess(uuid, groupId)
        .then(() => loadRoundResults(uuid, groupId))
        .catch(console.error),
    0,
  );
}

let isResultsMapVisible: boolean = false;

function checkResultsMap() {
  let resultsMap = document.querySelector("div.results-map");
  if (resultsMap && !isResultsMapVisible) {
    isResultsMapVisible = true;
    injectEnhancedMap();
  } else if (!resultsMap && isResultsMapVisible) {
    isResultsMapVisible = false;
    console.log("hide");
  }
}

let observer: MutationObserver;
let globalClickListener: EventListener;

export async function loadPlay() {
  const { uuid, groupId } = await getSettings(["uuid", "groupId"]);
  if (!groupId) {
    throw new Error("groupId is not available");
  }
  globalClickListener = (e) => {
    if (e.target instanceof HTMLElement) {
      if (e.target.matches("button.guess-btn")) {
        handleGuessClick(uuid, groupId);
      } else if (e.target.matches("button.next-round-btn")) {
        if (e.target.innerText?.trim() === "Final Score") {
          submitFinalScore(uuid, groupId);
        }
      }
    }
  };
  document.body.addEventListener("click", globalClickListener, {
    capture: true,
  });

  observer = new MutationObserver(() => {
    checkResultsMap();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  checkResultsMap();

  if (isResultsMapVisible) {
    void loadRoundResults(uuid, groupId).catch(console.error);
  }
}

export function unloadPlay() {
  if (observer) {
    observer.disconnect();
  }
  if (globalClickListener) {
    document.body.removeEventListener("click", globalClickListener, {
      capture: true,
    });
  }
}
