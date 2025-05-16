// Agora App ID
const APP_ID = "be8d85ca361c481e9b4cd37ada6e5e9a";

// Get or create a unique user ID for the session
let uid = sessionStorage.getItem('uid')
if(!uid){
    uid = String(Math.floor(Math.random() * 10000)) // Generate a random ID
    sessionStorage.setItem('uid', uid) // Store the ID in session storage
}

// Initialize variables for token, client, RTM client, and channel
let token = null;
let client;
let rtmClient;
let channel;

// Get the room ID from the URL query parameters or set it to 'main' if not present
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')
if(!roomId){
    roomId = 'main'
}

// Get the display name of the user from session storage or redirect to lobby if not found
let displayName = sessionStorage.getItem('display_name')
if(!displayName){
    window.location = 'lobby.html'
}

// Initialize arrays and variables for local and remote tracks
let localTracks = []
let remoteUsers = {}

// Initialize variables for screen sharing
let localScreenTracks;
let sharingScreen = false;

// Function to initialize joining a room
let joinRoomInit = async () => {
    // Create an RTM client instance and log in with the generated user ID and token
    rtmClient = await AgoraRTM.createInstance(APP_ID)
    await rtmClient.login({uid,token})

    // Add or update local user attributes with display name
    await rtmClient.addOrUpdateLocalUserAttributes({'name':displayName})

    // Create a channel with the given room ID and join it
    channel = await rtmClient.createChannel(roomId)
    await channel.join()

    // Set up event listeners for member joining, leaving, and channel messages
    channel.on('MemberJoined', handleMemberJoined)
    channel.on('MemberLeft', handleMemberLeft)
    channel.on('ChannelMessage', handleChannelMessage)

    // Display welcome message and initialize Agora RTC client
    getMembers()
    addBotMessageToDom(`Welcome to the room ${displayName}! 👋`)
    client = AgoraRTC.createClient({mode:'rtc', codec:'vp8'})
    await client.join(APP_ID, roomId, token, uid)

    // Set up event listeners for user publishing and leaving
    client.on('user-published', handleUserPublished)
    client.on('user-left', handleUserLeft)
}

// Function to join the stream
let joinStream = async () => {
    // Hide the join button and display stream actions
    document.getElementById('join-btn').style.display = 'none'
    document.getElementsByClassName('stream__actions')[0].style.display = 'flex'

    // Create microphone and camera tracks with specified encoder configurations
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {encoderConfig:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080}
    }})

    // Insert the local video player into the DOM and set up event listener for video frame expansion
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

    // Play the local video track and publish both tracks
    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[0], localTracks[1]])
}

