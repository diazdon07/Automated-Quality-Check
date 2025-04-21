const site = window.location.hostname;
const path = window.location.pathname;
const sitePath = path.split('/')[1] || "";
const allLinks = document.querySelectorAll('a[href]');
const currentHost = window.location.host;
const linkData = [];

const debugLogs = []; // Centralized array for logs, warnings, and errors

function logDebug(type, message, data = null) {
    const logEntry = { type, message, data, timestamp: new Date().toISOString() };
    debugLogs.push(logEntry);
}

if(site.includes("webbuilder.localsearch.com.au")){
    switch (sitePath) {
        case "site" : // duda preview links
        async function linkChecker() {
            const links = Array.from(document.querySelectorAll('a[href*="/site/"]'))
                .filter(link => !link.href.startsWith("tel:") && !link.href.startsWith("mailto:"));
        
            const results = [];
            const batchSize = 10;
            const delayBetweenBatches = 100;
        
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        
            async function processBatch_brokenLink(batchLinks) {
                const fetchPromises = batchLinks.map(async (link) => {
                    let url = link.href.split('/').pop();
                    let baseUrl = url.split('?')[0];
        
                    if (!baseUrl) {
                        baseUrl = 'home';
                    }
        
                    try {
                        const response = await fetch(link.href);
                        if (response.ok) {
                            if (link.href.includes('#')) {
                                const hashPart = url.split('#')[1];
                                results.push(`${link.href} - Anchor link detected`);
        
                                const text = await response.text();
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(text, 'text/html');
        
                                // Fix here: Loop through anchor elements and check if the data-anchor matches
                                const anchors = Array.from(doc.querySelectorAll('[data-anchor]'));
                                const matchingAnchor = anchors.find(anchor => anchor.getAttribute('data-anchor') === hashPart);
        
                                const anchorid = Array.from(doc.querySelectorAll('[id]'));
                                const matchingid = anchorid.find(anchorid => anchorid.id === hashPart);
        
                                if (matchingAnchor || matchingid) {
                                    results.push(`${link.href} - Good Link`);
                                    styleBrokenLink(link, `⚓ ${baseUrl}#${hashPart}`, "orange");
                                } else {
                                    results.push(`${link.href} - Broken (Status: ${response.status})`);
                                    styleBrokenLink(link, "⚓ Broken Anchor Link", "red");
                                }
                            } else {
                                results.push(`${link.href} - Good Link`);
                                if (baseUrl === "home") {
                                    styleBrokenLink(link, `🏠 ${baseUrl}`, "dodgerblue");
                                } else {
                                    styleBrokenLink(link, `${baseUrl}`, "green");
                                }
                            }
                        } else {
                            results.push(`${link.href} - Broken (Status: ${response.status})`);
                            styleBrokenLink(link, "⛓️‍💥 Broken Link", "red");
                        }
                    } catch (error) {
                        results.push(`${link.href} - Broken (Error: ${error.message})`);
                        styleBrokenLink(link, "⛓️‍💥 Broken Link", "red");
                    }
                });
        
                await Promise.all(fetchPromises);
            }
        
            for (let i = 0; i < links.length; i += batchSize) {
                const batchLinks = links.slice(i, i + batchSize);
                await processBatch_brokenLink(batchLinks);
                await delay(delayBetweenBatches);
            }
        }

        function styleBrokenLink(link, content, color) {
            // Remove existing link-bar if any
            const existingBar = link.querySelector('.link-bar');
            if (existingBar) {
                link.removeChild(existingBar);
            }
        
            // Create and style new container
            const divContainer = document.createElement('div');
            divContainer.classList.add('link-bar');
            divContainer.textContent = content;
            divContainer.style.backgroundColor = color;
            divContainer.style.padding = '2px 6px';
            divContainer.style.borderRadius = '4px';
            divContainer.style.color = '#fff';
            divContainer.style.fontSize = '0.85em';
            divContainer.style.marginTop = '4px';
            divContainer.style.display = 'inline-block';
        
            link.appendChild(divContainer);
            handlerFirst(); // Optional: Check if this should be conditionally called
        }        

        function handlerFirst(){
            chrome.storage.sync.get("keyState", (data) => {
                toggleDisplay(data.keyState === "show");
            });
            
            chrome.runtime.onMessage.addListener((message) => {
                if(message.action === "keyState"){
                    toggleDisplay(message.data === "show");
                }
            });
        }

        function toggleDisplay(show) {
            const targetBlank = document.querySelectorAll('a[target="_blank"]'); //targeting a tag creating new tab
            const dmButtonLink = document.querySelectorAll('.dmButtonLink'); 
            const linkElements = document.getElementsByClassName("link-bar");
            const graphicWidgetLinks = document.querySelectorAll('.graphicWidget a');
            const imageWidgetLinks = document.querySelectorAll('.image-container a');
        
            imageWidgetLinks.forEach(link => {
                if (show) {
                    link.style.display = 'flex';
                    link.style.flexDirection = 'row';
                    link.style.flexWrap = 'wrap';
                    link.style.alignContent = 'center';
                    link.style.justifyContent = 'center';
                    link.style.alignItems = 'center';
                } else {
                    link.style.display = '';
                }
            });
            
            graphicWidgetLinks.forEach(link => {
                if (show) {
                    link.style.display = 'flex';
                    link.style.flexDirection = 'row';
                    link.style.flexWrap = 'wrap';
                    link.style.alignContent = 'center';
                    link.style.justifyContent = 'center';
                    link.style.alignItems = 'center';
                } else {
                    link.style.display = '';
                }
            });
        
            targetBlank.forEach(target => {
                if (show) {
                    target.style.border = "2px dashed red";  // Apply border if 'show' is true
                } else {
                    target.style.border = "";  // Remove the border if 'show' is false
                }
            });
        
            dmButtonLink.forEach(dmButton => {
                if (show) {
                    dmButton.classList.add('custom-adjustment');
                } else {
                    dmButton.classList.remove('custom-adjustment');
                }
            });
        
            for (let element of linkElements) {
                element.style.display = show ? "block" : "none";
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

        chrome.storage.sync.get("getData", (data) => {
            startProcessing(data.getData === "show");
        });
        
        chrome.runtime.onMessage.addListener((message) => {
            if (message.action === "getData") {
                startProcessing(message.data === "show");
            }
        });        

        function startProcessing(dataDisplay){
            if(dataDisplay){
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
                                        .then(() => getHeaderType(data, doc)) 
                                        .then(() => checkAccordion(data, doc))
                                        .then(() => getContactForm(data, doc))        
                                        .then(() => getFooterType(data, doc))             
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
                        console.log("Link data sent to background:", linkData);
                
                    } catch (error) {
                        logDebug('error', "Error in processLinks function:", error);
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
                        data.BannerImage = data.BannerImage || [];
                        data.SupportingImage = data.SupportingImage || [];
                        
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
                            const title = titleElement ? titleElement.textContent : 'No Alt Text';
                            return [{ Svg: svgContent },{ Alt: title }];
                        }));
                        data.SVGImage = svgImage;
                        
                    } catch (error) {
                        logDebug('error', `Error in getSVGImage for page ${data.Slug}:`, error);
                    }
                }
        
                async function getHeaderType(data, doc) {
                    try {
                        const scriptTags = Array.from(doc.querySelectorAll('script'));
                        const containsDeleteElements = scriptTags.some(script => script.textContent.includes('deleteElements()'));
                        const headersType = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        
                        const headerData = headersType.flatMap(header => 
                            Array.from(doc.querySelectorAll(header))
                                .map(element => {
                                    if (containsDeleteElements && header === 'h3' && element.textContent.trim() === '') {
                                        return null;
                                    }
                                    return {
                                        type: header,
                                        text: element.textContent.trim()
                                    };
                                })
                                .filter(Boolean)
                        );
        
                        data.header = headerData;
        
                    } catch (error) {
                        logDebug('error', `Error in getHeaderType for page ${data.Slug}:`, error);
                    }
                }
        
                async function checkAccordion(data, doc) {
                    try {
                        const accordionContainers = Array.from(doc.querySelectorAll('[data-grab="accordion-container"]'));
                        const headersType = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
                        const headerData = accordionContainers.flatMap(container =>
                            headersType.flatMap(header =>
                                Array.from(container.querySelectorAll(header))
                                    .map(element => ({
                                        type: header,
                                        text: element.textContent.trim()
                                    }))
                                    .filter(Boolean)
                            )
                        );
                        data.accordion = headerData;
                    } catch (error) {
                        logDebug('error', `Error in Accordion for page ${data.Slug}:`, error);
                    }
                }
        
                async function getFooterType(data, doc) {
                    try {
                        const footerContainers = Array.from(doc.getElementsByClassName('dmFooterContainer'));
                        const headersType = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
                        const headerData = footerContainers.flatMap(container =>
                            headersType.flatMap(header =>
                                Array.from(container.querySelectorAll(header)).map(element => ({
                                    type: header,
                                    text: element.textContent.trim()
                                }))
                            )
                        );
                        data.footer = headerData;
                    } catch (error) {
                        logDebug('error', `Error in Footer for page ${data.Slug}:`, error);
                    }
                }
                
                async function getContactForm(data, doc) {
                    try {
                        const dmform = Array.from(doc.querySelectorAll('.dmform'));
        
                        if (dmform.length === 0) {
                            data.contactForm = "No Contact Form";
                            return;
                        } else {
                            const formData = dmform.map(form => {
                                const autoReplayInput = form.querySelector('input[name="dmformautoreplyenabled"]');
                                const connectToData = form.getAttribute('data-binding');
                                const captchaPosition = form.getAttribute('data-captcha-position');
                                const emailSubjectLine = form.querySelector('input[name="dmformsubject"]');
                                const fromName = form.querySelector('input[name="dmformfrom"]');
                                const successDiv = form.querySelector(".dmform-success");
            
                                const fc = connectToData ? "Good" : "Not Connected To Data";
                                const ar = autoReplayInput && autoReplayInput.value === "true" ? "Enabled" : "Disabled";
                                const subjectLine = emailSubjectLine?.value?.trim() || "Empty";
                                const from = fromName?.value?.trim() || "Empty";
                                const captchaStatus = captchaPosition;
                                const Message = successDiv.innerHTML.trim()
            
                                return {
                                    Connect_To_Data: fc,
                                    Auto_replay: ar,
                                    Email_Subject_Line: subjectLine,
                                    From_Name: from,
                                    Captcha_Position: captchaStatus,
                                    Success_Message: Message
                                    
                                };
                            });
                            data.contactForm = formData;
                        }
        
                    } catch (error) {
                        logDebug('error', `Error in ContactForm for page ${data.Slug}:`, error);
                    }
                }
                
                const sentDataHashes = new Set(); // Track hashes of sent data to prevent duplicates
                
                async function sendLinkDataToBackground() {
                    try {
                        if (linkData && Array.isArray(linkData) && linkData.length > 0) {
                            const maxRetries = 1;
                            let attempt = 0;
                            let success = false;
                
                            while (attempt < maxRetries && !success) {
                                attempt++;
                                try {
                                    const uniqueData = linkData.filter((item, index, self) =>
                                        index === self.findIndex((t) => t.Slug === item.Slug)
                                    );
                
                                    // Filter out already sent data
                                    const filteredData = uniqueData.filter(item => {
                                        const hash = JSON.stringify(item);
                                        if (sentDataHashes.has(hash)) {
                                            logDebug('warn', `Skipping already sent data: ${item.Slug}`);
                                            return false;
                                        }
                                        sentDataHashes.add(hash); // Mark data as sent
                                        return true;
                                    });
                
                                    if (filteredData.length === 0) {
                                        logDebug('warn', "No new data to send. All data has already been sent.");
                                        return;
                                    }
                
                                    await new Promise((resolve, reject) => {
                                        chrome.runtime.sendMessage({ action: "sendLinkData", data: filteredData }, (response) => {
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
                
                function showLoadingPopup(message = "🔄 Loading...") {
                    let loader = document.getElementById("custom-loading-popup");
                
                    if (!loader) {
                        loader = document.createElement("div");
                        loader.id = "custom-loading-popup";
                        loader.textContent = message;
                
                        Object.assign(loader.style, {
                            position: "fixed",
                            top: "20px",
                            right: "20px",
                            backgroundColor: "#343a40",
                            color: "#fff",
                            padding: "12px 20px",
                            borderRadius: "8px",
                            fontFamily: "sans-serif",
                            fontSize: "14px",
                            zIndex: "9999",
                            opacity: "0",
                            transition: "opacity 0.4s ease-in-out",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                        });
                
                        document.body.appendChild(loader);
                
                        // Fade in
                        requestAnimationFrame(() => {
                            loader.style.opacity = "1";
                        });
                    } else {
                        loader.textContent = message;
                        loader.style.opacity = "1";
                    }
                }
                
                function hideLoadingPopup() {
                    const loader = document.getElementById("custom-loading-popup");
                    if (loader) {
                        loader.style.opacity = "0";
                        setTimeout(() => {
                            if (loader.parentNode) loader.parentNode.removeChild(loader);
                        }, 400);
                    }
                }
                
                (async () => {
                    showLoadingPopup("⏳ Processing links...");
                    await processLinks();
                    hideLoadingPopup();
                })();
            } else {
                return;
            }
        }

          linkChecker();

          chrome.storage.sync.set({ Slug: null }, () => {
            console.log("null");
          });
        
            break;
        case "home" : // duda actual live site
            
        const updateSlug = () => {
            const pathParts = window.location.pathname.split("/").filter(Boolean);
            const lastpart = pathParts.slice(-1);
            chrome.storage.sync.set({ Slug: lastpart }, () => {
              console.log("Slug updated to:", lastpart);
            });
          };
          
          // Patch pushState and replaceState
          const patchHistoryMethod = (method) => {
            const original = history[method];
            history[method] = function (...args) {
              const result = original.apply(this, args);
              window.dispatchEvent(new Event('locationchange'));
              return result;
            };
          };
          
          patchHistoryMethod('pushState');
          patchHistoryMethod('replaceState');
          
          // Listen for all types of navigation changes
          window.addEventListener('popstate', updateSlug);
          window.addEventListener('locationchange', updateSlug);
          
          // Run once immediately
          updateSlug();
            break;
        default : // duda actual live site
          chrome.storage.sync.set({ Slug: null }, () => {
            console.log("null");
          });
            break;
    }
} else 
if (site.includes("lsearch.lightning.force.com")){
    switch (sitePath) {
        case "lightning": // salesforce website
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'generateClicked') {
              (async () => {
                const html = document.documentElement.outerHTML;
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
          
                const questions = doc.querySelectorAll('.questionsection');
                const answers = doc.querySelectorAll('.answerSection');
                const dates = doc.querySelectorAll('.dateTimesection');
          
                const collectedData = [];
          
                const labelsToMatch = [
                    "Business Name",
                        "Website Action",
                        "ABN",
                        "ACN",
                        "Address",
                        "How would you like your address shown on your website/profile?",
                        "Primary Business Phone Number",
                        "Secondary Business Phone Number",
                        "Business Email Address",
                        "Would you like your email address displayed on your website?",
                        "Additional Email Address/es",
                        "Trading Hours",
                        "Do you have any offers or deals you'd like showcased?",
                        "How would you like the deal or offers shown on your website?",
                        "Do you have any memberships, accreditations and/or licenses?",
                        "Please provide your existing website URL",
                        "Please provide the link to your Facebook page",
                        "Please provide the link to your Instagram",
                        "Please provide the link to your Localsearch Business Profile",
                        "Please provide the link to your Google Business Profile",
                        "Please provide the link to your YouTube channel",
                        "Please provide the link to your TikTok profile",
                        "Please provide any other social links",
                        "Website image source",
                        "Website stock image guide",
                        "Would you like any brands or companies highlighted on every page?",
                        "Do you have your frequently asked questions ready?",
                        "Please provide your frequently asked questions",
                        "Do you have testimonials?",
                        "Would you like the testimonials shown on your Website to be automatically updated?",
                        "Where would you like us to get the testimonials from?",
                        "Use Google as live testimonial source",
                        "Use Localsearch as live testimonial source",
                        "Use Facebook as live testimonial source",
                        "Use TripAdvisor as live testimonial source",
                        "Do you want to choose any specific stock images for your site?",
                        "Are there multiple locations?",
                        "If there are multiple location pages, do all locations offer the same services, products & facilities?",
                        "If there are multiple locations please advise of any differences in contact details",
                        "If there are multiple location pages, how would you like your address shown on the location pages?",
                        "Notes for the Developer",
                        "301 Redirects",
                        "Primary Accent Colour Hex Code",
                        "Secondary Accent Colour Hex Code",
                        "Tertiary Accent Colour Hex Code",
                        "Website Theme",
                        "Is the client having dynamic pages?",
                        "If a CSV is not being provided prior to build please list one product details below",
                        "What payment options do you offer?",
                        "Does the client want prices shown on their catalogue store?",
                        "Is the client having Localsearch Chat?",
                        "Email for chat",
                        "Display name for chat",
                        "Collect contact info: Name",
                        "Collect contact info: Phone Number",
                        "Collect contact info: Email",
                        "Is the client having Localsearch Bookings?",
                        "Bookings",
                        "Number of booking users needed",
                        "Booking Primary Users Full Name",
                        "Bookings Primary Users Email",
                        "Booking Primary Users Hours",
                        "Number of booking types",
                        "Is the client having dynamic pages?",
                        "What locations do you deliver to?",
                        "Do you offer in-store pick up?",
                        "What shipping options do you offer?",
                        "What payment options do you offer?",
                        "Do you want a date and time calendar shown at checkout for pickup or delivery shipping options?",
                        "If a CSV is not being provided prior to build please list one product details below"
                ];
          
                questions.forEach((question, index) => {
                  const label = question.innerText.trim();
                  const data = answers[index]?.innerHTML.trim() || "";
          
                  const datetimeElem = dates[index];
                  const fullText = datetimeElem?.textContent.trim() || "";
                  const ptag = datetimeElem?.querySelector('p')?.textContent.trim() || "";
                  const dateTime = fullText.replace(ptag, '').trim();
          
                  if (labelsToMatch.includes(label) || label.toLowerCase().includes("item")) {
                    collectedData.push([
                      label,
                      data.replace(/"/g, '""'),
                      dateTime
                    ]);
                  }
                });
          
                // Wait for chrome.storage to complete
                await new Promise((resolve) => {
                  chrome.storage.local.set({ Onboarding_information: collectedData }, () => {
                    console.log("All onboarding information saved.",collectedData);
                    resolve();
                  });
                });
          
                sendResponse({ success: true }); // Now respond after everything's done
              })();
          
              // Keep the message channel open
              return true;
            }
          });
          
            break;
    }
}
