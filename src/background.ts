import browser from "webextension-polyfill";
import { Configuration, DefaultApi } from "./api";
import { getSettings, updateSettings } from "./utils/extension.utils";
import { ApiEndpoint, ApiMessage, Message } from "./types/extension.types";

browser.runtime.onInstalled.addListener(async (_details) => {
  const { uuid } = await getSettings(["uuid"]);
  if (!uuid) {
    return updateSettings({
      uuid: crypto.randomUUID(),
    });
  }

  const apiKey = await fetch(browser.runtime.getURL("api-key.txt")).then(
    (res) => res.text(),
  );
  await updateSettings({ apiKey });
});

browser.runtime.onMessage.addListener(async (message: Message) => {
  if (isApiMessage(message)) {
    const api = new DefaultApi(
      new Configuration({
        apiKey: (await getSettings(["apiKey"])).apiKey,
      }),
    );

    return api[message.endpoint](message.params as any);
  }

  throw new Error("Unknown message type: " + message.type);
});

function isApiMessage<E extends ApiEndpoint>(
  message: Message,
): message is ApiMessage<E> {
  return message.type === "api";
}
