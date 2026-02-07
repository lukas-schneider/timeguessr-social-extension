import { TgRoundInfo, TgRoundResultKey } from "../types/timeguessr.types";

export function getDailyNo(): string {
  let dailyNo = localStorage.getItem("dailyNumber");
  if (!dailyNo) {
    throw new Error("dailyNo is not available");
  }
  return dailyNo;
}

export function getRoundIndex() {
  if (localStorage.getItem("showResultsFive")) {
    return 4;
  } else if (localStorage.getItem("showResultsFour")) {
    return 3;
  } else if (localStorage.getItem("showResultsThree")) {
    return 2;
  } else if (localStorage.getItem("showResultsTwo")) {
    return 1;
  } else if (localStorage.getItem("showResultsOne")) {
    return 0;
  } else {
    throw new Error("missing roundIndex");
  }
}

export function getRoundInfos(): TgRoundInfo[] {
  const dailyArrayStr = localStorage.getItem("dailyArray");
  if (!dailyArrayStr) {
    throw new Error("dailyArray is not available");
  }
  return normalizeDailyArray(JSON.parse(dailyArrayStr));
}

function normalizeDailyArray(input: any) {
  if (!Array.isArray(input)) {
    throw new Error("dailyArray is not an array");
  }

  const dailyArray: TgRoundInfo[] = input?.filter(
    (obj) => typeof obj === "object",
  );
  if (dailyArray?.length !== 5) {
    throw new Error("dailyArray length is not 5");
  }

  const nos = dailyArray.map((round) => parseInt(round.No));
  const maxNo = Math.max(...nos);
  return dailyArray.map((round) => {
    return {
      ...round,
      No: String(maxNo),
    };
  });
}

export function getRoundResultValue(key: TgRoundResultKey): string | null {
  return localStorage.getItem(key);
}
