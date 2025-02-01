import { isFinalResult, isRoundResult } from "./utils";
import { EnhancedBreakdownData } from "../types/extension.types";
import { TgRoundInfo } from "../types/timeguessr.types";
import { RoundResults } from "../api";

const BLUE = "#0090a7";

export class EnhancedMap {
  data: EnhancedBreakdownData;
  map: mapkit.Map;
  items: (mapkit.Annotation | mapkit.Overlay)[][];

  constructor(data: EnhancedBreakdownData) {
    this.data = data;
    this.map = mapkit?.maps?.[0];
    if (!this.map) {
      throw new Error("cannot access map");
    }
    this.map.padding = new mapkit.Padding({
      top: 50,
      left: 50,
      right: 50,
      bottom: 50,
    });

    if (isFinalResult(data)) {
      this.items = [0, 1, 2, 3, 4].map((i) =>
        this.createItems(data.roundInfos[i], data.dailyResults[i]),
      );
      setTimeout(() => this.show(-1), 0);
    } else if (isRoundResult(data)) {
      this.items = [this.createItems(data.roundInfo, data.roundResults)];
      setTimeout(() => this.show(0), 0);
    } else {
      throw new Error("invalid data");
    }
  }

  show(index: number) {
    this.map.removeAnnotations(this.map.annotations);
    this.map.removeOverlays(this.map.overlays);

    if (index === -1) {
      this.map.showItems(this.items.flat());
    } else {
      this.map.showItems(this.items[index]);
    }
  }

  createItems(roundInfo: TgRoundInfo, roundResults: RoundResults) {
    const trueLat = Number(roundInfo.Location.lat);
    const trueLon = Number(roundInfo.Location.lng);
    const trueAnnotation = new mapkit.MarkerAnnotation(
      new mapkit.Coordinate(trueLat, trueLon),
      {
        color: "#DB5049",
        title: roundInfo.Year,
      },
    );

    const playerItems = roundResults.flatMap((playerResult) => {
      const isLocalUser = playerResult.uuid === this.data.uuid;
      const { latitude, longitude } = playerResult;
      const guessAnnotation = new mapkit.MarkerAnnotation(
        new mapkit.Coordinate(latitude, longitude),
        {
          color: isLocalUser ? BLUE : "black",
          glyphText: playerResult.initials,
          glyphColor: "white",
          title: playerResult.guessedYear + "",
          subtitle: playerResult.totalPoints + " points",
        },
      );

      // line
      const lineCoords = this.adjustForShortestPath([
        [latitude, longitude],
        [trueLat, trueLon],
      ]);

      const style = new mapkit.Style({
        lineWidth: 1.5,
        lineJoin: "round",
        lineDash: [8, 6],
        strokeColor: isLocalUser ? BLUE : "black",
      });
      const overlay = new mapkit.PolylineOverlay(lineCoords, { style: style });

      return [guessAnnotation, overlay];
    });

    return [trueAnnotation, ...playerItems];
  }

  adjustForShortestPath(points: [[number, number], [number, number]]) {
    let startLon = this.normalizeLongitude(Number(points[0][1]));
    let endLon = this.normalizeLongitude(Number(points[1][1]));

    // Check if crossing the date line is shorter
    if (Math.abs(endLon - startLon) > 180) {
      if (endLon > startLon) {
        points[1][1] = endLon - 360;
      } else {
        points[1][1] = endLon + 360;
      }
    }
    return points.map(
      (point) => new mapkit.Coordinate(Number(point[0]), point[1]),
    );
  }

  normalizeLongitude(lon: number) {
    lon = lon % 360;
    if (lon > 180) {
      lon -= 360;
    } else if (lon < -180) {
      lon += 360;
    }
    return lon;
  }
}
