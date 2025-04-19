// Get all navigation buttons and sections
const buttons = document.querySelectorAll('.nav-button');
const sections = document.querySelectorAll('.bodyContainer');
let urlApi = "https://script.google.com/macros/s/AKfycbzqBitR-j6jSYXvjCpdDWGVCxNIxVjSD08rIoCTs9QZiVRC1tGWSWb2A3NutYfhzx0/exec";

// Add click event listener to each button
buttons.forEach((button) => {
  button.addEventListener('click', (event) => {
    // Remove active class from all buttons and sections
    buttons.forEach((btn) => btn.classList.remove('active-tab'));
    sections.forEach((section) => section.classList.remove('active'));

    // Add active class to the clicked button and corresponding section
    const activeAttr = event.target.getAttribute('data-attr');
    event.target.classList.add('active-tab');
    document.querySelector(`.bodyContainer[data-attr="${activeAttr}"]`).classList.add('active');
  });
});

// Set the default active tab (optional)
buttons[0].classList.add('active-tab');
sections[0].classList.add('active');