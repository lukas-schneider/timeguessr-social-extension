import { getTgsRoundData } from "../utils/utils";
import { getTgProgressData } from "../utils/timeguessr.utils";
import { TgsRoundData } from "../types/extension.types";
import { TgProgressData } from "../types/timeguessr.types";
import { EnhancedMap } from "./EnhancedMap";

type FixedMapkit = typeof mapkit & {
  // the type library is outdated
  _initialized: boolean;
  loadedLibraries: string[];
};

function init(_: TgProgressData, tgsData: TgsRoundData, map: mapkit.Map) {
  new EnhancedMap(tgsData, map);
}

let retryCounter = 0;

function retry() {
  if (retryCounter >= 10) {
    throw new Error("retry timeout");
  }
  retryCounter++;
  setTimeout(wait, 500);
  return;
}

function wait() {
  const tgData = getTgProgressData();
  if (tgData.mode !== "daily" || tgData.phase !== "results") {
    throw new Error("tg data returned unexpected mode or phase");
  }

  const tgsRoundData = getTgsRoundData();

  if (
    !tgsRoundData ||
    tgData.dailyNumber !== tgsRoundData.dailyNo ||
    tgData.round - 1 !== tgsRoundData.roundIndex
  ) {
    console.log("data mismatch, retrying...", tgsRoundData, tgData);
    retry();
    return;
  }

  if (
    !window.mapkit ||
    !(window.mapkit as FixedMapkit)._initialized ||
    !(window.mapkit as FixedMapkit).loadedLibraries?.includes("map")
  ) {
    console.log("mapkit unavailable or uninitialized, retrying...");
    retry();
    return;
  }

  const map = window.mapkit?.maps?.filter((map) =>
    map.element?.matches(".results-map > div"),
  )[0];
  if (!map || map.annotations?.length === 0) {
    console.log(
      "result map unavailable or uninitialized, retrying...",
      map,
      map?.annotations,
    );
    retry();
    return;
  }

  // wait an additional half second, since the original site sometimes takes a moment to init the markers properly
  setTimeout(() => init(tgData, tgsRoundData, map), 500);
}

wait();
