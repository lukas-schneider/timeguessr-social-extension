import { getTgsFinalData } from "../utils/utils";
import { getTgFinalData } from "../utils/timeguessr.utils";
import { TgsFinalData } from "../types/extension.types";
import { TgFinalData } from "../types/timeguessr.types";
import { EnhancedMap } from "./EnhancedMap";

let globalClickListener: EventListener;

type FixedMapkit = typeof mapkit & {
  // the type library is outdated
  _initialized: boolean;
  loadedLibraries: string[];
};

function init(_: TgFinalData, tgsData: TgsFinalData, map: mapkit.Map) {
  const enhancedMap = new EnhancedMap(tgsData, map);

  globalClickListener = (e: Event) => {
    if (e.target instanceof Element) {
      const roundCard = e.target.closest("div.round-card");
      const imageBtn = e.target.closest("button.image-btn");
      if (roundCard && !imageBtn) {
        // prevent default map zoom / focusing, since it adds the original annotations back
        e.stopImmediatePropagation();

        const index = Array.from(
          roundCard.parentElement?.querySelectorAll("div.round-card") ?? [],
        ).indexOf(roundCard);
        enhancedMap.show(index);
      } else if (e.target.closest("button.close-btn")) {
        enhancedMap.show(-1);
      }
    }
  };
  document.body.addEventListener("click", globalClickListener, {
    capture: true,
  });
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
  const tgData = getTgFinalData();
  if (tgData.mode !== "daily") {
    throw new Error("tg data returned unexpected mode");
  }

  const tgsFinalData = getTgsFinalData();
  if (!tgsFinalData || tgData.dailyNumber !== tgsFinalData.dailyNo) {
    console.log("data mismatch, retrying...", tgsFinalData, tgData);
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
    map.element?.matches(".final-map > div"),
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

  init(tgData, tgsFinalData, map);
}

wait();
