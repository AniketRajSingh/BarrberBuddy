// 1. TODO - Load the model, which will be a face landmark detection model.
// 2. TODO - Access user's webcam and start video stream.
// 3. TODO - Create a canvas to draw video frames onto.
// 4. TODO - Detect face landmarks.
// 5. TODO - Determine face shape from landmarks.
// 6. TODO - Display the detected face shape.

async function main() {
  // get video element
  const video = document.getElementById("video");
  let videoStream;
  // request webcam access and start video stream
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    video.srcObject = videoStream;
  } catch (err) {
    console.error("Error accessing webcam.", err);
  }

  // load the face landmarks detection model
  const model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
  );

  // create a canvas to draw video frames onto
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const allPointsCanvas = document.getElementById("all_points_canvas");
  const allPointsCtx = allPointsCanvas.getContext("2d");

  async function detectLandmarks() {
    // make sure the model is loaded
    if (model) {
      // detect the landmarks
      const predictions = await model.estimateFaces({
        input: video,
      });

      // draw the video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      allPointsCtx.drawImage(video, 0, 0, allPointsCanvas.width, allPointsCanvas.height);

      // if there are any predictions, draw the landmarks
      if (predictions.length > 0) {
        // console.log('Predictions:', predictions);
        for (let i = 0; i < predictions.length; i++) {
                    const keypoints = predictions[i].scaledMesh;

          // TODO: determine face shape from landmarks
                    const faceShape = getFaceShape(keypoints);
          // console.log('Face Shape:', faceShape);
          document.getElementById("face-shape").textContent = faceShape;


          // draw the landmarks
          drawFaceShapeLines(ctx, keypoints);

          // draw all points on the second canvas
          for (let j = 0; j < keypoints.length; j++) {
            const [x, y, z] = keypoints[j];
            allPointsCtx.fillStyle = "aqua";
            allPointsCtx.font = "5px Arial";
            allPointsCtx.fillText(j, x, y);
          }
        }
      }
    }
    // call this function again on the next frame
    requestAnimationFrame(detectLandmarks);
  }
  // call the function to start detecting landmarks
  detectLandmarks();
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

function getCurveLength(points) {
    let length = 0;
    for (let i = 0; i < points.length - 1; i++) {
        length += distance(points[i], points[i+1]);
    }
    return length;
}

function getFaceShape(landmarks) {
  const foreheadPoints = [landmarks[54], landmarks[151], landmarks[284]];
  const cheekbonePoints = [landmarks[454], landmarks[4], landmarks[234]];
  const jawlinePoints = [landmarks[172], landmarks[152], landmarks[397]];
  const faceLengthPoints = [landmarks[10], landmarks[4] , landmarks[152]];

  const foreheadWidth = getCurveLength(foreheadPoints);
  const cheekboneWidth = getCurveLength(cheekbonePoints);
  const jawlineWidth = getCurveLength(jawlinePoints);
  const faceLength = getCurveLength(faceLengthPoints);

  const measurements = {
    forehead: foreheadWidth,
    cheekbones: cheekboneWidth,
    jawline: jawlineWidth,
  };

  const sortedWidths = Object.entries(measurements).sort((a, b) => b[1] - a[1]);
  const widestPart = sortedWidths[0][0];

  if (Math.abs(cheekboneWidth - jawlineWidth) < 15 && Math.abs(cheekboneWidth - foreheadWidth) < 15) {
    if (faceLength / cheekboneWidth > 1.5) {
      return "Oblong";
    } else {
      return "Square";
    }
  } else if (widestPart === "cheekbones") {
    if (faceLength / cheekboneWidth > 1.5) {
      return "Oval";
    } else {
      return "Round";
    }
  } else if (widestPart === "forehead") {
    if (jawlineWidth < foreheadWidth * 0.85) {
      return "Heart";
    } else {
      return "Triangle";
    }
  } else if (widestPart === "jawline") {
    return "Pear";
  } else {
    return "Undetermined";
  }
}

function drawLine(ctx, p1, p2, color) {
  ctx.beginPath();
  ctx.moveTo(p1[0], p1[1]);
  ctx.lineTo(p2[0], p2[1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawFaceShapeLines(ctx, landmarks) {
  const faceOval = [
    10,  338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58,  132, 93,  234, 127, 162, 21,  54,  103, 67,  109
  ];

  const faceOvalPoints = faceOval.map(i => landmarks[i]);
  drawCurve(ctx, faceOvalPoints, "white", true);

  // Forehead
  const foreheadPoints = [landmarks[54], landmarks[151], landmarks[284]];
  drawCurve(ctx, foreheadPoints, "red", false);

  // Cheekbones
  const cheekbonePoints = [landmarks[454], landmarks[4], landmarks[234]];
  drawCurve(ctx, cheekbonePoints, "blue", false);

  // Jawline
  const jawlinePoints = [landmarks[172], landmarks[152], landmarks[397]];
  drawCurve(ctx, jawlinePoints, "green", false);

  // Face Length
  const faceLengthPoints = [landmarks[10], landmarks[4] , landmarks[152]];
  drawCurve(ctx, faceLengthPoints , "yellow", false);
}

function drawCurve(ctx, points, color, closed) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    let i;
    for (i = 1; i < points.length - 2; i++) {
        const xc = (points[i][0] + points[i + 1][0]) / 2;
        const yc = (points[i][1] + points[i + 1][1]) / 2;
        ctx.quadraticCurveTo(points[i][0], points[i][1], xc, yc);
    }
    // For the last 2 points
    if (points.length > 1) {
        ctx.quadraticCurveTo(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }

    if (closed) {
        // connect back to the start
        ctx.lineTo(points[0][0], points[0][1]);
        ctx.closePath();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

// make sure the DOM is loaded before running the main function
window.addEventListener("DOMContentLoaded", () => {
  main();
});
