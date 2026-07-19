import { defineConfig } from "wxt";

export default defineConfig({
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: "Timeguessr Social Extension",
    icons: { 32: "icon/32.png" },
    permissions: ["storage"],
    web_accessible_resources: [
      {
        resources: [
          "enhanced-map.js",
          "enhanced-final-map.js",
          "leaderboard.js",
        ],
        matches: ["https://timeguessr.com/*"],
      },
    ],
    ...(browser === "firefox" && {
      browser_specific_settings: {
        gecko: {
          id: "timeguessr-social@extension.com",
          data_collection_permissions: {
            required: ["websiteContent", "websiteActivity"],
          },
        },
      },
    }),
  }),
  webExt: {
    binaries: {
      "chrome": "/usr/bin/brave-browser",
      "firefox": "/usr/bin/firefox",
    },
    firefoxProfile: `${process.env.HOME}/snap/firefox/common/.mozilla/firefox/wxt-dev`,
    keepProfileChanges: true,
    startUrls: ["https://timeguessr.com"],
    openDevtools: true,
  },
});
