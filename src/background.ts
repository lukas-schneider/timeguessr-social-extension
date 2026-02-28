import browser from "webextension-polyfill";
import { Configuration, DefaultApi } from "./api";
import { getSettings, updateSettings } from "./utils/extension.utils";
import { ApiEndpoint, ApiMessage } from "./types/extension.types";

async function migrateServerUrl() {
  console.log("Migrating server URL...");
  const { serverUrl, groupId } = (await browser.storage.local.get([
    "serverUrl",
    "groupId",
  ])) as {
    serverUrl: string;
    groupId: string;
  };
  if (serverUrl && !groupId) {
    const oldUrl = "https://qnzjnny2ch.execute-api.eu-central-1.amazonaws.com/";
    if (serverUrl.startsWith(oldUrl)) {
      const groupId = serverUrl.replace(oldUrl, "");
      console.log("Migrating server URL to group id", groupId);
      await updateSettings({ groupId });
      await browser.storage.local.remove(["serverUrl"]);
    }
  }
}

browser.runtime.onInstalled.addListener(async (details) => {
  const apiKey = await fetch(browser.runtime.getURL("api-key.txt"))
    .then((res) => res.text())
    .catch((err) => {
      console.error("Failed to load API key", err);
      return null;
    });
  if (!apiKey) {
    console.warn("API key is not available");
    return;
  }
  await updateSettings({ apiKey });

  const { uuid } = await getSettings(["uuid"]);
  if (!uuid) {
    return updateSettings({
      uuid: crypto.randomUUID(),
    });
  }

  if (
    details.reason === "update" &&
    details.previousVersion &&
    details.previousVersion < "2.0.0"
  ) {
    await migrateServerUrl();
  }
});

browser.runtime.onMessage.addListener(async (message: unknown) => {
  if (isApiMessage(message)) {
    const api = new DefaultApi(
      new Configuration({
        apiKey: (await getSettings(["apiKey"])).apiKey,
      }),
    );

    return api[message.endpoint](message.params as any);
  }

  throw new Error("Unknown message");
});

function isApiMessage<E extends ApiEndpoint>(
  message: any,
): message is ApiMessage<E> {
  return message?.type === "api";
}
