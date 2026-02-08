import { RoundResultEnhancedBreakdownData } from "../types/extension.types";
import { AiGuessInfo } from "../api";
import { TgRoundInfo } from "../types/timeguessr.types";

export class AIGuessInfoModal {
  aiGuessInfo: AiGuessInfo;
  roundInfo: TgRoundInfo;
  aiRoundResult: any;
  $modal: HTMLDivElement;
  $showBtn: HTMLAnchorElement;
  open: boolean = false;

  constructor(data: RoundResultEnhancedBreakdownData) {
    let aiRoundResult = data.roundResults.find((rr) => rr.aiGuess);
    if (!aiRoundResult) {
      throw new Error("No AI guess info available");
    }
    this.aiGuessInfo = aiRoundResult.aiGuess!;
    this.aiRoundResult = aiRoundResult;
    this.roundInfo = data.roundInfo;
    this.$modal = document.createElement("div");
    this.$modal.className = "tgs-modal";
    this.$modal.style.display = "none";
    this.$modal.innerHTML = this.getContent();
    this.$showBtn = document.createElement("a");
    this.$showBtn.className = "tgs-show-btn";
    this.$showBtn.role = "button";
    this.$showBtn.textContent = "Learn from GPT";
    this.$showBtn.addEventListener("click", () => {
      this.open = !this.open;
      if (this.open) {
        this.show();
      } else {
        this.hide();
      }
    });

    const resultsBottom = document.querySelector("div.results-bottom");
    if (!resultsBottom) {
      throw new Error("Could not find results bottom element");
    }
    resultsBottom.insertBefore(this.$showBtn, resultsBottom.querySelector("a"));

    document.body.appendChild(this.$modal);

    // Add close button handler
    const closeBtn = this.$modal.querySelector(".tgs-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.open = false;
        this.hide();
      });
    }

    // Close when clicking outside the content
    this.$modal.addEventListener("click", (e) => {
      if (e.target === this.$modal) {
        this.open = false;
        this.hide();
      }
    });
  }

  show() {
    this.$modal.style.display = "block";
  }

  hide() {
    this.$modal.style.display = "none";
  }

  getContent() {
    return `
<div class="tgs-content">
    <div class="tgs-ai-header">
      <h2 class="tgs-ai-title">GPT's Guess</h2>
      <button class="tgs-close-btn">&times;</button>
    </div>

    <div class="tgs-ai-section">
      <div class="tgs-ai-stats-grid">
        <div class="tgs-ai-stat-box tgs-ai-stat-highlight">
          <span class="tgs-ai-stat-label">Total Points</span>
          <span class="tgs-ai-stat-value">${this.aiRoundResult.totalPoints}</span>
        </div>
        <div class="tgs-ai-stat-box">
          <span class="tgs-ai-stat-label">Location</span>
          <span class="tgs-ai-stat-value">${this.aiRoundResult.locationPoints} pts</span>
        </div>
        <div class="tgs-ai-stat-box">
          <span class="tgs-ai-stat-label">Distance Off</span>
          <span class="tgs-ai-stat-value">${this.escapeHtml(this.aiRoundResult.distanceOff)}</span>
        </div>
        <div class="tgs-ai-stat-box">
          <span class="tgs-ai-stat-label">Time</span>
          <span class="tgs-ai-stat-value">${this.aiRoundResult.timePoints} pts</span>
        </div>
        <div class="tgs-ai-stat-box">
          <span class="tgs-ai-stat-label">Years Off</span>
          <span class="tgs-ai-stat-value">${this.aiRoundResult.yearsOff}</span>
        </div>
      </div>
    </div>

    <div class="tgs-ai-section">
      <div class="tgs-ai-guess-details">
        <div><strong>Year:</strong> ${this.aiGuessInfo.year} | <strong>Location:</strong> ${this.escapeHtml(this.aiGuessInfo.locationName)}</div>
        <div><strong>Coordinates:</strong> ${this.aiGuessInfo.location.latitude.toFixed(4)}, ${this.aiGuessInfo.location.longitude.toFixed(4)}</div>
      </div>
    </div>
    
    <div class="tgs-ai-section">
      <h3 class="tgs-ai-section-title">AI Reasoning</h3>
      <p class="tgs-ai-reasoning">${this.escapeHtml(this.aiGuessInfo.reasoning)}</p>
    </div>
    
    <div class="tgs-ai-section">
      <h3 class="tgs-ai-section-title">Prompt</h3>
      <pre class="tgs-ai-prompt">${this.escapeHtml(this.aiGuessInfo.prompt)}</pre>
    </div>
    
    <div class="tgs-ai-footer">
      <span class="tgs-ai-model">Model: ${this.escapeHtml(this.aiGuessInfo.model)}</span>
    </div>
</div>
`;
  }

  escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}
