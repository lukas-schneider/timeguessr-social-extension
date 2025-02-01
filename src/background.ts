import browser from "webextension-polyfill";

browser.runtime.onInstalled.addListener((_details) => {
    browser.storage.local.get(['uuid']).then(({uuid}) => {
        if (!uuid) {
            return browser.storage.local.set({
                uuid: crypto.randomUUID(),
            });
        }
        return Promise.resolve();
    }).catch(err => console.error(err));
});

browser.runtime.onMessage.addListener(async function (request, _sender, _sendResponse) {
    try {
        const {serverUrl} = await browser.storage.local.get(['serverUrl']);
        if (!serverUrl) {
            return "missing serverUrl";
        }
        let response: Response = await fetch(serverUrl + request.endpoint, {
            method: request.method,
            headers: request.method === 'POST' ? {
                'Content-Type': 'application/json'
            } : {},
            body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
        });
        return await parse(response);
    } catch (err: any) {
        return await err?.message ?? err;
    }
});

function parse(response: Response): Promise<string | any> {
    if (response.status >= 400) {
        return response.text();
    } else {
        return response.json();
    }
}