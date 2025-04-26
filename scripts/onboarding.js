const generate = document.getElementById('generateData');

const elementTable = document.querySelectorAll('table.table');
const onboardingTab = document.querySelectorAll('a.subTab');

const onboardingdata = document.getElementById('onboardingData');
const sitemap = document.getElementById('sitemapData');

onboardingTab.forEach((button) => {
  button.addEventListener('click', (event) => {
    onboardingTab.forEach((btn) => btn.classList.remove('active'));
    elementTable.forEach((section) => section.classList.remove('active'));

    const activeAttr = event.target.getAttribute('data-attr');
    event.target.classList.add('active');
    document.querySelector(`table[data-attr="${activeAttr}"]`).classList.add('active');
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

    data.forEach(value => {
      let label = value[0]?.trim();
      let answer = value[1]?.trim();
      let date = value[2]?.trim();

      if (!label.startsWith("Item") && !label.startsWith("Does item") && !label.startsWith("Does Item")) {
        let tr = document.createElement('tr');
        tr.classList.add('treader');
        tr.innerHTML = `
          <td class="questionSection"><h3>${label}</h3></td>
          <td class="answerSection" data-value="${answer}"><p>${answer}</p></td>
          <td class="dateSection"><p>${date}</p></td>
        `;
        onboardingdata.appendChild(tr);
        tr.querySelector('.answerSection').addEventListener('click', function () {
          let getValue = this.getAttribute('data-value');
          navigator.clipboard.writeText(getValue).then(() => {
            console.log(`Copied: ${getValue}`);
            showPopup(`${getValue} Copied!`)
          }).catch(err => {
            console.error('Failed to copy: ', err);
          });
        })
      } else if (label.startsWith("Item")) {
        
        
      }
    });

    let table = new DataTable("#onboardingTable", {
      searchable: true,
      sortable: false,
      responsive: true,
      paging: false,
      order: [],
      columns: [
        { select: 0, searchable: true, sortable: false },  // First column (Label) with no sorting
        { select: 1, sortable: false },                    // Second column (Answer) with no sorting
        { select: 2, searchable: true, sortable: true }    // Third column (Date) with sorting enabled
      ]
    });

    console.log(data);
  } else {
    console.log("No onboarding information found in storage.");
  }
});

function showPopup(message) {
  let popup = document.createElement('div');
  popup.textContent = message;
  popup.style.position = 'fixed';
  popup.style.top = '20px';
  popup.style.left = '50%';
  popup.style.transform = 'translateX(-50%)';
  popup.style.background = '#4caf50';
  popup.style.color = '#fff';
  popup.style.padding = '10px 20px';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  popup.style.zIndex = 9999;
  popup.style.opacity = 1;
  popup.style.transition = 'opacity 0.5s ease';

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.opacity = 0;
    setTimeout(() => document.body.removeChild(popup), 500);
  }, 1500);
}