chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Command handler setup
let commandFunctions = {
    "toggle_newTab": getDataFromWebsite,
    "show_link_checker": messageshow
};

let linkDataFromContent = [];
let sidePanelTabId = null;

// Handle keyboard shortcut commands
chrome.commands.onCommand.addListener((command) => {
    console.log(`Command received: ${command}`);
    if (commandFunctions[command]) {
        commandFunctions[command]();
    } else {
        console.log(`Command ${command} not found`);
    }
});

// On tab update, check saved state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.storage.sync.get(["keyState", "getData"], (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving storage data:", chrome.runtime.lastError.message);
                return;
            }

            if (data.keyState) {
                console.log("Key State Data:", data.keyState);
            } else {
                console.warn("keyState is not set in storage.");
            }

            if (data.getData) {
                console.log("getData State:", data.getData);
            } else {
                console.warn("getData is not set in storage.");
            }
        });
    }
});

// Receive data from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "sendLinkData" && Array.isArray(message.data)) {
            linkDataFromContent = message.data;
            console.log("Link data received from content script:", linkDataFromContent);

            if (sidePanelTabId !== null) {
                chrome.tabs.get(sidePanelTabId, (tab) => {
                    if (chrome.runtime.lastError || !tab) {
                        openSidePanel(linkDataFromContent);
                    } else {
                        chrome.tabs.sendMessage(sidePanelTabId, {
                            action: "updateLinkData",
                            data: linkDataFromContent
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error("Error sending message to side panel:", chrome.runtime.lastError.message);
                            }
                        });
                    }
                });
            } else {
                openSidePanel(linkDataFromContent);
            }
        } else if (message.action === "getData") {
            startProcessing(message.data === "show");
        } else {
            console.warn("Unsupported or invalid message:", message);
        }
    } catch (error) {
        console.error("Error in onMessage listener:", error);
    }
});

// Open side panel and inject data
function openSidePanel(data) {
    chrome.tabs.create({ url: "/html/sidepanel.html" }, (tab) => {
        sidePanelTabId = tab.id;

        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === sidePanelTabId && info.status === "complete") {
                chrome.tabs.sendMessage(tabId, {
                    action: "updateLinkData",
                    data: data
                });
                chrome.tabs.onUpdated.removeListener(listener);
            }
        });
    });
}

// Port connection (e.g., from side panel)
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

// Toggle keyState
function messageshow() {
    console.log("Executing messageshow function...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            return;
        }

        chrome.storage.sync.get("keyState", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving keyState:", chrome.runtime.lastError.message);
                return;
            }

            const newState = data.keyState === "show" ? "hide" : "show";
            chrome.storage.sync.set({ keyState: newState }, () => {
                console.log(`Key state updated to: ${newState}`);
                chrome.tabs.sendMessage(tabs[0].id, { action: "keyState", data: newState });
            });
        });
    });
}

// Toggle getData and notify content script
function getDataFromWebsite() {
    console.log("Executing getDataFromWebsite function...");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) {
            console.error("No active tab found.");
            return;
        }

        chrome.storage.sync.get("getData", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving getData:", chrome.runtime.lastError.message);
                return;
            }

            const newState = data.getData === "show" ? "hide" : "show";
            chrome.storage.sync.set({ getData: newState }, () => {
                console.log(`getData updated to: ${newState}`);
                chrome.tabs.sendMessage(tabs[0].id, { action: "getData", data: newState });
            });
        });
    });
}
