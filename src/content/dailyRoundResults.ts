import { callApi, getSettings } from "../utils/extension.utils";
import {
  getDailyNo,
  getRoundIndex,
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

  const roundIndex = getRoundIndex();
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

  // get all player results and initial comments in parallel
  const [roundResults, { comments }] = await Promise.all([
    callApi("getRoundResults", {
      groupId,
      dailyNo,
      roundIndex: String(roundIndex),
    }),
    callApi("getComments", {
      groupId,
      dailyNo,
      roundIndex: String(roundIndex),
    }),
  ]);

  // Bridge: CustomEvents from injected page-context script → content script API calls
  // NOTE: detail must be a plain string — Firefox's Xray wrapper blocks all property
  // access on objects passed as CustomEvent.detail across the page/content-script boundary.
  window.addEventListener("tgs:chat:send", async (e: Event) => {
    const { roundIndex: ri, text } = JSON.parse(
      (e as CustomEvent<string>).detail,
    );
    try {
      const comment = await callApi("addComment", {
        groupId,
        dailyNo,
        roundIndex: ri ?? String(roundIndex),
        addCommentRequest: { uuid, text },
      });
      window.dispatchEvent(
        new CustomEvent("tgs:chat:added", { detail: JSON.stringify(comment) }),
      );
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("tgs:chat:error", {
          detail: JSON.stringify({ message: String(err) }),
        }),
      );
    }
  });

  window.addEventListener("tgs:chat:delete", async (e: Event) => {
    const { roundIndex: ri, commentId } = JSON.parse(
      (e as CustomEvent<string>).detail,
    );
    try {
      await callApi("deleteComment", {
        groupId,
        dailyNo,
        roundIndex: ri ?? String(roundIndex),
        commentId,
        deleteCommentRequest: { uuid },
      });
      window.dispatchEvent(
        new CustomEvent("tgs:chat:deleted", {
          detail: JSON.stringify({ commentId }),
        }),
      );
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("tgs:chat:error", {
          detail: JSON.stringify({ message: String(err) }),
        }),
      );
    }
  });

  window.addEventListener("tgs:chat:refresh", async (e: Event) => {
    const { roundIndex: ri } = JSON.parse((e as CustomEvent<string>).detail);
    try {
      const { comments: refreshed } = await callApi("getComments", {
        groupId,
        dailyNo,
        roundIndex: ri ?? String(roundIndex),
      });
      window.dispatchEvent(
        new CustomEvent("tgs:chat:refreshed", {
          detail: JSON.stringify(refreshed),
        }),
      );
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent("tgs:chat:error", {
          detail: JSON.stringify({ message: String(err) }),
        }),
      );
    }
  });

  injectEnhancedBreakdown({
    groupId,
    uuid,
    dailyNo,
    roundIndex: String(roundIndex),
    roundResults,
    roundInfo,
    comments,
  });
}

run().catch((err) => console.error(err));
