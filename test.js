(async function collectBackgroundImagesFromCurrentPage() {
    try {
        const backgroundImages = [];

        // 1. Check for inline background-image styles
        const divs = Array.from(document.querySelectorAll('div[style*="background-image"]'));
        for (const div of divs) {
            const style = div.getAttribute('style');
            const match = style.match(/background-image:\s*url\(["']?(.*?)["']?\)/i);
            if (match && match[1]) {
                const imageUrl = new URL(match[1], location.href).href;
                console.log("Found inline background-image URL:", imageUrl);
                backgroundImages.push(imageUrl);
            }
        }

        // 2. Look in external stylesheets
        console.log("Checking CSS files for background images...");
        const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
        const cssUrls = Array.from(linkTags).map(link => link.href);
        console.log("CSS URLs found:", cssUrls);

        for (const cssUrl of cssUrls) {
            const cssRes = await fetch(cssUrl);
            const cssText = await cssRes.text();

            // Regex to find background-image rules
            const regex = /(?:\.|#)?[a-zA-Z0-9_-]+\s*{[^}]*background-image:\s*url\(["']?(.*?)["']?\)/g;
            let match;
            while ((match = regex.exec(cssText)) !== null) {
                if (match[1]) {
                    const imageUrl = new URL(match[1], cssUrl).href;
                    console.log("Found background-image in CSS:", imageUrl);
                    backgroundImages.push(imageUrl);
                }
            }
        }

        if (backgroundImages.length > 0) {
            console.log("All background images found:", backgroundImages);
        } else {
            console.log("No background images found.");
        }

    } catch (err) {
        console.error("Error collecting background images:", err);
    }
})();
