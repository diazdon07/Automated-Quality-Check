// Get all navigation buttons and sections
const buttons = document.querySelectorAll('.headerNav');
const sections = document.querySelectorAll('.bodyContainer');
let urlApi = "https://script.google.com/macros/s/AKfycbzqBitR-j6jSYXvjCpdDWGVCxNIxVjSD08rIoCTs9QZiVRC1tGWSWb2A3NutYfhzx0/exec";

// Add click event listener to each button
buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    // Remove active class from all buttons and sections
    buttons.forEach((btn) => btn.classList.remove('active'));
    sections.forEach((section) => section.classList.remove('active'));

    // Add active class to the clicked button and corresponding section
    const activeAttr = event.target.getAttribute('data-attr');
    event.target.classList.add('active');
    document.querySelector(`.bodyContainer[data-attr="${activeAttr}"]`).classList.add('active');
  });
});

// Set the default active tab (optional)
buttons[0].classList.add('active');
sections[0].classList.add('active');

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