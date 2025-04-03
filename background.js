// import './sw-omnibox.js';
// import './sw-tips.js';

const DUDA_BASE_URL = 'https://webbuilder.localsearch.com.au/site';
let linkDataFromContent = [];

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;
    const url = new URL(tab.url);

    // Enable the side panel only for URLs that start with the base URL
    if (url.href.startsWith(DUDA_BASE_URL)) {
        await chrome.sidePanel.setOptions({
            tabId,
            path: '/html/sidepanel.html',
            enabled: true
        });
    } else {
        // Disable the side panel on all other sites
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
    }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "sendLinkData") {
        linkDataFromContent = message.data;
        console.log("Link data received from content script:", linkDataFromContent);
    }
});

// Relay the data to the side panel when it connects
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sidepanel") {
        port.postMessage({ action: "updateLinkData", data: linkDataFromContent });
    }
});

// console.log("sw-omnibox.js");
// console.log("sw-tips.js");