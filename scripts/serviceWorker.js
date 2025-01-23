chrome.runtime.onInstalled.addListener((_details) => {
    chrome.storage.local.get(['uuid']).then(({uuid}) => {
        if (!uuid) {
            return chrome.storage.local.set({
                uuid: crypto.randomUUID(),
            });
        }
    }).catch(err => console.error(err));
});

const baseUrl = 'https://tnaqn31jje.execute-api.eu-central-1.amazonaws.com/default';
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.storage.local.get(['serverUrl']).then(({serverUrl}) => {
        if (!serverUrl) {
            throw new Error("missing serverUrl");
        }
        return fetch(serverUrl + request.endpoint, {
            method: request.method,
            headers: request.method === 'POST' ? {
                'Content-Type': 'application/json'
            } : {},
            body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
        })
    }).then(parse)
        .then(body => sendResponse(body))
        .catch(err => sendResponse(err?.message ?? err));
    return true;
});

function parse(response) {
    if (response.status >= 400) {
        return response.text();
    } else {
        return response.json();
    }
}