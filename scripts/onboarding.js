const generate = document.getElementById('generateData');
const table = document.getElementById('onboardingTable');

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

      let tr = document.createElement('tr');
      tr.classList.add('row');
      tr.innerHTML = `
        <th class="questionSection"><h3>${label}</h3></th>
        <td class="answerSection"><p>${answer}</p></td>
        <td class="dateSection"><h3>Date Last Update</h3><p>${date}</p></td>
      `;
      table.appendChild(tr);
    });

    console.log(data);
  } else {
    console.log("No onboarding information found in storage.");
  }
});
