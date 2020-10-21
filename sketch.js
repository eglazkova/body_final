let badSound;
let police;
let flash;
let redFlash;



// Peer variables
let startPeer;

// Posenet variables
let video;
let poseNet;

// Variables to hold poses
let myPose = {};
let partnerPose = {};

// Variables to hold wrists
let myLeftWrist;
let partnerLeftWrist;
let myRightWrist;
let partnerRightWrist;

// Confidence threshold for posenet keypoints
const scoreThreshold = 0.5;

function preload() {

  badSound = loadSound("sound.mp3");
  police = loadSound("helicopter.mp3");
  flash = loadImage("flash.png");
  redFlash = loadImage("red_flash.jpg"); 

}
 
function setup() {

createCanvas(windowWidth, windowHeight);
//badSound.play();

  video = createCapture(VIDEO);
  video.size(width/2, height/2);
  video.hide();


  // Options for posenet
  // See https://ml5js.org/reference/api-PoseNet/
  // Use these options for slower computers, esp architecture
  const options = {
    architecture: 'MobileNetV1',
    imageScaleFactor: 0.3,
    outputStride: 16,
    flipHorizontal: true,
    minConfidence: 0.5,
    scoreThreshold: 0.5,
    nmsRadius: 20,
    detectionType: 'single',
    inputResolution: 513,
    multiplier: 0.75,
    quantBytes: 2,
  };

  // Computers with more robust gpu can handle architecture 'ResNet50'
  // It is more accurate at the cost of speed
  // const options = {
  //   architecture: 'ResNet50',
  //   outputStride: 32,
  //   detectionType: 'single',
  //  flipHorizontal: true,
  //   quantBytes: 2,
  // };

  // Create poseNet to run on webcam and call 'modelReady' when ready
  poseNet = ml5.poseNet(video, options, modelReady);

  // Everytime we get a pose from posenet, call "getPose"
  // and pass in the results
  poseNet.on('pose', (results) => getPose(results));

  

  // Start socket client automatically on load
  // By default it connects to http://localhost:80
//WebRTCPeerClient.initSocketClient();

  // To connect to server remotely pass the ngrok address
  // See https://github.com/lisajamhoury/WebRTC-Simple-Peer-Examples#to-run-signal-server-online-with-ngrok
  WebRTCPeerClient.initSocketClient('https://58654f90ddb7.ngrok.io');

  // Start the peer client
  WebRTCPeerClient.initPeerClient();
}


function draw() {

  
  // Only proceed if the peer is started
  // And if there is a pose from posenet
  if (
    !WebRTCPeerClient.isPeerStarted() ||
    typeof myPose.pose === 'undefined'
  ) {
    console.log('returning!');
    return;
  }

 

  // Get the incoming data from the peer connection
  const newData = WebRTCPeerClient.getData();
 

  // Check if there's anything in the data
  if (newData === null) {
    return;
    // If there is data
  } else {
    // Get the pose data from newData.data
    // newData.data is the data sent by user
    // newData.userId is the peer ID of the user
    partnerPose = newData.data;
  }

  // If we don't yet have a partner pose
  if (partnerPose === null) {
    // Return and try again for partner pose
    console.log('waiting for partner');
    return;
  }

  myLeftWrist = getLeftWrist(myPose);
  myRightWrist = getRightWrist(myPose);

  
  partnerLeftWrist = getPartnerLeftWrist(partnerPose);
  partnerRightWrist = getPartnerRightWrist(partnerPose);

  
  background(0);

  // Draw my keypoints and skeleton
  drawMyKeypoints(myPose, flash, 2); // draw keypoints
  //drawSkeleton(myPose, colors.x, 2); // draw skeleton

  // Draw partner keypoints and skeleton
  drawPartnerKeypoints(partnerPose, redFlash, 2);
  //drawSkeleton(partnerPose, colors.y, 2);




  //If our L-R wrists are touching
  if (touching(myLeftWrist, myRightWrist)) {
  //if (touching(myLeftWrist, partnerLeftWrist)) {
    //if (touching(partnerLeftWrist, partnerRightWrist)) {
    console.log('touching!');
   //police.play();
    badSound.stop(); 
  };

  
  // //If our L-R wrists are touching
  // if (touching(myRightWrist, partnerRightWrist)) {
  //   console.log('touching!');
  //   //if (touching(myLeftWrist, myRightWrist)) {
  //     badSound.stop();
  //     police.play();
  //   }

  }

// When posenet model is ready, let us know!
function modelReady() {
  console.log('Model Loaded');
}

// Function to get and send pose from posenet
function getPose(poses) {
  // We're using single detection so we'll only have one pose
  // which will be at [0] in the array
  myPose = poses[0];

  // Send my pose over peer if the peer is started
  if (WebRTCPeerClient.isPeerStarted()) {
    WebRTCPeerClient.sendData(myPose);
  }
}

// A function to draw the image over the detected keypoints
// Include an offset if testing by yourself
// And you want to offset one of the skeletons
function drawMyKeypoints(pose, img1, offset) {
  // Loop through all keypoints
  for (let j = 0; j < pose.pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.pose.keypoints[j];
   
    if (keypoint.score > scoreThreshold) {
        let size = random(1, 27);

          img1 = image(flash, keypoint.position.x + offset, keypoint.position.y, size, size);
          

    }
  }
}

function drawPartnerKeypoints(pose, img2, offset) {
  // Loop through all keypoints
  for (let j = 0; j < pose.pose.keypoints.length; j++) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.pose.keypoints[j];
   
    if (keypoint.score > scoreThreshold) {
        let size = random(1, 27);
        img2 = image(redFlash, keypoint.position.x + offset, keypoint.position.y, size, size)

    }
  }
}





// A function to draw the skeletons
function drawSkeleton(pose, clr, offset) {
  // Loop through all the skeletons detected
  const skeleton = pose.skeleton;

  // For every skeleton, loop through all body connections
  for (let j = 0; j < skeleton.length; j++) {
    // Get the ends "joints" for each bone
    const partA = skeleton[j][0];
    const partB = skeleton[j][1];

    // If the score is high enough
    if (
      partA.score > scoreThreshold &&
      partB.score > scoreThreshold
    ) {
      // Draw a line to represent the bone
      stroke(clr);
      //text("touch", partA.position.x + offset,
     // partA.position.y);
      //text("stand", partB.position.x + offset,
      //partB.position.y);
      line(
        partA.position.x + offset,
        partA.position.y,
        partB.position.x + offset,
        partB.position.y,
      );
    }
  }
}

function getLeftWrist(pose) {
  
  return pose.pose.leftWrist;
}


function getRightWrist(pose) {
  
    return pose.pose.rightWrist;
  }

 
  
function getPartnerLeftWrist(pose) {
  
    return pose.pose.leftWrist;
  }

  
  
function getPartnerRightWrist(pose) {
  
    return pose.pose.rightWrist;
  }
  

// Function to see if two points are "touching"
function touching(wrist1, wrist2) {
  // Get the distance between the two wrists
  const d = dist(wrist1.x, wrist1.y, wrist2.x, wrist2.y);

  // If the distance is less than 50 pixels we are touching!
  if (d < 10) {
    return true;
  }

  // Otherwise we are not touching!
  return false;
}


function drawFramerate() {
  fill(0);
  stroke(0);
  text(getFrameRate(), 10, 10);
}


