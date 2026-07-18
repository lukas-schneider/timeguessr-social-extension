import { callApi, getSettings } from "../utils/extension.utils";
import { getTgFinalData } from "../utils/timeguessr.utils";
import { setTgsFinalData } from "../utils/utils";
import { injectEnhancedFinalMap, injectLeaderboard } from "./utils";

async function loadData(uuid: string, groupId: string) {
  const data = getTgFinalData();
  const dailyNo = data.dailyNumber;

  const [dailyResults, leaderboard] = await Promise.all([
    callApi("getDailyResults", { groupId, dailyNo }),
    callApi("getLeaderboard", { groupId, dailyNo }),
  ]);

  setTgsFinalData({
    groupId,
    uuid,
    dailyNo,
    leaderboard,
    dailyResults,
    roundInfos: data.playArray,
  });
}

let globalClickListener: EventListener;

export async function loadFinal() {
  const { uuid, groupId } = await getSettings(["uuid", "groupId"]);
  if (!groupId) {
    throw new Error("groupId is not available");
  }

  globalClickListener = (e: Event) => {
    if (e.target instanceof HTMLElement) {
      if (e.target.matches("button.bottom-link")) {
        if (e.target.innerText?.trim() === "Breakdown") {
          injectEnhancedFinalMap();

          // remove after one invocation
          document.body.removeEventListener("click", globalClickListener, {
            capture: true,
          });
        }
      }
      if (e.target.matches("div.round-card")) {
        // prevent default map zoom / focusing
        e.stopImmediatePropagation();
      }
    }
  };
  document.body.addEventListener("click", globalClickListener, {
    capture: true,
  });

  await loadData(uuid, groupId);

  injectLeaderboard();
}

export function unloadFinal() {
  if (globalClickListener) {
    document.body.removeEventListener("click", globalClickListener, {
      capture: true,
    });
  }
}
