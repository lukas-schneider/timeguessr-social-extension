import {
  EnhancedBreakdownData,
  FinalResultEnhancedBreakdownData,
  RoundResultEnhancedBreakdownData,
} from "../types/extension.types";

export function getEnhancedBreakdownData(): EnhancedBreakdownData {
  const data = sessionStorage.getItem("tgs.data");
  if (!data) {
    throw new Error("data is not available");
  }
  return JSON.parse(data);
}

export function isFinalResult(
  data: EnhancedBreakdownData,
): data is FinalResultEnhancedBreakdownData {
  return (data as FinalResultEnhancedBreakdownData).leaderboard !== undefined;
}

export function isRoundResult(
  data: EnhancedBreakdownData,
): data is RoundResultEnhancedBreakdownData {
  return (data as RoundResultEnhancedBreakdownData).roundResults !== undefined;
}
