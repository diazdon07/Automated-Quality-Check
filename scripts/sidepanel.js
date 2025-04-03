// filepath: c:\Users\Don Diaz\Documents\QC-Check-main\scripts\sidepanel.js
const port = chrome.runtime.connect({ name: "sidepanel" });

// Listen for messages from the background script
port.onMessage.addListener((message) => {
    if (message.action === "updateLinkData") {
        const linkDataList = document.getElementById("linkDataList");
        linkDataList.innerHTML = ""; // Clear existing data

        // Populate the list with link data
        message.data.forEach((item) => {
            const listItem = document.createElement("li");
            listItem.textContent = `Slug: ${item.Slug}, URL: ${item.Url}`;
            linkDataList.appendChild(listItem);
        });
    }
});