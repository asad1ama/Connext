// Get the lobby form element
let form = document.getElementById('lobby__form');

// Get the display name from sessionStorage and set it as the default value in the form
let displayName = sessionStorage.getItem('display_name');
if(displayName){
    form.name.value = displayName;
}

// Event listener for form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Set the display name in sessionStorage from the form input
    sessionStorage.setItem('display_name', e.target.name.value);

    // Get the invite code from the form input
    let inviteCode = e.target.room.value;

    // If no invite code is provided, generate a random one
    if(!inviteCode){
        inviteCode = String(Math.floor(Math.random() * 10000));
    }

    // Redirect to the room.html page with the invite code as a query parameter
    window.location = `room.html?room=${inviteCode}`;
});
