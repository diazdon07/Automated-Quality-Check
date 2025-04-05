const port = chrome.runtime.connect({ name: "sidepanel" });

// Listen for messages from the background script
port.onMessage.addListener((message) => {
    if (message.action === "updateLinkData") {
        const linkDataList = document.getElementById("linkDataList");
        linkDataList.innerHTML = ""; // Clear existing data

        // Populate the list with link data
        message.data.forEach((item) => {
            linkDataList.innerHTML += `
                <button class="accordion">
                    <h4>${item.Slug}</h4>
                </button>
                <div class="panel">
                    <p><strong>URL :</strong> ${item.Url}</p>
                    <p><strong>Broken Links :</strong> ${item.Broken_links || 0}</p>
                </div>
            `;
        });

        // Reinitialize accordion functionality for dynamically created elements
        initializeAccordion();
    }
});

function initializeAccordion() {
    const acc = document.getElementsByClassName("accordion");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function () {
            // Toggle between adding and removing the "active" class
            this.classList.toggle("active");

            // Toggle between hiding and showing the active panel
            const panel = this.nextElementSibling;
            if (panel.style.display === "block") {
                panel.style.display = "none";
            } else {
                panel.style.display = "block";
            }
        });
    }
}

// Initialize accordion functionality on page load (if any accordion elements exist)
initializeAccordion();