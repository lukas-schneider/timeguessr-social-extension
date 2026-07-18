import { TgFinalData, TgProgressData } from "../types/timeguessr.types";

export function getTgProgressData(): TgProgressData {
  const raw = localStorage.getItem("tg_progress_daily");
  if (!raw) {
    throw new Error("progress daily not present in local storage");
  }
  return JSON.parse(raw) as TgProgressData;
}

export function getTgFinalData(): TgFinalData {
  const raw = sessionStorage.getItem("tg_final_score");
  if (!raw) {
    throw new Error("progress daily not present in local storage");
  }
  return JSON.parse(raw) as TgFinalData;
}
