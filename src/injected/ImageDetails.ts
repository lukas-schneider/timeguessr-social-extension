import { FinalResultEnhancedBreakdownData } from "../types/extension.types";
import { RoundChat } from "./RoundChat";

export class ImageDetails {
  data: FinalResultEnhancedBreakdownData;

  $div: HTMLDivElement;
  $img: HTMLImageElement;
  $description: HTMLElement;
  $wrapper: HTMLElement;

  wheelZoom: WheelZoom;
  chats: RoundChat[];

  constructor(data: FinalResultEnhancedBreakdownData) {
    this.data = data;
    this.$div = document.createElement("div");
    this.$div.style.display = "none";

    // All dynamic values in getContent() are sanitized using escapeHtml to prevent XSS.
    // This is necessary for rendering the modal structure.
    this.$div.innerHTML = this.getContent();
    this.$img = this.$div.querySelector(".tgs-image")!;
    this.wheelZoom = new WheelZoom(this.$img);

    this.$description = this.$div.querySelector(".tgs-image-description")!;
    this.$wrapper = this.$div.querySelector(".tgs-image-wrapper")!;
    document.body.appendChild(this.$div);

    this.$div
      .querySelector(".tgs-close-button")!
      .addEventListener("click", () => this.hide());

    // Create one RoundChat per round, mounted inside the image-details block.
    // autoRefresh is off — we refresh manually when the panel is opened.
    this.chats = [0, 1, 2, 3, 4].map(
      (i) =>
        new RoundChat({
          uuid: data.uuid,
          roundIndex: String(i),
          comments: data.roundComments?.[i] ?? [],
          container: this.$wrapper,
          autoRefresh: false,
        }),
    );
    // Hide all chat panels initially; they are shown per round in show()
    this.chats.forEach((c) => c.hidePanel());
  }

  getContent() {
    return `
<div class="tgs-image-details-block">
    <div class="tgs-close-button">Close</div>
    <div class="tgs-image-wrapper"><img class="tgs-image" src="" alt=""></div>
    <p class="tgs-image-description"></p>
</div>
        `;
  }

  show(index: any) {
    const dailyInfo = this.data.roundInfos[index];
    this.$description!.textContent = `${dailyInfo.Year}, ${dailyInfo.Country}: ${dailyInfo.Description}`;
    this.$img.src = dailyInfo.URL;
    this.$div.style.display = "block";

    // Show only the chat for this round, hide the others
    this.chats.forEach((c, i) => {
      if (i === index) {
        c.showPanel();
        c.refresh();
      } else {
        c.hidePanel();
      }
    });
  }

  hide() {
    this.$div.style.display = "none";
    this.wheelZoom.reset();
    this.chats.forEach((c) => c.hidePanel());
  }
}

class WheelZoom {
  $img: HTMLImageElement;

  settings = {
    zoom: 0.06,
    maxZoom: 7,
    initialZoom: 1,
    initialX: 0.5,
    initialY: 0.5,
  };

  width?: number;
  height?: number;
  bgWidth?: number;
  bgHeight?: number;
  bgPosX?: number;
  bgPosY?: number;
  previousEvent?: MouseEvent;
  transparentSpaceFiller?: string;

  constructor(img: HTMLImageElement) {
    this.reset = this.reset.bind(this);
    this.onwheel = this.onwheel.bind(this);
    this.drag = this.drag.bind(this);
    this.removeDrag = this.removeDrag.bind(this);
    this.draggable = this.draggable.bind(this);
    this.load = this.load.bind(this);
    this.$img = img;

    if (this.$img.complete) {
      this.load();
    }
    this.$img.addEventListener("load", this.load);
  }

  load() {
    const initial = Math.max(this.settings.initialZoom, 1);

    if (this.$img.src === this.transparentSpaceFiller) return;

    const computedStyle = window.getComputedStyle(this.$img, null);

    this.width = parseInt(computedStyle.width, 10);
    this.height = parseInt(computedStyle.height, 10);
    this.bgWidth = this.width * initial;
    this.bgHeight = this.height * initial;
    this.bgPosX = -(this.bgWidth - this.width) * this.settings.initialX;
    this.bgPosY = -(this.bgHeight - this.height) * this.settings.initialY;

    this.setSrcToBackground();

    this.$img.style.backgroundSize =
      this.bgWidth + "px " + this.bgHeight + "px";
    this.$img.style.backgroundPosition =
      this.bgPosX + "px " + this.bgPosY + "px";
    this.$img.addEventListener("wheelzoom.reset", this.reset);

    this.$img.addEventListener("wheel", this.onwheel);
    this.$img.addEventListener("mousedown", this.draggable);
  }

