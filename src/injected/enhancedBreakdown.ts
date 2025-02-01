import { ImageDetails } from "./ImageDetails";
import { EnhancedMap } from "./EnhancedMap";
import { Leaderboard } from "./Leaderboard";
import { getEnhancedBreakdownData, isFinalResult } from "./utils";
import { tgRoundNames } from "../types/timeguessr.types";

function initEnhancedBreakdown() {
  const data = getEnhancedBreakdownData();

  if (isFinalResult(data)) {
    try {
      new Leaderboard(data);
    } catch (e) {
      console.error("Error creating leaderboard", e);
    }
  }

  let enhancedMap: EnhancedMap;
  try {
    enhancedMap = new EnhancedMap(data);
  } catch (e) {
    console.error("Error creating map", e);
  }

  if (document.getElementById("breakdownList") && isFinalResult(data)) {
    let imageDetails: ImageDetails;
    try {
      imageDetails = new ImageDetails(data);
    } catch (e) {
      console.error("Error creating image details", e);
    }

    tgRoundNames
      .map(
        (roundName) =>
          document.getElementById("block" + capitalize(roundName))!,
      )
      .map(clone)
      .filter(Boolean)
      .forEach((elem, index) => {
        if (enhancedMap) {
          elem
            .querySelector(".textWrap")!
            .addEventListener("click", () => enhancedMap.show(index));
        }
        if (imageDetails) {
          elem
            .querySelector(".summaryImage")!
            .addEventListener("click", () => imageDetails.show(index));
          document
            .getElementById("exitBreakdownButton")!
            .addEventListener("click", () => imageDetails.hide());
        }
      });
  }
}

function capitalize(roundName: string) {
  return roundName.charAt(0).toUpperCase() + roundName.slice(1);
}

function clone($elem: HTMLElement): HTMLElement {
  const clonedElem = $elem.cloneNode(true) as HTMLElement;
  $elem.parentNode!.replaceChild(clonedElem, $elem);
  return clonedElem;
}

initEnhancedBreakdown();
