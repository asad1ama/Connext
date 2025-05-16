// Get the messages container and scroll to the bottom
let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

// Get member and chat containers and buttons
const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');
const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

// Initialize variables to track the display state of member and chat containers
let activeMemberContainer = false;
let activeChatContainer = false;

// Toggle member container visibility on button click
memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }
  activeMemberContainer = !activeMemberContainer;
});

// Toggle chat container visibility on button click
chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }
  activeChatContainer = !activeChatContainer;
});

// Get display frame and video frames, initialize userIdInDisplayFrame variable
let displayFrame = document.getElementById('stream__box')
let videoFrames = document.getElementsByClassName('video__container')
let userIdInDisplayFrame = null;

// Function to expand a video frame when clicked
let expandVideoFrame = (e) => {
  let child = displayFrame.children[0]
  if(child){
      document.getElementById('streams__container').appendChild(child)
  }

  displayFrame.style.display = 'block'
  displayFrame.appendChild(e.currentTarget)
  userIdInDisplayFrame = e.currentTarget.id

  for(let i = 0; videoFrames.length > i; i++){
    if(videoFrames[i].id != userIdInDisplayFrame){
      videoFrames[i].style.height = '100px'
      videoFrames[i].style.width = '100px'
    }
  }
}

// Add event listeners to each video frame for expanding
for(let i = 0; videoFrames.length > i; i++){
  videoFrames[i].addEventListener('click', expandVideoFrame)
}

// Function to hide display frame when clicked
let hideDisplayFrame = () => {
    userIdInDisplayFrame = null
    displayFrame.style.display = null

    let child = displayFrame.children[0]
    document.getElementById('streams__container').appendChild(child)

    for(let i = 0; videoFrames.length > i; i++){
      videoFrames[i].style.height = '300px'
      videoFrames[i].style.width = '300px'
  }
}

// Add event listener to display frame for hiding
displayFrame.addEventListener('click', hideDisplayFrame)
