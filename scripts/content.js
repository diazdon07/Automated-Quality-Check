const site = window.location.hostname;
const path = window.location.pathname;
const sitePath = path.split('/')[1] || "";
const allLinks = document.querySelectorAll('a[href]');
const currentHost = window.location.host;
const linkData = [];

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

function processLinks() {
    try {
        const linkPromises = Array.from(allLinks).map(async (link) => {
            try {
                const url = new URL(link.href, window.location.origin);
                if (url.host === currentHost && !url.href.includes("home")) {
                    const response = await fetch(link.href);
                    if (response.ok) {
                        addLocalPage(url);
                    } else {
                        // incrementBrokenLinks({ Slug: url.pathname.split('/').pop(), Url: url.href });
                    }
                }
            } catch (error) {
                console.error(`Error fetching link ${link.href}:`, error);
            }
        });

        // Wait for all link fetches to complete
        Promise.all(linkPromises)
            .then(() => {
                // Process link data asynchronously
                const dataPromises = linkData.map(async (data) => {
                    try {
                        // Add your async processing logic here
                        const text = await response.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(text, 'text/html');
                        const title = doc.title;

                        linkData.Page = title || linkData.Page;
                        getStoreAnchorLinks(doc);
                        await docsCheck(linkData.Page, doc);

                    } catch (error) {
                        console.error(`Error processing ${data.Url}:`, error);
                        incrementBrokenLinks(data);
                    }
                });

                return Promise.all(dataPromises);
            })
            .then(() => {
                // Send link data to the background script after processing
                console.log("Sending link data to background:", linkData);
                sendLinkDataToBackground();
            })
            .catch((error) => {
                console.error("Error in Promise.all:", error);
            });
    } catch (error) {
        console.error("Error in processLinks function:", error);
    }
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

function getStoreAnchorLinks(doc){
    const elements = Array.from(doc.querySelectorAll('[data-anchor]'));
    elements.forEach((element) => {
        const anchor = element.getAttribute('data-anchor');
        const url = new URL(window.location.href);
        url.hash = anchor;
        if(!linkData.some((item) => item.Url === url.href)){
            linkData.push({ Slug: anchor, Url: url.href });
        }
    });
}

const docsPerPage = []; // Array to store processed documents per page

async function docsCheck(PageName, doc) {
    try {
        // Check if the document has already been processed
        if (docsPerPage.some((entry) => entry.PageName === PageName)) {
            console.log(`Document for page ${PageName} has already been processed.`);
            return;
        }

        const links = Array.from(doc.querySelectorAll('a[href]'));
        for (const link of links) {
            const url = new URL(link.href, window.location.origin);
            if (url.host === currentHost && !url.href.includes("home")) {
                const response = await fetch(url.href);
                if (!response.ok) {
                    incrementBrokenLinks({ Slug: url.pathname.split('/').pop(), Url: url.href });
                }
            }
        }

        // Add the processed document to the docsPerPage array
        docsPerPage.push({ PageName, doc });
        console.log(`Document check completed for page: ${PageName}`);
    } catch (error) {
        console.error(`Error in docsCheck for page ${PageName}:`, error);
    }
}

function sendLinkDataToBackground() {
    chrome.runtime.sendMessage({ action: "sendLinkData", data: linkData });
}