const DUDA_BASE_URL = 'https://webbuilder.localsearch.com.au/site';
let linkDataFromContent = [];

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (!tab.url) return;
    const url = new URL(tab.url);
    // Enable the side panel when the URL starts with DUDA_BASE_URL
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
    try {
        if (message.action === "sendLinkData" && Array.isArray(message.data)) {
            linkDataFromContent = message.data;
            console.log("Link data received from content script:", linkDataFromContent);
        } else {
            console.warn("Invalid message data received:", message);
        }
    } catch (error) {
        console.error("Error processing message from content script:", error);
    }
});

// Relay the data to the side panel when it connects
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "sidepanel") {
        try {
            port.postMessage({ action: "updateLinkData", data: linkDataFromContent });
        } catch (error) {
            console.error("Error relaying data to side panel:", error);
        }
    } else {
        console.warn("Unexpected port connection:", port.name);
    }
});
