import { FinalResultEnhancedBreakdownData } from "../types/extension.types";
import type { AllTimeLeaderboardEntry } from "../api";

export class Leaderboard {
  data: FinalResultEnhancedBreakdownData;
  div: HTMLDivElement;

  constructor(data: FinalResultEnhancedBreakdownData) {
    if (!data.leaderboard.today || !data.leaderboard.allTime) {
      throw new Error("missing leaderboard data");
    }

    this.data = data;
    this.div = document.createElement("div");
    this.div.className = "tgs-leaderboard-container";

    // All dynamic values in getContent() are sanitized using escapeHtml to prevent XSS.
    // This is necessary for rendering the modal structure.
    this.div.innerHTML = this.getContent();

    const container = document.getElementById("resultsContainer")!;
    // insert div as second child, after the breakdown header
    container.insertBefore(this.div, container.children[1]);
  }

  getContent() {
    return `
<div class="tgs-daily">
    <h3>Daily ${this.escapeHtml(this.data.dailyNo)}</h3>
    <table>
    <tbody>
        ${this.data.leaderboard.today
          ?.map(
            (item: any, _index: number) => `
            <tr class="${item.playerUuid === this.data.uuid ? "its-you" : ""}">
                <td class="tgs-score">${item.score}</td>
                <td class="tgs-initials">${this.escapeHtml(item.initials)}</td>
            </tr>
        `,
          )
          .join("")}
        </tbody>
    </table>
</div>
<div class="tgs-all-time">
    <h3>All Time Top 5</h3>
    <table>
    <tbody>
        ${this.data.leaderboard.allTime
          ?.map(
            (item: AllTimeLeaderboardEntry, _index: number) => `
            <tr class="${item.uuid === this.data.uuid ? "tgs-its-you" : ""}">
                <td class="tgs-initials">${this.escapeHtml(item.initials)}</td>
                <td class="tgs-daily-date">${this.escapeHtml(item.dailyDate)}</td>
                <td class="tgs-score">${item.score}</td>
            </tr>
        `,
          )
          .join("")}
    </tbody>
    </table>
</div>`;
  }

  escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
