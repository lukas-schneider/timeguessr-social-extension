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
  const [dailyResults, leaderboard, roundComments] = await Promise.all([
    callApi("getDailyResults", { groupId, dailyNo }),
    callApi("getLeaderboard", { groupId, dailyNo }),
    Promise.all(
      [0, 1, 2, 3, 4].map((i) =>
        callApi("getComments", {
          groupId,
          dailyNo,
          roundIndex: String(i),
        }).then(({ comments }) => comments),
      ),
    ),
  ]);

  // Bridge: CustomEvents from injected page-context script → content script API calls.
  // detail is always a JSON string (Firefox Xray restriction).
  // roundIndex is included in every payload so a single listener handles all 5 rounds.
  window.addEventListener("tgs:chat:send", async (e: Event) => {
    const { roundIndex, text } = JSON.parse((e as CustomEvent<string>).detail);
    try {
      const comment = await callApi("addComment", {
        groupId,
        dailyNo,
        roundIndex,
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
    const { roundIndex, commentId } = JSON.parse(
      (e as CustomEvent<string>).detail,
    );
    try {
      await callApi("deleteComment", {
        groupId,
        dailyNo,
        roundIndex,
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
    const { roundIndex } = JSON.parse((e as CustomEvent<string>).detail);
    try {
      const { comments } = await callApi("getComments", {
        groupId,
        dailyNo,
        roundIndex,
      });
      window.dispatchEvent(
        new CustomEvent("tgs:chat:refreshed", {
          detail: JSON.stringify(comments),
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
    dailyNo,
    uuid,
    groupId,
    leaderboard,
    dailyResults,
    roundInfos,
    roundComments,
  });
}

run().catch((err) => console.error(err));
