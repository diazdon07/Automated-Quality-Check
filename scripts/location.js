const locationContainer = document.querySelector('.previewlocation');
const searchLocation = document.getElementById('searchLocation');

let locationData = []; // Store all fetched data here

// Render function that accepts filtered data
function renderLocations(dataArray) {
  locationContainer.innerHTML = ''; // Clear previous elements

  dataArray.forEach(row => {
    const location = row[0]?.trim();
    const state = row[1]?.trim();
    const post_code = row[2];
    const link = row[3]?.trim();
    const iframe = row[4]?.trim();
    const description = row[5]?.trim();

    const AddressFormat = `${location}, ${state} ${post_code}`;

    const block = document.createElement('div');
    block.innerHTML = `
      <h3 class="locationAddress" style="cursor:pointer;" data-link="${link}">
        ${AddressFormat}
      </h3>
      <div>${iframe}</div>
      <p>${description}</p>
    `;
    block.classList.add('filterLocation');
    block.setAttribute('data-location', AddressFormat);

    block.querySelector('.locationAddress').addEventListener('click', function () {
      const linkText = this.getAttribute('data-link');
      navigator.clipboard.writeText(linkText)
        .then(() => showPopup(`Google Location Link Copied!`))
        .catch(err => console.error('Failed to copy: ', err));
    });

    locationContainer.appendChild(block);
  });
}

// Fetch and initialize
fetch(urlApi)
  .then(res => res.json())
  .then(data => {
    locationData = data['location_data']; // Save the full dataset
  })
  .catch(err => console.error("Error reading sheet:", err));

// Filter and render based on search
searchLocation.addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase().trim();

  if (!searchTerm) {
    locationContainer.innerHTML = '';
    return;
  }

  const filteredData = locationData.filter(row => {
    const location = row[0]?.trim().toLowerCase() || '';
    const state = row[1]?.trim().toLowerCase() || '';
    const post_code = row[2]?.toString().toLowerCase() || '';
    const combined = `${location}, ${state} ${post_code}`;
    return combined.includes(searchTerm);
  });

  renderLocations(filteredData);
});