// Function to switch to camera
let switchToCamera = async () => {
    // Insert the local video player into the DOM
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                 </div>`
    displayFrame.insertAdjacentHTML('beforeend', player)

    // Mute the microphone and camera tracks, remove active class from buttons
    await localTracks[0].setMuted(true)
    await localTracks[1].setMuted(true)
    document.getElementById('mic-btn').classList.remove('active')
    document.getElementById('screen-btn').classList.remove('active')

    // Play the camera track and publish it
    localTracks[1].play(`user-${uid}`)
    await client.publish([localTracks[1]])
}

// Function to handle user published
let handleUserPublished = async (user, mediaType) => {
    // Add user to remote users
    remoteUsers[user.uid] = user

    // Subscribe to user and update video player in DOM if not present
    await client.subscribe(user, mediaType)
    let player = document.getElementById(`user-container-${user.uid}`)
    if(player === null){
        player = `<div class="video__container" id="user-container-${user.uid}">
                <div class="video-player" id="user-${user.uid}"></div>
            </div>`
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame)
    }

    // Resize video frame if currently expanded
    if(displayFrame.style.display){
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px'
        videoFrame.style.width = '100px'
    }

    // Play video or audio track based on media type
    if(mediaType === 'video'){
        user.videoTrack.play(`user-${user.uid}`)
    }

    if(mediaType === 'audio'){
        user.audioTrack.play()
    }
}

// Function to handle user left
let handleUserLeft = async (user) => {
    // Remove user from remote users and DOM
    delete remoteUsers[user.uid]
    let item = document.getElementById(`user-container-${user.uid}`)
    if(item){
        item.remove()
    }

    // Resize video frames if needed
    if(userIdInDisplayFrame === `user-container-${user.uid}`){
        displayFrame.style.display = null
        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }
}

// Function to toggle microphone
let toggleMic = async (e) => {
    let button = e.currentTarget

    // Toggle mute state and update button class
    if(localTracks[0].muted){
        await localTracks[0].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[0].setMuted(true)
        button.classList.remove('active')
    }
}

// Function to toggle camera
let toggleCamera = async (e) => {
    let button = e.currentTarget

     // Toggle mute state and update button class
    if(localTracks[1].muted){
        await localTracks[1].setMuted(false)
        button.classList.add('active')
    }else{
        await localTracks[1].setMuted(true)
        button.classList.remove('active')
    }
}

// Function to toggle screen sharing
let toggleScreen = async (e) => {
    let screenButton = e.currentTarget
    let cameraButton = document.getElementById('camera-btn')

    // Toggle between screen sharing and camera
    if(!sharingScreen){
        sharingScreen = true

         // Update button classes and hide camera button
        screenButton.classList.add('active')
        cameraButton.classList.remove('active')
        cameraButton.style.display = 'none'

         // Create screen video track and display it
        localScreenTracks = await AgoraRTC.createScreenVideoTrack()

        document.getElementById(`user-container-${uid}`).remove()
        displayFrame.style.display = 'block'

        let player = `<div class="video__container" id="user-container-${uid}">
                <div class="video-player" id="user-${uid}"></div>
            </div>`

        displayFrame.insertAdjacentHTML('beforeend', player)
        document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame)

        userIdInDisplayFrame = `user-container-${uid}`
        localScreenTracks.play(`user-${uid}`)

        // Unpublish camera track and publish screen track
        await client.unpublish([localTracks[1]])
        await client.publish([localScreenTracks])

         // Resize other video frames
        let videoFrames = document.getElementsByClassName('video__container')
        for(let i = 0; videoFrames.length > i; i++){
            if(videoFrames[i].id != userIdInDisplayFrame){
              videoFrames[i].style.height = '100px'
              videoFrames[i].style.width = '100px'
            }
          }


    }else{
          // Stop screen sharing and switch back to camera
        sharingScreen = false
        cameraButton.style.display = 'block'
        document.getElementById(`user-container-${uid}`).remove()
        await client.unpublish([localScreenTracks])

        switchToCamera()
    }
}

// Function to leave the stream
let leaveStream = async (e) => {
    e.preventDefault()

    // Display the join button and hide stream actions
    document.getElementById('join-btn').style.display = 'block'
    document.getElementsByClassName('stream__actions')[0].style.display = 'none'

    // Stop and close local tracks
    for(let i = 0; localTracks.length > i; i++){
        localTracks[i].stop()
        localTracks[i].close()
    }
    // Unpublish local tracks
    await client.unpublish([localTracks[0], localTracks[1]])

    // Unpublish local screen tracks if present
    if(localScreenTracks){
        await client.unpublish([localScreenTracks])
    }

    // Remove local video player from DOM
    document.getElementById(`user-container-${uid}`).remove()

    // Resize video frames if needed
    if(userIdInDisplayFrame === `user-container-${uid}`){
        displayFrame.style.display = null

        for(let i = 0; videoFrames.length > i; i++){
            videoFrames[i].style.height = '300px'
            videoFrames[i].style.width = '300px'
        }
    }

    // Send user left message through channel
    channel.sendMessage({text:JSON.stringify({'type':'user_left', 'uid':uid})})
}

// Event listeners for buttons
document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
document.getElementById('screen-btn').addEventListener('click', toggleScreen)
document.getElementById('join-btn').addEventListener('click', joinStream)
document.getElementById('leave-btn').addEventListener('click', leaveStream)

// Initialize joining the room
joinRoomInit()