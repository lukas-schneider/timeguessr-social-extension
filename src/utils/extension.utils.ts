import browser from "webextension-polyfill";
import {
  ApiEndpoint,
  ApiParams,
  ApiResponse,
  Settings,
} from "../types/extension.types";

export async function getSettings<K extends keyof Settings>(
  keys: K[],
): Promise<Pick<Settings, K>> {
  return (await browser.storage.local.get(keys)) as any as Settings;
}

export async function updateSettings(settings: Partial<Settings>) {
  await browser.storage.local.set(settings);
}

export function callApi<E extends ApiEndpoint>(
  endpoint: E,
  params: ApiParams<E>,
): Promise<ApiResponse<E>> {
  return browser.runtime.sendMessage({
    type: "api",
    endpoint,
    params,
  });
}
