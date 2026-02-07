import {
  getDailyNo,
  getRoundIndex,
  getRoundInfos,
} from "../utils/timeguessr.utils";
import { callApi, getSettings } from "../utils/extension.utils";

async function run() {
  const dailyNo = getDailyNo();
  const { groupId } = await getSettings(["groupId"]);
  if (!groupId) {
    throw new Error("groupId is not available");
  }

  const roundIndex = getRoundIndex();
  const roundInfos = getRoundInfos();
  const roundInfo = roundInfos[roundIndex];

  // submit image for AI guess
  await callApi("submitImage", {
    groupId,
    dailyNo,
    roundIndex: String(roundIndex),
    submitImageRequest: {
      imageUrl: roundInfo.URL,
      actualLatitude: roundInfo.Location.lat,
      actualLongitude: roundInfo.Location.lng,
      actualYear: Number(roundInfo.Year),
    },
  });
  console.log("Submitted image for AI guess");
}

run().catch((err) => console.error(err));
