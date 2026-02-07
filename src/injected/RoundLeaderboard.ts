import {RoundResultEnhancedBreakdownData} from "../types/extension.types";

export class RoundLeaderboard {
    data: RoundResultEnhancedBreakdownData;
    $modal: HTMLDivElement;
    $showBtn: HTMLAnchorElement;
    open: boolean = false;

    constructor(data: RoundResultEnhancedBreakdownData) {
        this.data = data;
        this.$modal = document.createElement("div");
        this.$modal.className = "tgs-modal";
        this.$modal.style.display = "none";
        this.$modal.innerHTML = this.getContent();
        this.$showBtn = document.createElement("a");
        this.$showBtn.className = "tgs-show-btn";
        this.$showBtn.role = "button";
        this.$showBtn.textContent = "AI Reasoning";
        this.$showBtn.addEventListener("click", () => {
            this.open = !this.open;
            if (this.open) {
                this.show();
            } else {
                this.hide();
            }
        });

        const resultsBottom = document.querySelector("div.results-bottom")!;
        resultsBottom.insertBefore(this.$showBtn, resultsBottom.querySelector("a"));

        document.body.appendChild(this.$modal);
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
    <p>
    It's so obvious that I don't even need to explain it.
    </p>
</div>
`;
    }
}
