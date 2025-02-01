export interface TgRoundInfo {
  No: string;
  Country: string;
  Description: string;
  License: string;
  Location: {
    lat: number;
    lng: number;
  };
  URL: string;
  Year: string;
}

export type TgRoundName = "one" | "two" | "three" | "four" | "five";
export type TgRoundKeySuffix =
  | "Total"
  | "Geo"
  | "Time"
  | "Distance"
  | "Lt"
  | "Lng"
  | "TrueLt"
  | "TrueLng"
  | "Year";
export type TgRoundResultKey =
  | `${TgRoundName}${TgRoundKeySuffix}`
  | "yearStorage";

export const tgRoundNames: TgRoundName[] = [
  "one",
  "two",
  "three",
  "four",
  "five",
];
