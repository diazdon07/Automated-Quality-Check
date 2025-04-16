import checklist_Database from './checklistDatabase.js';
    
const checklistItems = checklist_Database.slice(1);
    
// Select the first element with the class 'checklistInfo'
const checklistContainer = document.querySelector('.checklistInfo');
const TabShowInfo = document.querySelector('.dataShow');
    
// Iterate over the checklist items and append them to the container
checklistItems.forEach(item => {
    const isChecked = item.a ? 'checked' : ''; // Add 'checked' if item.a is truthy
    const checklistItemHTML = `
        <input type="checkbox" name="${item.id}" ${isChecked} />
        <label for="${item.id}">${item.q}</label><br>
    `;
    checklistContainer.innerHTML += checklistItemHTML; // Append the new item
});
chrome.tabs.query({active: true, currentWindow: true}, (tabs) =>{
    chrome.storage.sync.get("openTab", (data) => {
        if(data.openTab === 'show'){
            const displayInfo = `Toggle On`;
            TabShowInfo.innerHTML += displayInfo;
            return;
        } else {
            return;
        }
    });
});s