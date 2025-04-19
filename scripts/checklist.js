const checklistContainer = document.querySelector('.checklistInfo');

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
          <div class="check-item">
            <input type="checkbox" id="${id}" name="${category}" value="${label}" />
            <label for="${id}">${label}</label>
          </div>
        `;
        checklistContainer.innerHTML += checklistItemHTML;
      });
    }
  })
.catch(err => console.error("Error reading sheet:", err));