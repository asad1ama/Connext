// Function to handle a new member joining the room
let handleMemberJoined = async (MemberId) => {
  console.log('A new member has joined the room:', MemberId);
  // Add the new member to the DOM
  addMemberToDom(MemberId);

  // Update the total number of members in the room
  let members = await channel.getMembers();
  updateMemberTotal(members);

  // Get the name of the new member and display a welcome message
  let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);
  addBotMessageToDom(`Welcome to the room ${name}! 👋`);
}

// Function to add a member to the DOM
let addMemberToDom = async (MemberId) => {
  let {name} = await rtmClient.getUserAttributesByKeys(MemberId, ['name']);

  let membersWrapper = document.getElementById('member__list');
  let memberItem = `<div class="member__wrapper" id="member__${MemberId}__wrapper">
                      <span class="green__icon"></span>
                      <p class="member_name">${name}</p>
                  </div>`;

  membersWrapper.insertAdjacentHTML('beforeend', memberItem);
}

// Function to update the total number of members displayed
let updateMemberTotal = async (members) => {
  let total = document.getElementById('members__count');
  total.innerText = members.length;
}

// Function to handle a member leaving the room
let handleMemberLeft = async (MemberId) => {
  removeMemberFromDom(MemberId);

  let members = await channel.getMembers();
  updateMemberTotal(members);
}

// Function to remove a member from the DOM
let removeMemberFromDom = async (MemberId) => {
  let memberWrapper = document.getElementById(`member__${MemberId}__wrapper`);
  let name = memberWrapper.getElementsByClassName('member_name')[0].textContent;
  addBotMessageToDom(`${name} has left the room.`);

  memberWrapper.remove();
}

// Function to fetch and display all current members
let getMembers = async () => {
  let members = await channel.getMembers();
  updateMemberTotal(members);
  for (let i = 0; members.length > i; i++){
      addMemberToDom(members[i]);
  }
}

// Function to handle incoming channel messages
let handleChannelMessage = async (messageData, MemberId) => {
  console.log('A new message was received');
  let data = JSON.parse(messageData.text);

  // If the message type is 'chat', add it to the DOM
  if(data.type === 'chat'){
      addMessageToDom(data.displayName, data.message);
  }

  // If the message type is 'user_left', remove the user's video container from the DOM
  if(data.type === 'user_left'){
      document.getElementById(`user-container-${data.uid}`).remove();

      // Resize video frames if necessary
      if(userIdInDisplayFrame === `user-container-${uid}`){
          displayFrame.style.display = null;

          for(let i = 0; videoFrames.length > i; i++){
              videoFrames[i].style.height = '300px';
              videoFrames[i].style.width = '300px';
          }
      }
  }
}

// Function to send a chat message
let sendMessage = async (e) => {
  e.preventDefault();

  // Get the message from the form and send it through the channel
  let message = e.target.message.value;
  channel.sendMessage({text:JSON.stringify({'type':'chat', 'message':message, 'displayName':displayName})});
  // Add the message to the DOM
  addMessageToDom(displayName, message);
  e.target.reset();
}

// Function to add a message to the DOM
let addMessageToDom = (name, message) => {
  let messagesWrapper = document.getElementById('messages');

  let newMessage = `<div class="message__wrapper">
                      <div class="message__body">
                          <strong class="message__author">${name}</strong>
                          <p class="message__text">${message}</p>
                      </div>
                  </div>`;

  messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

  // Scroll to the bottom of the message container
  let lastMessage = document.querySelector('#messages .message__wrapper:last-child');
  if(lastMessage){
      lastMessage.scrollIntoView();
  }
}

// Function to add a bot message to the DOM
let addBotMessageToDom = (botMessage) => {
  let messagesWrapper = document.getElementById('messages');

  let newMessage = `<div class="message__wrapper">
                      <div class="message__body__bot">
                          <strong class="message__author__bot">🤖 Chat Bot</strong>
                          <p class="message__text__bot">${botMessage}</p>
                      </div>
                  </div>`;

  messagesWrapper.insertAdjacentHTML('beforeend', newMessage);

  // Scroll to the bottom of the message container
  let lastMessage = document.querySelector('#messages .message__wrapper:last-child');
  if(lastMessage){
      lastMessage.scrollIntoView();
  }
}

// Function to leave the channel and log out the RTM client on window unload
let leaveChannel = async () => {
  await channel.leave();
  await rtmClient.logout();
}

window.addEventListener('beforeunload', leaveChannel);

// Event listener for sending messages
let messageForm = document.getElementById('message__form');
messageForm.addEventListener('submit', sendMessage);
