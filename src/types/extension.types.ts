import {
  DailyResults,
  DefaultApi,
  GetLeaderboardResponse,
  RoundResults,
} from "../api";
import { TgRoundInfo } from "./timeguessr.types";

/**
 * Message API
 */

export interface Message {
  type: string;
}

/**
 * Server API
 */

export type ApiEndpoint = keyof DefaultApi;

export type ApiParams<E extends ApiEndpoint> = NonNullable<
  Parameters<DefaultApi[E]>[0]
>;

export type ApiResponse<E extends ApiEndpoint> = Awaited<
  ReturnType<DefaultApi[E]>
>;

export interface ApiMessage<E extends ApiEndpoint> extends Message {
  type: "api";
  endpoint: E;
  params: ApiParams<E>;
}

/**
 * Settings
 */

export interface Settings {
  uuid: string;
  groupId?: string;
  apiKey?: string;
  initials?: string;
}

/**
 * Enhanced Breakdown
 */

export interface FinalResultEnhancedBreakdownData {
  groupId: string;
  uuid: string;
  dailyNo: string;
  leaderboard: GetLeaderboardResponse;
  dailyResults: DailyResults;
  roundInfos: TgRoundInfo[];
}

export interface RoundResultEnhancedBreakdownData {
  groupId: string;
  uuid: string;
  dailyNo: string;
  roundResults: RoundResults;
  roundInfo: TgRoundInfo;
}

export type EnhancedBreakdownData =
  | FinalResultEnhancedBreakdownData
  | RoundResultEnhancedBreakdownData;
