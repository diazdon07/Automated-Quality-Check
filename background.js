chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

let commandFunctions = {
    // "toggle_newTab": show_tab,
    'show_link_checker': messageshow
};

let linkDataFromContent = [];
let sidePanelTabId = null;

chrome.commands.onCommand.addListener(function (command) {
    if (commandFunctions[command]) {
        commandFunctions[command]();
    } else {
        console.log(`Command ${command} not found`);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.storage.sync.get(["keyState", "openTab"], (data) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving storage data:", chrome.runtime.lastError.message);
                return;
            }

            if (data.keyState) {
                console.log("Key State Data:", data.keyState);
            } else {
                console.warn("keyState is not set in storage.");
            }

        });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "sendLinkData" && Array.isArray(message.data)) {
            const linkDataFromContent = message.data;
            console.log("Link data received from content script:", linkDataFromContent);

            // If side panel tab is already open, update it
            if (sidePanelTabId !== null) {
                chrome.tabs.get(sidePanelTabId, (tab) => {
                    if (chrome.runtime.lastError || !tab) {
                        // Tab not found (maybe closed), open new one
                        openSidePanel(linkDataFromContent);
                    } else {
                        // Tab exists, send message to it
                        chrome.tabs.sendMessage(sidePanelTabId, {
                            action: "updateLinkData",
                            data: linkDataFromContent
                        });
                    }
                });
            } else {
                // No known tab, open new one
                openSidePanel(linkDataFromContent);
            }
        } else {
            console.warn("Invalid or unsupported message received:", message);
        }
    } catch (error) {
        console.error("Error processing message from content script:", error);
    }
});

// Open side panel and save tab ID
function openSidePanel(data) {
    chrome.tabs.create({ url: "/html/sidepanel.html" }, (tab) => {
        sidePanelTabId = tab.id;

        // Wait for the tab to load, then send the data
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

function messageshow() {
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
                chrome.tabs.sendMessage(tabs[0].id, { action: newState });
            });
        });
    });
}
