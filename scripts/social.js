const socialContainer = document.querySelector('.socialContainer');
const searchSocial = document.getElementById('searchSocials');

fetch(urlApi)
  .then(res => res.json())
  .then(data => {
    data['Social_media'].forEach((row) => {
      let name = row[0]?.trim();
      let png = row[1]?.trim();
      let svg = row[2]?.trim();
      let alt = row[3]?.trim();
      let key = row[4]?.trim();

      let div = document.createElement('div');
      div.classList.add('card', 'socialMediaCard');
      div.setAttribute('key-data', key);
      div.innerHTML = `
        <img src="${svg || png || ''}" class="card-img-top px-3 pt-3" alt="${alt}">
        <div class="card-body">
          <h5 class="card-title">${name}</h5>
          <strong>Alt Text:</strong>
          <p class="card-text"><a href="#" data-value="${alt}">${alt}</a></p>
          <div class="d-flex gap-2">
            <a href="#" class="btn btn-warning" data-value="${svg}">SVG</a>
            <a href="#" class="btn btn-danger" data-value="${png}">PNG</a>
          </div>
        </div>
      `;

      // Attach event listeners to BOTH buttons
      div.querySelectorAll('a').forEach(btn => {
        btn.addEventListener('click', function (e) {
          e.preventDefault(); // prevent the <a href="#"> from jumping
          let dataValue = this.getAttribute('data-value');
          navigator.clipboard.writeText(dataValue).then(() => {
            showPopup(`${dataValue} Copied!`);
          }).catch(err => {
            console.error('Failed to copy: ', err);
          });
        });
      });

      socialContainer.appendChild(div);
    });
  })
  .catch(err => console.error("Error reading Social Icons:", err));