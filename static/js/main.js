const video = document.getElementById("video");
const captureButton = document.getElementById("capture");
const resultDiv = document.getElementById("result");
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (error) {
    console.error("Error accessing camera:", error);
    resultDiv.innerHTML = "Error accessing camera. Please grant permission.";
  }
}
captureButton.addEventListener("click", async () => {
  resultDiv.innerHTML = "Looking at you right now ...";
  const stream = video.srcObject;
  const mediaRecorder = new MediaRecorder(stream);
  const chunks = [];
  mediaRecorder.ondataavailable = (event) => {
    chunks.push(event.data);
  };
  mediaRecorder.onstop = async () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", blob, "video.webm");
    try {
      const response = await fetch("/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.error) {
        resultDiv.innerHTML = `Error: ${data.error}`;
      } else {
        const formattedMessage = data.message
          .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
          .replace(/\n/g, "<br>");
        resultDiv.innerHTML = `<p>${formattedMessage}</p>`;
      }
    } catch (error) {
      console.error("Error analyzing video:", error);
      resultDiv.innerHTML = "Error analyzing video.";
    }
  };
  mediaRecorder.start();
  setTimeout(() => {
    mediaRecorder.stop();
    resultDiv.innerHTML = "Analysing...";
  }, 4000);
});
initCamera();
