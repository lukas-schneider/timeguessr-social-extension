import browser from "webextension-polyfill";

async function initSettings () {
    const $save = document.getElementById("save") as HTMLButtonElement;
    const $feedback = document.getElementById("feedback") as HTMLElement;
    const $serverUrl= document.getElementById("serverUrl") as HTMLInputElement;
    const $uuid = document.getElementById("uuid")  as HTMLInputElement;
    const $initials = document.getElementById("initials") as HTMLInputElement;

    const playerInfo = await browser.storage.local.get(['initials', 'uuid', 'serverUrl']);
    $serverUrl.value = playerInfo.serverUrl ?? '';
    $uuid!.value = playerInfo.uuid;
    $initials.value = playerInfo.initials ?? '';

    async function update() {
        clearFeedback();
        await browser.storage.local.set({
            serverUrl: $serverUrl.value?.trim(),
        });

        const newPlayerInfo = await browser.runtime.sendMessage({
            endpoint: '/playerInfo',
            method: 'POST',
            body: {
                uuid: $uuid.value?.trim(),
                initials: $initials.value?.trim(),
            }
        });

        if (typeof newPlayerInfo === 'object') {
            await browser.storage.local.set(newPlayerInfo);
            console.log("updated: " + JSON.stringify(newPlayerInfo));
            showSuccess();
        } else {
            showError(newPlayerInfo)
        }
    }

    function clearFeedback() {
        $save.disabled = true;
        $feedback.innerHTML = '';
        $feedback.style.display = 'none';
    }

    function showError(err: string) {
        $save.disabled = false;
        $feedback.innerHTML = err ?? 'error';
        $feedback.style.display = 'block';
        $feedback.style.color = 'red';
    }

    function showSuccess() {
        $save.disabled = false;
        $feedback.innerHTML = 'saved';
        $feedback.style.display = 'block';
        $feedback.style.color = 'green';
    }

    $save.addEventListener("click", () => update().catch(err => {
        showError(err);
    }));
}

window.addEventListener("load", () => initSettings());