const port = chrome.runtime.connect({ name: "sidepanel" });

// Listen for messages from the background script
port.onMessage.addListener((message) => {
    if (message.action === "updateLinkData") {
        const linkDataList = document.getElementById("linkDataList");
        linkDataList.innerHTML = ""; // Clear existing data

        // Populate the list with link data
        message.data.forEach((item) => {
            const getSupportingImages = Array.isArray(item.SupportingImage) && item.SupportingImage.length > 0
                ? Promise.all(item.SupportingImage.map(async (entry) => {
                    const url = entry.find(obj => obj && obj.Url)?.Url || ''; // Ensure object exists before accessing Url
                    const alt = entry.find(obj => obj && obj.Alt)?.Alt || 'No alt text'; // Ensure object exists before accessing Alt
                    const size = await getImageSize(url);
                    const sizeText = size ? ` (${size} KB)` : ''; // Append size if available
                    let sizeElemet = '<p style="color: #FF5252;">Error Fetching Image Size</p>'; // Changed to 'let'

                    if (size > 1024) {
                        sizeElemet = `<p style="color: #FF5252;">${sizeText}</p>`;
                    } else if (size > 200) {
                        sizeElemet = `<p style="color: #FF9800;">${sizeText}</p>`;
                    } else if (size) {
                        sizeElemet = `<p style="color: #4CAF50;">${sizeText}</p>`;
                    }

                    return `<div style="display:inline-block; text-align:center; width: 50%;">
                                <img src="${url}" style="width: 100px; height: auto; margin: 5px;">
                                ${sizeElemet}
                                <p>${alt}</p>
                            </div>`;
                }))
                : Promise.resolve('<p>No supporting images available</p>'); // Fallback if no images

            getSupportingImages.then((imagesHtml) => {
                linkDataList.innerHTML += `
                    <button class="accordion">
                        <h4>${item.Slug}</h4>
                    </button>
                    <div class="panel">
                        <p><strong>Meta Title :</strong> ${item.Meta_Title}</p>
                        <p><strong>Meta Description :</strong> ${item.Meta_Description || 'N/A'}</p>
                        <p><strong>URL :</strong> ${item.Url || 'N/A'}</p>
                        <p><strong>Broken Links :</strong> ${item.Broken_links || 0}</p>
                        <div style="display: flex; flex-wrap: wrap;">${imagesHtml.join('')}</div>
                    </div>
                `;

                // Update counter
                const imageCount = document.querySelectorAll('#linkDataList img').length;
                const counter = document.getElementById('imageCounter');
                if (counter) {
                    counter.textContent = `Scanned Images: ${imageCount}`;
                }

                // Reinitialize accordion functionality for newly added elements
                initializeAccordion();
            });
        });

    }
});

async function getImageSize(url) {
    // Skip SVG files to avoid CORS issues
    if (url.endsWith('.svg')) {
        console.warn(`Skipping SVG file: ${url}`);
        return null;
    }
 
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        const sizeInKB = blob.size / 1024;
        return sizeInKB.toFixed(2);
    } catch (error) {
        console.error(`Error fetching image: ${error}`);
        return null;
    }
}

function initializeAccordion() {
    const acc = document.getElementsByClassName("accordion");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function () {
            // Toggle between adding and removing the "active" class
            this.classList.toggle("active");

            // Toggle between hiding and showing the active panel
            const panel = this.nextElementSibling;
            if (panel) { // Ensure the panel exists
                if (panel.style.display === "block") {
                    panel.style.display = "none";
                } else {
                    panel.style.display = "block";
                }
            } else {
                console.warn("No panel found for this accordion.");
            }
        });
    }
}

// Reinitialize accordion functionality for dynamically created elements
initializeAccordion();
