import {ImageDetails} from "./ImageDetails";
import {EnhancedMap} from "./EnhancedMap";
import {Leaderboard} from "./Leaderboard";
import {getEnhancedBreakdownData, isFinalResult, isRoundResult} from "./utils";
import {tgRoundNames} from "../types/timeguessr.types";
import {FinalResultEnhancedBreakdownData, RoundResultEnhancedBreakdownData} from "../types/extension.types";
import {RoundLeaderboard} from "./RoundLeaderboard";

function initEnhancedBreakdown() {
    const data = getEnhancedBreakdownData();

    if (isFinalResult(data)) {
        createLeaderboard(data);
    }

    let enhancedMap = createEnhancedMap(data);

    if (isFinalResult(data) && document.getElementById("breakdownList")) {
        enhanceBreakdownList(data, enhancedMap);
    }

    if (isRoundResult(data) && document.getElementById("mapResults")) {
        createRoundLeaderboard(data);
    }
}

function createLeaderboard(data: FinalResultEnhancedBreakdownData) {
    try {
        new Leaderboard(data);
    } catch (e) {
        console.error("Error creating leaderboard", e);
    }
}

function createRoundLeaderboard(data: RoundResultEnhancedBreakdownData) {
    try {
        new RoundLeaderboard(data);
    } catch (e) {
        console.error("Error creating round leaderboard", e);
    }
}

function createEnhancedMap(data: RoundResultEnhancedBreakdownData | FinalResultEnhancedBreakdownData) {
    try {
        return new EnhancedMap(data);
    } catch (e) {
        console.error("Error creating map", e);
        return null;
    }
}

function createImageDetails(data: FinalResultEnhancedBreakdownData) {
    try {
        return new ImageDetails(data);
    } catch (e) {
        console.error("Error creating image details", e);
        return null;
    }
}

function enhanceBreakdownList(data: FinalResultEnhancedBreakdownData, enhancedMap: EnhancedMap | null) {
    let imageDetails = createImageDetails(data);
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

function capitalize(roundName: string) {
    return roundName.charAt(0).toUpperCase() + roundName.slice(1);
}

function clone($elem: HTMLElement): HTMLElement {
    const clonedElem = $elem.cloneNode(true) as HTMLElement;
    $elem.parentNode!.replaceChild(clonedElem, $elem);
    return clonedElem;
}

initEnhancedBreakdown();
