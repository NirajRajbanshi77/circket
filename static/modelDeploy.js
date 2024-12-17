let video;
let poseNet;
let pose;
let skeleton;

let brain;
let poseLabel = "Y";
let confidence = 0;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelLoaded);
  poseNet.on('pose', gotPoses);

  let options = {
    inputs: 34,
    outputs: 4,
    task: 'classification',
    debug: true
  }
  brain = ml5.neuralNetwork(options);
  const modelInfo = {
    model: 'model/model(2).json',
    metadata: 'model/model_meta(2).json',
    weights: 'model/model.weights(2).bin',
  };
  brain.load(modelInfo, brainLoaded);
}

function brainLoaded() {
  console.log('pose classification ready!');
  classifyPose();
}

function classifyPose() {
  if (pose) {
    let inputs = [];
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
    }
    brain.classify(inputs, gotResult);
  } else {
    setTimeout(classifyPose, 100);
  }
}

function gotResult(error, results) {
  if (results[0].confidence > 0.75) {
    poseLabel = mapLabel(results[0].label.toUpperCase());
    confidence = results[0].confidence;
  }
  classifyPose();
}

function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}

function modelLoaded() {
  console.log('poseNet ready');
}

function draw() {
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0, video.width, video.height);

  if (pose) {
    for (let i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      strokeWeight(2);
      stroke(0);
      line(a.position.x, a.position.y, b.position.x, b.position.y);
    }
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      fill(0);
      stroke(255);
      ellipse(x, y, 16, 16);
    }
  }
  pop();

  // Draw the label and confidence box
  drawConfidenceBox(poseLabel, confidence);
}

function drawConfidenceBox(label, confidence) {
  // Map label to colors
  let colors = {
    "PRESTANCE": color(255, 100, 100),
    "STANCE": color(100, 255, 100),
    "PULL": color(100, 100, 255),
    "SWEEP": color(255, 255, 100)
  };

  // Box properties
  let rectHeight = 50; // Height of the box
  let rectWidth = map(confidence, 0, 1, 50, width - 100); // Width grows with confidence
  let rectX = width / 2 - rectWidth / 2;
  let rectY = height - 100; // Position of the rectangle at bottom

  // Set color
  let rectColor = colors[label] || color(200); // Default to gray if label not found
  fill(rectColor);
  noStroke();

  // Draw rectangle
  rect(rectX, rectY, rectWidth, rectHeight);

  // Draw label text
  fill(0);
  textSize(20);
  textAlign(CENTER, CENTER);
  text(`${label} (${(confidence * 100).toFixed(1)}%)`, width / 2, rectY + rectHeight / 2);
}

// Map labels to cricket shot names
function mapLabel(label) {
  const labels = {
    "Z": "PRESTANCE",
    "X": "STANCE",
    "C": "PULL",
    "V": "SWEEP"
  };
  return labels[label] || "UNKNOWN";
}
