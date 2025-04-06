const site = window.location.hostname;
const path = window.location.pathname;
const sitePath = path.split('/')[1] || "";
const allLinks = document.querySelectorAll('a[href]');
const currentHost = window.location.host;
const linkData = [];
const extractedValue = path.split('/site/')[1].split('?')[0].replace(/\/$/, '');

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
            for (const link of allLinks) {
                const url = new URL(link.href, window.location.origin);
                if (url.host === currentHost) {
                    try {
                        const response = await fetch(link.href);
                        if (response.ok) {
                            addLocalPage(url);
                        }
                    } catch (error) {
                        console.error('Error fetching link:', link.href, error);
                    }
                }
            }
        }

        // Call checkLinks to process all links
        await checkLinks(allLinks, currentHost);

        // Wait for all link fetches to complete
        await Promise.all(
            linkData.map(async (data) => {
                try {
                    const res = await fetch(data.Url).catch((error) => {
                        console.warn(`Failed to fetch ${data.Url}:`, error);
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

                    data.Page = title || data.Page;
                    data.Slug = data.Slug || data.Page;
                    data.Url = data.Url || data.Page;
                    if (data.Page === null || data.Page === undefined || data.Page === "") {
                        const index = linkData.findIndex(item => item.Slug === data.Slug); 
                        linkData.splice(index, 1);
                        return;
                    }
                    await docsCheck(data, doc) 
                        .then(() => {
                            getPerPageImage(data, doc);
                        })
                        .catch((error) => {
                            console.error(`Error in docsCheck for page ${data.Slug}:`, error);
                        });

                } catch (error) {
                    console.error(`Error fetching link data for ${data.Slug}:`, error);
                }
            })
        ) .then(() => {
            // Send link data to the background script after processing
            console.log("Sending link data to background:", linkData);
            sendLinkDataToBackground();
        });
    } catch (error) {
        console.error("Error in processLinks function:", error);
    }
}

function addLocalPage(url) {
    const Url = url.pathname.split('/').pop() || 'home';
    const Alias = Url;

    // Add to linkData if unique
    if (!linkData.some((item) => item.Slug === Alias)) {
        linkData.push({ Slug: Alias, Url: url.href });
    }
}

async function docsCheck(data, doc) {
    try {
        const links = Array.from(doc.querySelectorAll('a[href*="/site/"]'))
            .filter(link => !link.href.startsWith("tel:") && !link.href.startsWith("mailto:"));

        const batchSize = 10;
        const delayBetweenBatches = 100;

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
                        console.warn(`Failed to fetch ${link.href}:`, error);
                        return null;
                    });

                    if (!res || res.status === 404) {
                        data.BrokenLinks = (data.BrokenLinks || 0) + 1;
                        console.warn(`Broken link (404) found on page ${data.Slug}: ${link.href}`);
                        return;
                    } else 
                    if (res.ok) {
                        if (link.href.includes('#')) {
                            const hashPart = url.split('#')[1];

                            const text = await response.text();
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(text, 'text/html');

                             // Fix here: Loop through anchor elements and check if the data-anchor matches
                            const anchors = Array.from(doc.querySelectorAll('[data-anchor]'));
                            const matchingAnchor = anchors.find(anchor => anchor.getAttribute('data-anchor') === hashPart);

                            const anchorid = Array.from(doc.querySelectorAll('[id]'));
                            const matchingid = anchorid.find(anchorid => anchorid.id === hashPart);

                            if (matchingAnchor || matchingid) {
                                return;
                            } else {
                                data.BrokenLinks = (data.BrokenLinks || 0) + 1;
                                console.warn(`Broken link (anchor) found on page ${data.Slug}: ${link.href}`);
                            }
                        }
                    }

                } catch (error) {
                    console.error(`Error fetching link ${link.href}:`, error);
                }
            });
            await Promise.all(linkPromises);
        }

        for (let i = 0; i < links.length; i += batchSize) {
            const batchLinks = links.slice(i, i + batchSize);
            await processBatch(batchLinks);
            await delay(delayBetweenBatches);
        }

        // return Promise.all(processBatch).then(() => {
        //     console.log(`Document check completed for page: ${data.Slug}`);
        // });
    } catch (error) {
        console.error(`Error in docsCheck for page ${data.Slug}:`, error);
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
                            console.log(`Successfully fetched CSS from: ${cssUrl}`);
                        } else {
                            console.error(`Failed to fetch CSS from: ${cssUrl}`);
                        }
                    })
                    .catch(error => console.error(`Error fetching CSS: ${cssUrl}`, error))
            );
        }

        // Handle <style> tag if it exists
        if (styleTag) {
            const styleContent = styleTag.textContent || styleTag.innerText;
            const regex = /background-image\s*:\s*url\((['"]?)(.*?)\1\)/g;
            let match;
            while ((match = regex.exec(styleContent)) !== null) {
                const imageUrl = match[2];
                console.log('Found image URL in <style>:', imageUrl);
                data.BannerImage.push(imageUrl);  // Add the image URL to BannerImage array
            }
        } else {
            console.warn("No <style> tag with id 'pagestyle' found.");
        }

        // Wait for all CSS files to be fetched
        await Promise.all(cssPromises);

        // Wait for images to load if they are dynamically injected (e.g., lazy loading)
        await delay(3000);  // Adjust delay time as needed

        // Process <img> elements with data-src attribute
        const elements = Array.from(doc.querySelectorAll('img[data-src]')); // Select only <img> with data-src
        const dataSrcValues = elements.map(img => img.getAttribute('data-src')); // Get the data-src values

        if (dataSrcValues.length > 0) {
            data.SupportingImage.push(...dataSrcValues);  // Add the data-src values to SupportingImage array
        }

    } catch (error) {
        console.error(`Error in getPerPageImage for page ${data.Slug}:`, error);
    }
}

function sendLinkDataToBackground() {
    chrome.runtime.sendMessage({ action: "sendLinkData", data: linkData });
}
