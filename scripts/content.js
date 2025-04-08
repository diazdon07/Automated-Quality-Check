const site = window.location.hostname;
const path = window.location.pathname;
const sitePath = path.split('/')[1] || "";
const allLinks = document.querySelectorAll('a[href]');
const currentHost = window.location.host;
const linkData = [];
const extractedValue = path.split('/site/')[1].split('?')[0].replace(/\/$/, '');

const debugLogs = []; // Centralized array for logs, warnings, and errors

function logDebug(type, message, data = null) {
    const logEntry = { type, message, data, timestamp: new Date().toISOString() };
    debugLogs.push(logEntry);
}

chrome.runtime.sendMessage({
    site: window.location.hostname,
    path: window.location.pathname
});

processLinks();

if(site.includes("webbuilder.localsearch.com.au")){
    switch (sitePath) {
        case "site" : // duda preview links
            break;
        case "home" : // duda actual live site
            break;
        case "" : // duda webbuilder site
            break;
        default : 
            break;
    }
} else 
if (site.includes("lsearch.lightning.force.com")){
    switch (sitePath) {
        case "lightning": // salesforce website
            break;
    }
}

async function processLinks() {
    try {
        async function checkLinks(allLinks, currentHost) {
            const delayBetweenRequests = 500; // Delay in milliseconds (adjust as needed)
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            for (const link of allLinks) {
                const url = new URL(link.href, window.location.origin);
                if (url.host === currentHost) {
                    try {
                        const Alias = url.pathname.split('/').pop() || 'home';
                        // Skip processing if the Slug already exists
                        if (linkData.some((item) => item.Slug === Alias)) {
                            logDebug('warn', `Skipping link as it already exists: ${Alias}`);
                            continue;
                        }
                        const response = await fetch(link.href);
                        if (response.ok) {
                            addLocalPage(url);
                        }
                    } catch (error) {
                        logDebug('error', 'Error fetching link:', { href: link.href, error });
                    }
                    await delay(delayBetweenRequests); // Add delay after each request
                }
            }
        }

        // Call checkLinks to process all links
        await checkLinks(allLinks, currentHost);

        // Wait for all link fetches and data processing to complete
        await Promise.all(
            linkData.map(async (data) => {
                try {
                    const res = await fetch(data.Url).catch((error) => {
                        logDebug('warn', `Failed to fetch ${data.Url}:`, error);
                        data.BrokenLinks = (data.BrokenLinks || 0) + 1;
                        return null;
                    });

                    if (!res || !res.ok) {
                        data.BrokenLinks = (data.BrokenLinks || 0) + 1;
                        return;
                    }

                    const text = await res.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(text, 'text/html');
                    const title = doc.title;
                    const meta_desc = doc.querySelector('meta[name="description"]');

                    data.Meta_Description = meta_desc ? meta_desc.getAttribute('content') : null;
                    data.Meta_Title = title || data.Meta_Title;
                    data.Slug = data.Slug || data.Meta_Title;
                    data.Url = data.Url || data.Meta_Title;

                    if (!data.Meta_Title) {
                        const index = linkData.findIndex(item => item.Slug === data.Slug);
                        linkData.splice(index, 1);
                        return;
                    }

                    await docsCheck(data, doc)
                        .then(() => getPerPageImage(data, doc))
                        .then(() => getSVGImage(data, doc))
                        .catch((error) => {
                            logDebug('error', `Error in docsCheck for page ${data.Slug}:`, error);
                        });

                } catch (error) {
                    logDebug('error', `Error fetching link data for ${data.Slug}:`, error);
                }
            })
        );

        logDebug('log', "All data processed. Sending link data to background...");
        await sendLinkDataToBackground();

    } catch (error) {
        logDebug('error', "Error in processLinks function:", error);
    }
}

function addLocalPage(url) {
    const Url = url.pathname.split('/').pop() || 'home';
    const Alias = Url;

    // Check for duplicates based on the Slug property
    if (!linkData.some((item) => item.Slug === Alias)) {
        linkData.push({ Slug: Alias, Url: url.href });
    } else {
        logDebug('warn', `Duplicate entry detected for Slug: ${Alias}. Skipping addition.`);
    }
}

async function docsCheck(data, doc) {
    try {
        const links = Array.from(doc.querySelectorAll('a[href*="/site/"]'))
            .filter(link => !link.href.startsWith("tel:") && !link.href.startsWith("mailto:"));

        const batchSize = 10;
        const delayBetweenBatches = 1000; // Increase delay to 1000ms (1 second) to reduce request frequency

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        async function processBatch(batchLinks) {
            const linkPromises = batchLinks.map(async (link) => {
                try {
                    const res = await fetch(link.href, {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    }).catch((error) => {
                        logDebug('warn', `Failed to fetch ${link.href}:`, error);
                        return null;
                    });

                    if (!res || res.status === 404) {
                        data.BrokenLinks = (data.BrokenLinks || 0) + 1;
                        logDebug('warn', `Broken link (404) found on page ${data.Slug}: ${link.href}`);
                        return;
                    } else 
                    if (res.ok) {
                        if (link.href.includes('#')) {
                            const hashPart = link.href.split('#')[1]; // Fix: Use link.href instead of undefined 'url'

                            const text = await res.text(); // Fix: Use 'res' instead of undefined 'response'
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(text, 'text/html');

                            // Fix: Loop through anchor elements and check if the data-anchor matches
                            const anchors = Array.from(doc.querySelectorAll('[data-anchor]'));
                            const matchingAnchor = anchors.find(anchor => anchor.getAttribute('data-anchor') === hashPart);

                            const anchorid = Array.from(doc.querySelectorAll('[id]'));
                            const matchingid = anchorid.find(anchorid => anchorid.id === hashPart);

                            if (matchingAnchor || matchingid) {
                                return;
                            } else {
                                data.BrokenLinks = (data.BrokenLinks || 0) + 1;
                                logDebug('warn', `Broken link (anchor) found on page ${data.Slug}: ${link.href}`);
                            }
                        }
                    }

                } catch (error) {
                    logDebug('error', `Error fetching link ${link.href}:`, error);
                }
            });
            await Promise.all(linkPromises);
        }

        for (let i = 0; i < links.length; i += batchSize) {
            const batchLinks = links.slice(i, i + batchSize);
            await processBatch(batchLinks);
            await delay(delayBetweenBatches); // Add delay between batches
        }

    } catch (error) {
        logDebug('error', `Error in docsCheck for page ${data.Slug}:`, error);
    }
}

