let $feedback;

function showError(err) {
    $feedback.innerHTML = err ?? 'error';
    $feedback.style.display = 'block';
    $feedback.style.color = 'red';
}

function createRows(items, ...columns) {
    return items.map(item => {
        const $row = document.createElement("tr");
        const cells = columns.map(col => {
            const value = item[col];
            const $td = document.createElement("td");
            $td.innerHTML = value;
            return $td;
        });
        $row.append(...cells);
        return $row;
    });
}

async function initLeaderboard(groupId) {
    const $feedback = document.getElementById("feedback");

    function showError(err) {
        $feedback.innerHTML = err ?? 'error';
        $feedback.style.display = 'block';
        $feedback.style.color = 'red';
    }

    const $leaderboard = document.getElementById("leaderboard");
    $leaderboard.innerHTML = '';

    const items = await chrome.runtime.sendMessage({
        type: 'getLeaderboard',
        groupId: groupId,
        dailyNo: '',
    });

    if (!Array.isArray(items)) {
        showError(items);
        return;
    }

    console.log(items);

    $leaderboard.append(...createRows(items, "score", "initials", "dailyDate"));
}

async function initDailyLeaderboard(groupId) {
    const $results = document.getElementById("daily-leaderboard");
    $results.innerHTML = '';

    const {dailyNo} = await chrome.runtime.sendMessage({
        type: 'getCurrentDailyNo',
    });

    const items = await chrome.runtime.sendMessage({
        type: 'getLeaderboard',
        groupId: groupId,
        dailyNo: dailyNo,
    });

    if (!Array.isArray(items)) {
        showError(items);
        return;
    }

    console.log(items);

    $results.append(...createRows(items, "score", "initials"));
}

window.addEventListener("load", () => {
    $feedback = document.getElementById("feedback")
    chrome.storage.local.get(["groupId"])
        .then(({groupId}) =>
            Promise.all([
                initLeaderboard(groupId),
                initDailyLeaderboard(groupId)
            ]))
        .catch(err => {
            console.error(err);
            showError(err?.message ?? err);
        });
});