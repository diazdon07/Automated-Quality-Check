const checklistContainer = document.querySelector('.checklistInfo');
const searchList = document.querySelector('#searchList');

fetch(urlApi)
  .then(res => res.json())
  .then(data => {
    const grouped = {};

    data['Checklist_question'].forEach((row) => {
      const label = row[0]?.trim();
      const category = row[1]?.trim();
      
      if (!label || !category) return;
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(label);
    });
      
    for (const [category, items] of Object.entries(grouped)) {
      const categoryTitle = `<h3>${category}</h3>`;
      checklistContainer.innerHTML += categoryTitle;
      
      items.forEach((label, index) => {
        const id = `check-${category}-${index}`;
        const checklistItemHTML = `
        <div class="input-group mb-1">
          <div class="input-group-text">
            <input class="form-check-input mt-0" type="checkbox" id="${id}" value="" name="${category}" value="${label}" aria-label="Checkbox if task already done." />
          </div>
          <label class="form-control" for="${id}">${label}</label>
        </div>
        `;
        checklistContainer.innerHTML += checklistItemHTML;
      });
    }
  })
.catch(err => console.error("Error reading sheet:", err));
searchList.addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase();
  const titles = document.querySelectorAll('label.form-control');

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