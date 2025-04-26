const cheatsheetContainer = document.querySelector('.cheatsheetdata');
const searchInput = document.getElementById('searchInput');

fetch(urlApi)
  .then(res => res.json())
  .then(data => {
    data['cheatsheet'].forEach((row) => {
      const label = row[0]?.trim();
      const script = row[1]?.trim();

      const block = document.createElement('div');
      block.innerHTML = `
        <h3 class="scriptTitle" style="cursor:pointer;">
          ${label}
        </h3>
      `;

      block.querySelector('.scriptTitle').addEventListener('click', function () {

        navigator.clipboard.writeText(script).then(() => {
          console.log(`Script Copied: ${script}`);
        }).catch(err => {
          console.error('Failed to copy: ', err);
        });
      });

      cheatsheetContainer.appendChild(block);
    });
  })
  .catch(err => console.error("Error reading sheet:", err));

  searchInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const titles = document.querySelectorAll('.cheatsheetdata .scriptTitle');
  
    titles.forEach(title => {
      const text = title.textContent.toLowerCase();
      const parentBlock = title.parentElement;
      if (text.includes(searchTerm)) {
        parentBlock.style.display = '';
      } else {
        parentBlock.style.display = 'none';
      }
    });
  });