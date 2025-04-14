document.addEventListener('DOMContentLoaded', function() {
    const settingsForm = document.getElementById('settings-form');  
    const addChecklistButton = document.getElementById('add-checklist');
    const checklistContainer = document.getElementById('checklist-container');
    const saveButton = document.getElementById('save-button');

    // Add event listeners to buttons
    addChecklistButton.addEventListener('click', addChecklist);
    saveButton.addEventListener('click', function(event) {
        event.preventDefault();
        const formData = new FormData(settingsForm);
        const checklistItems = formData.getAll('checklist[]');
        console.log('Form data:', Object.fromEntries(formData.entries()));
        console.log('Checklist items:', checklistItems);
        // Add your save logic here
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    });

    // Initialize checklist container
    checklistContainer.style.display = 'block';
    addChecklistButton.style.display = 'block';
});

function addChecklist() {
    const checklistContainer = document.getElementById('checklist-container');
    const checklistItem = document.createElement('div');
    checklistItem.classList.add('checklist-item', 'mb-2', 'd-flex', 'align-items-center');
    checklistItem.innerHTML = `
        <input type="text" name="checklist[]" class="form-control me-2" placeholder="Checklist item" required>
        <button type="button" class="btn btn-secondary me-2 save-checklist">Save</button>
        <button type="button" class="btn btn-secondary me-2">Edit</button>
        <button type="button" class="btn btn-primary me-2">Move Up</button>
        <button type="button" class="btn btn-primary me-2">Move Down</button>
        <button type="button" class="btn btn-danger remove-checklist">Remove</button>
    `;
    checklistContainer.appendChild(checklistItem);

    // Add event listener to the remove button
    const removeButton = checklistItem.querySelector('.remove-checklist');
    const saveButton = checklistItem.querySelector('.save-checklist');
    removeButton.addEventListener('click', removeChecklist);
    saveButton.addEventListener('click', saveChecklist);
}

function removeChecklist(event) {
    const checklistItem = event.target.closest('.checklist-item');
    checklistItem.remove();
}

function displaysaveButton() {
    //check chrome.storage API for checklist items checklist: {arg: arg, id: id, content: checklistValue} id value if they exist then display save button
    chrome.storage.sync.get(['checklist'], function(result) {
        const checklist = result.checklist;
        if (checklist && checklist.id) {

            document.getElementById('save-button').style.display = 'none';
        } else {
            // show save button if checklist does not exist
            document.getElementById('save-button').style.display = 'block';
        }
    });

}

function saveChecklist(event) {
    //save Checklist using chrome.storage API
    const checklistItem = event.target.closest('.checklist-item');
    const inputField = checklistItem.querySelector('input[name="checklist[]"]');
    const checklistValue = inputField.value.trim();

    if (checklistValue) {
        // Save the checklist value using chrome.storage API
        chrome.storage.sync.set({ checklist: {arg: arg, id: id, content: checklistValue} }, function() {
            console.log('Checklist saved:', checklistValue);
        });
    } else {
        console.error('Checklist item cannot be empty');
    }
}