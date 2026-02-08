import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";

function generateManifest() {
  const browser = process.env.TARGET_BROWSER || "chrome";
  const manifestFile = `src/manifest.${browser}.json`;
  const manifest = readJsonFile(manifestFile);
  const pkg = readJsonFile("package.json");
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

export default defineConfig({
  build: {
    outDir:
      process.env.TARGET_BROWSER === "firefox" ? "dist-firefox" : "dist-chrome",
  },
  plugins: [
    webExtension({
      manifest: generateManifest,
      watchFilePaths: [
        "package.json",
        "src/manifest.chrome.json",
        "src/manifest.firefox.json",
      ],
      additionalInputs: ["src/injected/enhancedBreakdown.ts"],
    }),
  ],
});
