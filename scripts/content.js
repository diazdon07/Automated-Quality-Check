const site = window.location.hostname;
const path = window.location.pathname;
const sitePath = path.split('/')[1] || "";
const allLinks = document.querySelectorAll('a[href]');
const currentHost = window.location.host;
const linkData = [];

if(site.includes("webbuilder.localsearch.com.au")){
    switch (sitePath) {
        case "site" : // duda preview links
        processLinks();
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

function processLinks() {
        try {
            allLinks.forEach((link) => {
                const url = new URL(link.href, window.location.origin);
                if (url.host === currentHost && !url.href.includes("home")) {
                    addLocalPage(url);
                }
            });

            // Process link data asynchronously
            const promises = linkData.map(async (data) => {
                try {
                    // Add your async processing logic here
                } catch (error) {
                    console.error(`Error processing ${data.Url}:`, error);
                    incrementBrokenLinks(data);
                }
            });

            Promise.all(promises).catch((error) => {
                console.error("Error in Promise.all:", error);
            });
        } catch (error) {
            console.error("Error in processLinks function:", error);
        }
        
    console.log(linkData);
    sendLinkDataToBackground();
}

function addLocalPage(url) {
    const slug = url.pathname.split('/').pop() || "home";

    if (linkData.some((item) => item.Slug === slug)) {
        return;
    }

    linkData.push({ Slug: slug, Url: url.href });
}

function incrementBrokenLinks(data) {
    if (!data || !data.Slug) {
        console.warn("Invalid data passed to incrementBrokenLinks:", data);
        return;
    }

    const existingEntry = linkData.find((entry) => entry.Slug === data.Slug);
    if (existingEntry) {
        existingEntry.Broken_links = (existingEntry.Broken_links || 0) + 1;
    } else {
        linkData.push({ Slug: data.Slug, Broken_links: 1 });
    }
}

function sendLinkDataToBackground() {
    chrome.runtime.sendMessage({ action: "sendLinkData", data: linkData });
}