  setSrcToBackground() {
    this.$img.style.backgroundRepeat = "no-repeat";
    this.$img.style.backgroundImage = 'url("' + this.$img.src + '")';
    this.transparentSpaceFiller =
      "data:image/svg+xml;base64," +
      window.btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" width="' +
          this.$img.naturalWidth +
          '" height="' +
          this.$img.naturalHeight +
          '"></svg>',
      );
    this.$img.src = this.transparentSpaceFiller;
  }

  updateBgStyle() {
    if (this.bgPosX! > 0) {
      this.bgPosX = 0;
    } else if (this.bgPosX! < this.width! - this.bgWidth!) {
      this.bgPosX = this.width! - this.bgWidth!;
    }

    if (this.bgPosY! > 0) {
      this.bgPosY = 0;
    } else if (this.bgPosY! < this.height! - this.bgHeight!) {
      this.bgPosY = this.height! - this.bgHeight!;
    }

    this.$img.style.backgroundSize =
      this.bgWidth + "px " + this.bgHeight + "px";
    this.$img.style.backgroundPosition =
      this.bgPosX + "px " + this.bgPosY + "px";
  }

  reset() {
    this.bgWidth = this.width;
    this.bgHeight = this.height;
    this.bgPosX = this.bgPosY = 0;
    this.updateBgStyle();
  }

  onwheel(e: WheelEvent) {
    e.preventDefault();

    let deltaY = 0;
    if (e.deltaY) {
      // FireFox 17+ (IE9+, Chrome 31+?)
      deltaY = e.deltaY;
    }

    // As far as I know, there is no good cross-browser way to get the cursor position relative to the event target.
    // We have to calculate the target element's position relative to the document, and subtrack that from the
    // cursor's position relative to the document.
    const rect = this.$img.getBoundingClientRect();
    const offsetX = e.pageX - rect.left - window.pageXOffset;
    const offsetY = e.pageY - rect.top - window.pageYOffset;

    // Record the offset between the bg edge and cursor:
    const bgCursorX = offsetX - this.bgPosX!;
    const bgCursorY = offsetY - this.bgPosY!;

    // Use the previous offset to get the percent offset between the bg edge and cursor:
    const bgRatioX = bgCursorX / this.bgWidth!;
    const bgRatioY = bgCursorY / this.bgHeight!;

    // Update the bg size:
    if (deltaY < 0) {
      this.bgWidth! += this.bgWidth! * this.settings.zoom;
      this.bgHeight! += this.bgHeight! * this.settings.zoom;
    } else {
      this.bgWidth! -= this.bgWidth! * this.settings.zoom;
      this.bgHeight! -= this.bgHeight! * this.settings.zoom;
    }

    if (this.settings.maxZoom) {
      this.bgWidth = Math.min(
        this.width! * this.settings.maxZoom,
        this.bgWidth!,
      );
      this.bgHeight = Math.min(
        this.height! * this.settings.maxZoom,
        this.bgHeight!,
      );
    }

    // Take the percent offset and apply it to the new size:
    this.bgPosX = offsetX - this.bgWidth! * bgRatioX;
    this.bgPosY = offsetY - this.bgHeight! * bgRatioY;

    // Prevent zooming out beyond the starting size
    if (this.bgWidth! <= this.width! || this.bgHeight! <= this.height!) {
      this.reset();
    } else {
      this.updateBgStyle();
    }
  }

  drag(e: MouseEvent) {
    e.preventDefault();
    this.bgPosX! += e.pageX - this.previousEvent!.pageX;
    this.bgPosY! += e.pageY - this.previousEvent!.pageY;
    this.previousEvent = e;
    this.updateBgStyle();
  }

  removeDrag() {
    document.removeEventListener("mouseup", this.removeDrag);
    document.removeEventListener("mousemove", this.drag);
  }

  // Make the background draggable
  draggable(e: MouseEvent) {
    e.preventDefault();
    this.previousEvent = e;
    document.addEventListener("mousemove", this.drag);
    document.addEventListener("mouseup", this.removeDrag);
  }
}
