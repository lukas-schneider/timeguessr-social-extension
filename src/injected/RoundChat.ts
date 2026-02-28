import { Comment } from "../api";
import { RoundResultEnhancedBreakdownData } from "../types/extension.types";

export class RoundChat {
  private uuid: string;
  private comments: Comment[];
  private open: boolean = false;
  private $wrapper: HTMLDivElement;
  private $panel: HTMLDivElement;
  private $messageList: HTMLDivElement;
  private $input: HTMLInputElement;
  private $toggleBtn: HTMLButtonElement;
  private $sendBtn: HTMLButtonElement;

  constructor(data: RoundResultEnhancedBreakdownData) {
    this.uuid = data.uuid;
    this.comments = data.comments ?? [];

    const photoContainer = document.getElementById("photoContainer");
    if (!photoContainer) {
      throw new Error("Could not find #photoContainer");
    }

    this.$wrapper = document.createElement("div");
    this.$wrapper.className = "tgs-chat-wrapper";
    this.$wrapper.innerHTML = `
      <button class="tgs-chat-toggle" title="Toggle chat">💬</button>
      <div class="tgs-chat-panel">
        <div class="tgs-chat-messages"></div>
        <div class="tgs-chat-input-row">
          <input class="tgs-chat-input" type="text" maxlength="500" placeholder="Message…" />
          <button class="tgs-chat-send">Send</button>
        </div>
      </div>
    `;

    this.$toggleBtn = this.$wrapper.querySelector(".tgs-chat-toggle")!;
    this.$panel = this.$wrapper.querySelector(".tgs-chat-panel")!;
    this.$messageList = this.$wrapper.querySelector(".tgs-chat-messages")!;
    this.$input = this.$wrapper.querySelector(".tgs-chat-input")!;
    this.$sendBtn = this.$wrapper.querySelector(".tgs-chat-send")!;

    photoContainer.appendChild(this.$wrapper);

    this.renderMessages();
    this.bindEvents();

    // Auto-refresh every 30 seconds
    setInterval(() => this.refresh(), 30_000);
  }

  private bindEvents() {
    // Toggle open/close
    this.$toggleBtn.addEventListener("click", () => {
      this.open = !this.open;
      this.$panel.style.display = this.open ? "flex" : "none";
    });

    // Send on button click
    this.$sendBtn.addEventListener("click", () => this.send());

    // Send on Enter key
    this.$input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        this.send();
      }
    });
  }

  private send() {
    const text = this.$input.value.trim();
    if (!text || text.length > 500) return;

    this.$input.disabled = true;
    this.$sendBtn.disabled = true;

    // detail must be a JSON string — objects in CustomEvent.detail are Xray-wrapped
    // by Firefox and inaccessible from page-context scripts
    window.dispatchEvent(new CustomEvent("tgs:chat:send", { detail: JSON.stringify({ text }) }));

    const onAdded = (e: Event) => {
      const comment: Comment = JSON.parse((e as CustomEvent<string>).detail);
      this.comments.push(comment);
      this.renderMessages();
      this.$input.value = "";
      this.$input.disabled = false;
      this.$sendBtn.disabled = false;
      window.removeEventListener("tgs:chat:error", onError);
    };

    const onError = () => {
      this.$input.disabled = false;
      this.$sendBtn.disabled = false;
      window.removeEventListener("tgs:chat:added", onAdded);
    };

    window.addEventListener("tgs:chat:added", onAdded, { once: true });
    window.addEventListener("tgs:chat:error", onError, { once: true });
  }

  private handleDelete(commentId: string, $btn: HTMLButtonElement) {
    $btn.disabled = true;

    window.dispatchEvent(new CustomEvent("tgs:chat:delete", { detail: JSON.stringify({ commentId }) }));

    window.addEventListener(
      "tgs:chat:deleted",
      (e: Event) => {
        const { commentId: deletedId }: { commentId: string } = JSON.parse((e as CustomEvent<string>).detail);
        this.comments = this.comments.filter((c) => c.commentId !== deletedId);
        this.renderMessages();
      },
      { once: true },
    );
  }

  private refresh() {
    window.dispatchEvent(new CustomEvent("tgs:chat:refresh"));

    window.addEventListener(
      "tgs:chat:refreshed",
      (e: Event) => {
        this.comments = JSON.parse((e as CustomEvent<string>).detail);
        this.renderMessages();
      },
      { once: true },
    );
  }

  private renderMessages() {
    this.$messageList.innerHTML = "";

    for (const comment of this.comments) {
      const $msg = document.createElement("div");
      $msg.className = "tgs-chat-msg";

      const isOwn = comment.playerUuid === this.uuid;
      const prefix = this.escapeHtml(comment.initials.slice(0, 3));

      $msg.innerHTML = `<span><strong>${prefix}:</strong> ${this.escapeHtml(comment.text)}</span>`;

      if (isOwn) {
        const $del = document.createElement("button");
        $del.className = "tgs-chat-delete";
        $del.textContent = "🗑";
        $del.title = "Delete message";
        $del.addEventListener("click", () => this.handleDelete(comment.commentId, $del));
        $msg.appendChild($del);
      }

      this.$messageList.appendChild($msg);
    }

    this.$messageList.scrollTop = this.$messageList.scrollHeight;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

