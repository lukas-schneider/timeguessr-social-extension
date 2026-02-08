import { UpdatePlayerResponse } from "./api";
import { callApi, getSettings, updateSettings } from "./utils/extension.utils";

async function initSettings() {
  const $save = document.getElementById("save") as HTMLButtonElement;
  const $feedback = document.getElementById("feedback") as HTMLElement;

  const $groupId = document.getElementById("groupId") as HTMLInputElement;
  const $uuid = document.getElementById("uuid") as HTMLInputElement;
  const $initials = document.getElementById("initials") as HTMLInputElement;

  const settings = await getSettings(["initials", "uuid", "groupId"]);
  $groupId.value = settings.groupId ?? "";
  $uuid.value = settings.uuid;
  $initials.value = settings.initials ?? "";

  async function update() {
    clearFeedback();

    const uuid = $uuid.value?.trim();
    const groupId = $groupId.value?.trim();
    const initials = $initials.value?.trim();

    if (!groupId || !uuid || !initials) {
      showError("All fields are required");
      return;
    }

    let response: UpdatePlayerResponse;
    try {
      response = await callApi("updatePlayer", {
        groupId,
        updatePlayerRequest: {
          uuid,
          initials,
        },
      });
    } catch (err: any) {
      showError(err?.message ?? "failed to update player");
      return;
    }

    await updateSettings({
      ...response,
    });

    showSuccess();
  }

  function clearFeedback() {
    $save.disabled = true;
    $feedback.textContent = "";
    $feedback.style.display = "none";
  }

  function showError(err: string) {
    $save.disabled = false;
    $feedback.textContent = err ?? "error";
    $feedback.style.display = "block";
    $feedback.style.color = "red";
  }

  function showSuccess() {
    $save.disabled = false;
    $feedback.textContent = "saved";
    $feedback.style.display = "block";
    $feedback.style.color = "green";
  }

  $save.addEventListener("click", () =>
    update().catch((err) => {
      showError(err);
    }),
  );
}

window.addEventListener("load", () => initSettings());