// Delay function (returns a promise that resolves after a given time in milliseconds)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getPerPageImage(data, doc) {
    try {
        const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
        const styleTag = document.getElementById('pagestyle');  // Capture inline <style> tag
        const cssPromises = [];

        // Initialize BannerImage if not already set
        data.BannerImage = data.BannerImage || [];
        data.SupportingImage = data.SupportingImage || [];

        // Loop through the link tags to fetch the CSS
        for (const link of linkTags) {
            const cssUrl = link.href;
            cssPromises.push(
                fetch(cssUrl, { mode: 'no-cors' })
                    .then(cssRes => {
                        if (cssRes.ok) {
                            logDebug('log', `Successfully fetched CSS from: ${cssUrl}`);
                        } else {
                            logDebug('warn', `Failed to fetch CSS from: ${cssUrl} (Status: ${cssRes.status})`);
                        }
                    })
                    .catch(error => {
                        logDebug('warn', `Error fetching CSS from: ${cssUrl}`, error);
                    })
            );
        }

        // Handle <style> tag if it exists
        if (styleTag) {
            const styleContent = styleTag.textContent || styleTag.innerText;
            const regex = /background-image\s*:\s*url\((['"]?)(.*?)\1\)/g;
            let match;
            while ((match = regex.exec(styleContent)) !== null) {
                const imageUrl = match[2];
                logDebug('log', 'Found image URL in <style>:', imageUrl);
                data.BannerImage.push(imageUrl);  // Add the image URL to BannerImage array
            }
        } else {
            logDebug('warn', "No <style> tag with id 'pagestyle' found.");
        }

        // Wait for all CSS files to be fetched
        await Promise.all(cssPromises);

        // Wait for images to load if they are dynamically injected (e.g., lazy loading)
        await delay(1000);  // Adjust delay time as needed

        // Process <img> elements with data-src attribute
        const elements = Array.from(doc.querySelectorAll('img')); // Select only <img> with data-src

        elements.forEach((img, index) => {
            const datasrc = img.getAttribute('data-src');
            const src = datasrc || img.getAttribute('src');
            const alt = img.getAttribute('alt') || 'No alt text';
            
            if (src) {
                const imageObj = [
                    { Url: src },
                    { Alt: alt }];
                data.SupportingImage.push(imageObj);
            }
        });

    } catch (error) {
        logDebug('error', `Error in getPerPageImage for page ${data.Slug}:`, error);
    }
}

async function getSVGImage(data, doc) {
    try {
        const svgImages = Array.from(doc.querySelectorAll('svg'));
        const svgImage = await Promise.all(svgImages.map((svg, index) => {
            const svgContent = svg.outerHTML;
            const titleElement = svg.querySelector('title');
            const title = titleElement ? titleElement.textContent : 'No title available';
            return {
                [`SVG_image${index + 1}`]: [
                    { Url: svgContent },
                    { Alt: title }
                ]
            };
        }));
        data.SVGImage = svgImage;
        
    } catch (error) {
        logDebug('error', `Error in getSVGImage for page ${data.Slug}:`, error);
    }
}

async function sendLinkDataToBackground() {
    try {
        if (linkData && Array.isArray(linkData) && linkData.length > 0) {
            // Retry mechanism for sending data
            const maxRetries = 1;
            let attempt = 0;
            let success = false;

            while (attempt < maxRetries && !success) {
                attempt++;
                try {
                    // Filter out duplicate data before sending
                    const uniqueData = linkData.filter(
                        (item, index, self) =>
                            index === self.findIndex((t) => t.Slug === item.Slug)
                    );

                    await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({ action: "sendLinkData", data: uniqueData }, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(chrome.runtime.lastError.message);
                            } else {
                                logDebug('log', "Link data successfully sent to background:", response);
                                success = true;
                                resolve();
                            }
                        });
                    });
                } catch (error) {
                    logDebug('warn', `Attempt ${attempt} failed to send link data:`, error);
                    if (attempt === maxRetries) {
                        logDebug('warn', "Max retries reached. Failed to send link data.");
                    }
                }
            }
        } else {
            logDebug('warn', "No link data to send. The linkData array is empty or invalid.");
        }
    } catch (error) {
        logDebug('error', "Error in sendLinkDataToBackground function:", error);
    }
}
