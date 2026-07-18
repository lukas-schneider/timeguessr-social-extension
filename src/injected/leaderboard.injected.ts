import { TgsFinalData } from "../types/extension.types";
import { getTgFinalData } from "../utils/timeguessr.utils";
import { getTgsFinalData } from "../utils/utils";
import { Leaderboard } from "./Leaderboard";

function init(tgsFinalData: TgsFinalData, container: HTMLElement) {
  new Leaderboard(tgsFinalData, container);
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

  const container = document.querySelector("div.results-overlay");
  if (!container || !(container instanceof HTMLElement)) {
    console.log("results-overlay not present, retrying...");
    retry();
    return;
  }

  init(tgsFinalData, container);
}

wait();
