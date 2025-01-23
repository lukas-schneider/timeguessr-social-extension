
async function initSettings () {
    const $save = document.getElementById("save");
    const $feedback = document.getElementById("feedback");
    const $serverUrl = document.getElementById("serverUrl");
    const $uuid = document.getElementById("uuid");
    const $initials = document.getElementById("initials");

    const playerInfo = await chrome.storage.local.get(['initials', 'uuid', 'serverUrl']);
    $serverUrl.value = playerInfo.serverUrl ?? '';
    $uuid.value = playerInfo.uuid;
    $initials.value = playerInfo.initials ?? '';

    async function update() {
        clearFeedback();
        await chrome.storage.local.set({
            serverUrl: $serverUrl.value?.trim(),
        });

        const newPlayerInfo = await chrome.runtime.sendMessage({
            endpoint: '/playerInfo',
            method: 'POST',
            body: {
            uuid: $uuid.value?.trim(),
            initials: $initials.value?.trim(),
            }
        });

        if (typeof newPlayerInfo === 'object') {
            await chrome.storage.local.set(newPlayerInfo);
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

    function showError(err) {
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