import "../src/style/leaderboard.css";
import { loadPlay, unloadPlay } from "../src/content/play.content-script";
import { loadFinal, unloadFinal } from "../src/content/final.content-script";

export default defineContentScript({
  matches: [
    "https://timeguessr.com/play*",
    "https://timeguessr.com/final-score*",
  ],
  main() {
    let currentPage: "play" | "final" | undefined;

    function isPlayRoute() {
      const { pathname, searchParams } = new URL(window.location.href);
      return pathname === "/play" && searchParams.get("mode") === "daily";
    }

    function isFinalRoute() {
      const { pathname } = new URL(window.location.href);
      return pathname === "/final-score";
    }

    function checkRoute() {
      if (isPlayRoute() && currentPage !== "play") {
        currentPage = "play";
        void loadPlay().catch(console.error);
      } else if (isFinalRoute() && currentPage !== "final") {
        if (currentPage === "play") {
          unloadPlay();
        }
        currentPage = "final";
        void loadFinal().catch(console.error);
      } else if (!isPlayRoute() && !isFinalRoute() && currentPage) {
        if (currentPage === "play") {
          unloadPlay();
        } else if (currentPage === "final") {
          unloadFinal();
        }
        currentPage = undefined;
      }
    }

    // Patch pushState / replaceState to hook on SPA route changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      window.dispatchEvent(new Event("locationchange"));
    };

    window.addEventListener("popstate", () => {
      window.dispatchEvent(new Event("locationchange"));
    });

    window.addEventListener("locationchange", checkRoute);

    // Run once on initial injection in case we landed directly on the target route
    checkRoute();
  },
});
