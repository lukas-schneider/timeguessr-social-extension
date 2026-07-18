import { TgsFinalData, TgsRoundData } from "../types/extension.types";

export function getTgsRoundData(): TgsRoundData | null {
  const data = sessionStorage.getItem("tgs.data.round");
  if (!data) {
    return null;
  }
  return JSON.parse(data);
}

export function setTgsRoundData(value: TgsRoundData) {
  console.log("settings tgs data", value);
  sessionStorage.setItem("tgs.data.round", JSON.stringify(value));
}

export function getTgsFinalData(): TgsFinalData | null {
  const data = sessionStorage.getItem("tgs.data.final");
  if (!data) {
    return null;
  }
  return JSON.parse(data);
}

export function setTgsFinalData(value: TgsFinalData) {
  console.log("settings tgs data", value);
  sessionStorage.setItem("tgs.data.final", JSON.stringify(value));
}
