// const port = chrome.runtime.connect({ name: "sidepanel" });

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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateLinkData") {
        toggleLoadingOverlay(true); // Show loading overlay

        const linkDataList = document.getElementById("linkDataList");
        linkDataList.innerHTML = ""; // Clear existing data

        // Populate the list with link data
        Promise.all(message.data.map(async (item, index) => { // Add index for unique IDs
            const getSupportingImages = Array.isArray(item.SupportingImage) && item.SupportingImage.length > 0
                ? Promise.all(item.SupportingImage.map(async (entry) => {
                    try {
                        const url = Array.isArray(entry) ? entry.find(obj => obj && obj.Url)?.Url || '' : '';
                        const alt = Array.isArray(entry) ? entry.find(obj => obj && obj.Alt)?.Alt || 'No alt text' : '';
                        const size = await getImageSize(url);
                        const sizeText = size ? ` (${size} KB)` : '';
                        let sizeElement = '<p style="color: #FF5252;">Error Fetching Image Size</p>';

                        if (size > 1024) {
                            sizeElement = `<p style="color: #FF5252;">${sizeText}</p>`;
                        } else if (size > 200) {
                            sizeElement = `<p style="color: #FF9800;">${sizeText}</p>`;
                        } else if (size) {
                            sizeElement = `<p style="color: #4CAF50;">${sizeText}</p>`;
                        }

                        return `<div style="display:inline-block; text-align:center; width: 20%; background: whitesmoke; border-radius: 12px; box-shadow: 8px 8px 16px #bebebe, -8px -8px 16px #ffffff; padding: 10px;">
                                    <img src="${url}" style="width: auto; height: auto; max-width: 250px; max-height: 300px; margin: 5px;">
                                    ${sizeElement}
                                    <p>${alt}</p>
                                </div>`;
                    } catch (error) {
                        console.error('Error processing supporting image:', error);
                        return '<p>Error loading image</p>';
                    }
                }))
                : Promise.resolve(['<p>No supporting images available</p>']); // Fallback for empty array

            const getIcons = Array.isArray(item.SVGImage) && item.SVGImage.length > 0
                ? Promise.all(item.SVGImage.map(async (entry) => {
                    try {
                        let svg = Array.isArray(entry) ? entry.find(obj => obj && obj.Svg)?.Svg || '' : '';
                        const alt = Array.isArray(entry) ? entry.find(obj => obj && obj.Alt)?.Alt || 'No alt text' : 'No alt text';

                        // Remove width and height attributes from the SVG
                        svg = svg.replace(/(width|height)="[^"]*"/g, ''); // Remove existing width and height attributes
                        svg = `<svg width="100" height="100" ${svg.slice(4)}`; // Add fixed width and height attributes

                        return `<div style="display:inline-block; text-align:center; width: 20%; background: whitesmoke; border-radius: 12px; box-shadow: 8px 8px 16px #bebebe, -8px -8px 16px #ffffff; padding: 10px;">
                                    <div style="width: auto; height: auto; max-width: 100%; max-height: 100px; margin: 5px;">${svg}</div>
                                    <p>${alt}</p>
                                </div>`;
                    } catch (error) {
                        console.error('Error processing SVG image:', error);
                        return '<p>Error loading SVG</p>';
                    }
                }))
                : Promise.resolve(['<p>No Icons available</p>']); // Fallback for empty array

            const displaySEO = Array.isArray(item.header) && item.header.length > 0
                ? (async () => {
                    let h2Count = 0;

                    const results = await Promise.all(item.header.map(async (entry) => {
                        try {
                            const headerType = entry.type || '';
                            const contentText = entry.text || '';
                            let headerStyles = `style="color: black;"`;

                            if (headerType === 'h2') {
                                // Remove all non-alphanumeric characters except space
                                const cleanedText = contentText.replace(/[^a-zA-Z0-9\s]/g, '');
                                const wordCount = cleanedText.trim().split(/\s+/).filter(Boolean).length;

                                const isValidH2 = wordCount > 2;

                                if (!isValidH2 || h2Count >= 4) {
                                    headerStyles = `style="color: red;"`;
                                } else {
                                    h2Count++;
                                }
                            }

                            if (headerType === 'h3' && !contentText.trim()) {
                                // Highlight <h3> without content text in red
                                headerStyles = `style="color: red;"`;
                            }

                            return `
                                <${headerType} ${headerStyles}> 
                                <span>[${headerType}]</span>
                                ${contentText}
                                </${headerType}>
                            `;
                        } catch (error) {
                            console.error('Error processing SEO header:', error);
                            return '<p>Error loading SEO header</p>';
                        }
                    }));

                    return results.filter(Boolean);
                })()
                : Promise.resolve(['<p>No SEO header available</p>']);  

            const displayFooter = Array.isArray(item.footer) && item.footer.length > 0
                ? Promise.all(item.footer.map(async (entry) => {
                    try {
                        const footerType = entry.type || ''; // Access 'type' directly
                        const contentText = entry.text || ''; // Access 'text' directly
                        let headerStyles = `style="color: black;"`; // Changed to 'let'

                        if (footerType !== 'h6') {
                            headerStyles = `style="color: red;"`; // Reassignment is now valid
                        } 
                            
                        return `
                            <div class="SEOContainer">
                                <${footerType} ${headerStyles}> 
                                    <span>[${footerType}]</span>
                                    ${contentText}
                                </${footerType}>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error processing SEO footer:', error);
                        return '<p>Error loading SEO footer</p>';
                    }
                }))
                : Promise.resolve(['<p>No SEO footer available</p>']); // Fallback for empty array

            const displayAccordion = Array.isArray(item.accordion) && item.accordion.length > 0
                ? Promise.all(item.accordion.map(async (entry) => {
                    try {
                        const titleType = entry.type || ''; // Access 'type' directly
                        const contentText = entry.text || ''; // Access 'text' directly

                        let headerStyles = `style="color: green;"`; // Changed to 'let'

                        if (titleType !== 'h4') { // Corrected from 'footerType' to 'titleType'
                            headerStyles = `style="color: red;"`; // Reassignment is now valid
                        } 
                            
                        return `
                            <div class="SEOContainer">
                                <${titleType} ${headerStyles}> 
                                    <span>[${titleType}]</span>
                                    ${contentText}
                                </${titleType}>
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error processing accordion:', error);
                        return '<p>Error loading accordion</p>';
                    }
                }))
                : Promise.resolve(['<p>No accordion available</p>']); // Fallback for empty array

            const displayContactForm = Array.isArray(item.contactForm) && item.contactForm.length > 0
                ? Promise.all(item.contactForm.map(async (entry, index) => {
                    try {
                        const autoReplay = entry.Auto_replay || ''; 
                        const reCaptchaPosition = entry.Captcha_Position || ''; 
                        const connectToData = entry.Connect_To_Data || ''; 
                        const subjectLine = entry.Email_Subject_Line || ''; 
                        const fromName = entry.From_Name || ''; 
                        const messageSuccess = entry.Success_Message || ''; 

                        // Default to green, but set to red if any validation fails
                        let warning = 'green';
                        if ( autoReplay !== 'Disabled' || reCaptchaPosition !== 'bottomright' || connectToData !== 'Good' || subjectLine === 'Empty' || fromName === 'Empty' ) {
                            warning = 'red';
                        }

                        return `
                            <div class="contactFormContainer" style="padding: 10px; background-color: white; border: 2px solid ${warning}; border-radius: 20px;">
                                <h4>Contact Form ${index}</h4>
                                <p><strong>Auto Replay:</strong> ${autoReplay}</p>
                                <p><strong>Captcha Position:</strong> ${reCaptchaPosition}</p>
                                <p><strong>Connect To Data:</strong> ${connectToData}</p>
                                <p><strong>Email Subject Line:</strong> ${subjectLine}</p>
                                <p><strong>From Name:</strong> ${fromName}</p>
                                <p><strong>Success Message:</strong></p> ${messageSuccess}
                            </div>
                        `;
                    } catch (error) {
                        console.error('Error processing contact form:', error);
                        return '<p>Error loading contact form</p>';
                    }
                }))
                : Promise.resolve(['<p>No contact form available</p>']); // Fallback for empty array

            const imagesHtml = await getSupportingImages;
            const svgHtml = await getIcons;
            const seoHtml = await displaySEO;
            const footerHtml = await displayFooter;
            const accordionHtml = await displayAccordion;
            const contactFormHtml = await displayContactForm;

            linkDataList.innerHTML += `
                <button class="accordion">
                    <h3>${item.Slug}</h3>
                </button>
                <div class="panel">
                    <div class="containerHeader">
                        <div class="containerCard">
                            <p><strong>Meta Title :</strong> ${item.Meta_Title}</p>
                            <p><strong>Meta Description :</strong> ${item.Meta_Description || 'N/A'}</p>
                            <p><strong>URL :</strong> ${item.Url || 'N/A'}</p>
                            <p><strong>Broken Links :</strong> ${item.BrokenLinks || 0}</p>
                        </div>
                        <div class="containerCard">
                            <p><strong>SEO Header :</strong></p>
                            ${seoHtml.join('')}
                        </div>
                        <div class="containerCard">
                            <p><strong>Footer Section :</strong></p>
                            ${footerHtml.join('')}
                            <p><strong>Accordion Section :</strong></p>
                            ${accordionHtml.join('')}
                        </div>
                        <div class="containerCard" style="display: flex; flex-direction: column; flex-wrap: nowrap; gap: 10px;">
                            ${contactFormHtml.join('')}
                        </div>
                    </div>
                    <div class="tabheader">
                        <button class="tabClass" data-attr="tab1-${index}">Supporting Image</button>
                        <button class="tabClass" data-attr="tab3-${index}">Icon</button>    
                    </div>
                    <div class="container" id="tab1-${index}" style="display: none; flex-wrap: wrap; gap: 10px; margin: 15px 0px; justify-content: center; align-content: center;">${imagesHtml.join('')}</div>
                    <div class="container" id="tab3-${index}" style="display: none; flex-wrap: wrap; gap: 10px; margin: 15px 0px; justify-content: center; align-content: center;">${(svgHtml).join('')}</div>
                </div>
            `;
        })).then(() => {
            // Update counter
            const imageCount = document.querySelectorAll('#linkDataList img').length;
            const counter = document.getElementById('imageCounter');
            if (counter) {
                counter.textContent = `Scanned Images: ${imageCount}`;
            }

            const buttons = document.getElementsByClassName('tabClass');
            for (let i = 0; i < buttons.length; i++) {
                buttons[i].addEventListener('click', showTab);
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
        return null;
    }
}

function showTab(event) {
    const buttons = document.getElementsByClassName('tabClass');
    for (let i = 0; i < buttons.length; i++) {
        const containerId = buttons[i].getAttribute('data-attr');
        const container = document.getElementById(containerId);
        if (container) {
            container.style.display = 'none';
        }
        buttons[i].classList.remove('active-tab'); // Remove active class from all buttons
    }

    const activeTab = event.target.getAttribute('data-attr');
    const activeContainer = document.getElementById(activeTab);
    if (activeContainer) {
        activeContainer.style.display = 'flex';
    }
    event.target.classList.add('active-tab'); // Highlight the clicked tab button
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

