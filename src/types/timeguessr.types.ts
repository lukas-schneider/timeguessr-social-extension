export interface TgProgressData {
  mode: "daily" | string;
  playArray: TgRoundInfo[];
  dailyNumber: string;
  round: number;
  phase: "results" | "guess";
  currentResult?: TgRoundResult;
  roundResults: TgRoundResult[];
  score: number;
}

export interface TgFinalData {
  mode: "daily" | string;
  playArray: TgRoundInfo[];
  dailyNumber: string;
  roundResults: TgRoundResult[];
  score: number;
}

export interface TgRoundResult {
  guessCoords: TgCoords;
  actualCoords: TgCoords;
  distanceMeters: number;
  distanceScoreValue: number;

  guessYear: number;
  actualYear: number;
  yearScoreValue: number;

  totalScore: number;
}

export interface TgCoords {
  lat: number;
  lng: number;
}

export interface TgRoundInfo {
  No: string;
  DailyId: string;
  ImageId: string;
  Country: string;
  Description: string;
  License: string;
  Location: TgCoords;
  URL: string;
  Year: string;
}
