const port = chrome.runtime.connect({ name: "sidepanel" });

// Add a loading overlay to the DOM
const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'loadingOverlay';
loadingOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5em;
    z-index: 9999;
    display: none; /* Hidden by default */
`;
loadingOverlay.textContent = 'Loading...';
document.body.appendChild(loadingOverlay);

// Function to show/hide the loading overlay
function toggleLoadingOverlay(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// Listen for messages from the background script
port.onMessage.addListener((message) => {
    if (message.action === "updateLinkData") {
        toggleLoadingOverlay(true); // Show loading overlay

        const linkDataList = document.getElementById("linkDataList");
        linkDataList.innerHTML = ""; // Clear existing data

        // Populate the list with link data
        Promise.all(message.data.map(async (item) => {
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

                    return `<div style="display:inline-block; text-align:center; width: 20%; background: white; border-radius: 12px; box-shadow: 8px 8px 16px #bebebe, -8px -8px 16px #ffffff; padding: 10px;">
                                <img src="${url}" style="width: 100px; height: auto; margin: 5px;">
                                ${sizeElemet}
                                <p>${alt}</p>
                            </div>`;
                }))
                : Promise.resolve('<p>No supporting images available</p>'); // Fallback if no images
            // note add banner image
            const imagesHtml = await getSupportingImages;
            linkDataList.innerHTML += `
                <button class="accordion">
                    <h3>${item.Slug}</h3>
                </button>
                <div class="panel">
                    <p><strong>Meta Title :</strong> ${item.Meta_Title}</p>
                    <p><strong>Meta Description :</strong> ${item.Meta_Description || 'N/A'}</p>
                    <p><strong>URL :</strong> ${item.Url || 'N/A'}</p>
                    <p><strong>Broken Links :</strong> ${item.BrokenLinks || 0}</p>
                    <div class="tab-buttons">
                        <button data-tab="tab1">Supporting Image</button>
                        <button data-tab="tab2">Banner Images</button>
                        <button data-tab="tab3">Icons</button>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin: 15px 0px; justify-content: center; align-content: center;">${imagesHtml.join('')}</div>
                </div>
            `;
        })).then(() => {
            // Update counter
            const imageCount = document.querySelectorAll('#linkDataList img').length;
            const counter = document.getElementById('imageCounter');
            if (counter) {
                counter.textContent = `Scanned Images: ${imageCount}`;
            }

            // Reinitialize accordion functionality for newly added elements
            initializeAccordion();

            toggleLoadingOverlay(false); // Hide loading overlay
        }).catch((error) => {
            console.error('Error processing data:', error);
            toggleLoadingOverlay(false); // Hide loading overlay on error
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

