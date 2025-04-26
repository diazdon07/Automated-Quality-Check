const generate = document.getElementById('generateData');

const elementTable = document.querySelectorAll('div.basicContent');
const onboardingTab = document.querySelectorAll('a.subTab');

const onboardingdata = document.getElementById('onboardingData');
const sitemapAccordion = document.getElementById('pageAccordion');

onboardingTab.forEach((button) => {
  button.addEventListener('click', (event) => {
    onboardingTab.forEach((btn) => btn.classList.remove('active'));
    elementTable.forEach((section) => section.classList.remove('active'));

    const activeAttr = event.target.getAttribute('data-attr');
    event.target.classList.add('active');
    document.querySelector(`div.basicContent[data-attr="${activeAttr}"]`).classList.add('active');
  });
});

onboardingTab[0].classList.add('active');
elementTable[0].classList.add('active');

generate.addEventListener('click', (event) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'generateClicked' });
    }
  });
});

chrome.storage.local.get(['Onboarding_information'], function (result) {
  if (result.Onboarding_information) {
    const data = result.Onboarding_information;

    const sitemap = {}; // Fix: was array before
    let itemName = '';
    let itemParent = '';
    let itemType = '';
    let anchorLinks = '';
    let module = '';
    let action = '';
    let needInfo = '';
    let usedInfo = '';
    let otherInfo = '';
    let i = 0;

    data.forEach(value => {
      let label = value[0]?.trim();
      let answer = value[1]?.trim();
      let date = value[2]?.trim();

      // Normalize answer
      if (answer === "N/A" || answer === 'NA' || answer === 'Na') {
        answer = '';
      }

      if (!label.startsWith("Item") && !label.startsWith("Does item")) {
        let tr = document.createElement('tr');
        tr.classList.add('treader');
        tr.innerHTML = `
          <td class="questionSection"><h3>${label}</h3></td>
          <td class="answerSection" data-value="${answer}"><p>${answer}</p></td>
          <td class="dateSection"><p>${date}</p></td>
        `;
        onboardingdata.appendChild(tr);

        // Add click event to copy answer
        tr.querySelector('.answerSection').addEventListener('click', function () {
          let getValue = this.getAttribute('data-value');
          navigator.clipboard.writeText(getValue).then(() => {
            console.log(`Copied: ${getValue}`);
            showPopup(`${getValue} Copied!`);
          }).catch(err => {
            console.error('Failed to copy: ', err);
          });
        });

      } else if (label.startsWith("Item")) {

        if (label.endsWith("Name")) {
          itemName = answer || '';
          if (!sitemap[itemName]) {
            sitemap[itemName] = {};
          }
          i += 1;
        } else if (label.endsWith("Parent")) {
          itemParent = answer || '';
          if (itemName) {
            sitemap[itemName].parent = itemParent;
          }
          i += 1;
        } else if (label.endsWith("Type")) {
          itemType = answer || '';
          if (itemName) {
            sitemap[itemName].type = itemType;
          }
          i += 1;
        } else if (label.endsWith("Action")) {
          action = answer || '';
          if (itemName) {
            sitemap[itemName].action = action;
          }
          i += 1;
        } else if (label.endsWith("info?")) {
          needInfo = answer || '';
          if (itemName) {
            sitemap[itemName].needinfo = needInfo;
          }
          i += 1;
        } else if (label.endsWith("links")) {
          anchorLinks = answer || '';
          if (itemName) {
            sitemap[itemName].anchor = anchorLinks;
          }
          i += 1;
        } else if (label.endsWith("as")) {
          usedInfo = answer || '';
          if (itemName) {
            sitemap[itemName].usedinfo = usedInfo;
          }
          i += 1;
        } else if (label.endsWith("Modules")) {
          module = answer || '';
          if (itemName) {
            sitemap[itemName].module = module;
          }
          i += 1;
        } else if (label.endsWith("Information")) {
          otherInfo = answer || 'N/A';
          sitemap[itemName].otherInfo = otherInfo;
        }
      }
    });

    const searchInput = document.getElementById('searchKey');
    const searchContainer = document.getElementById('pageAccordion'); // make sure this exists!

    for (const itemName in sitemap) {
      const item = sitemap[itemName];
      const sanitizedItemName = sanitizeId(itemName);
      const headingId = `heading-${sanitizedItemName}`;
      const collapseId = `collapse-${sanitizedItemName}`;

      let div = document.createElement('div');
      div.classList.add('accordion-item', 'mb-3', 'shadow-sm');
      div.setAttribute('data-keywords', `
        ${itemName} ${item.parent || ''} 
        ${item.type || ''} 
        ${item.action || ''} 
        ${item.module ? 'Modules' : ''}
        ${item.anchor ? 'Anchor Links' : ''}
        ${item.needinfo ? 'Needed Info' : ''} 
        ${item.usedinfo ? 'Use Information' : ''}
        ${item.otherInfo ? 'Information' : ''}
        `.toLowerCase()); // helpful for search
      div.innerHTML = `
        <h2 class="accordion-header" id="${headingId}">
          <button class="accordion-button d-flex flex-row justify-content-start collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
            <nav aria-label="breadcrumb" class="w-100" style="--bs-breadcrumb-divider: '>';">
              <ol class="breadcrumb d-flex flex-wrap">
                ${item.parent ? `<li class="breadcrumb-item text-muted">${item.parent}</li>` : ''}
                <li class="breadcrumb-item active" aria-current="page">${itemName}</li>
              </ol>
            </nav>
            <div class="small text-muted px-3">
              ${item.type || ''} | ${item.action || ''}
            </div>
          </button>
        </h2>

        <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#pageAccordion">
          <div class="accordion-body">
          ${
            item.module || item.anchor || item.needinfo || item.usedinfo || item.otherInfo
              ? `
                ${item.module ? `<p><strong>Modules:</strong></p><p>${item.module}</p>` : ''}
                ${item.anchor ? `<p><strong>Anchor Links:</strong> ${item.anchor}</p>` : ''}
                ${item.needinfo ? `<p><strong>Needed Info:</strong> ${item.needinfo}</p>` : ''}
                ${item.usedinfo ? `<p><strong>Use Information:</strong> ${item.usedinfo}</p>` : ''}
                ${item.otherInfo ? `<p><strong>Information:</strong> ${item.otherInfo}</p>` : ''}
              `
              : `<p><em>No Additional information available.</em></p>`
          }
          </div>
        </div>
      `;

      searchContainer.appendChild(div);
    }

    // Attach search only ONCE
    searchInput.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase();
      const accordionItems = searchContainer.querySelectorAll('.accordion-item');

      accordionItems.forEach(item => {
        const keywords = item.getAttribute('data-keywords');
        if (keywords.includes(searchTerm)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });


    function sanitizeId(name) {
      return name.toLowerCase()
                 .replace(/\s+/g, '-')        // Replace spaces with dashes
                 .replace(/[^a-z0-9\-]/g, ''); // Remove anything except letters, numbers, dashes
    }

    let table = new DataTable("#onboardingTable", {
      searchable: true,
      sortable: false,
      responsive: true,
      paging: false,
      order: [],
      columns: [
        { select: 0, searchable: true, sortable: false },
        { select: 1, sortable: false },
        { select: 2, searchable: true, sortable: true }
      ]
    });

    console.log(data);
  } else {
    console.log("No onboarding information found in storage.");
  }
});
