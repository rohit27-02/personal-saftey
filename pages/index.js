import { useEffect, useRef } from "react";
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import Head from "next/head";

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  let stream = null;
  const drawBoundingBoxes = (predictions) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
      context.beginPath();
      context.rect(x, y, width, height);
      context.lineWidth = 2;
      context.strokeStyle = 'red';
      context.fillStyle = 'red';
      context.stroke();
      context.fillText('Helmet', x, y > 10 ? y - 5 : 10);
    });
  };

  const runObjectDetection = async () => {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if ('srcObject' in video) {
      video.srcObject = stream;
    } else {
      video.src = window.URL.createObjectURL(stream);
    }

    // Load the COCO-SSD model
    const model = await cocoSsd.load();

    const detectHelmets = async () => {
      const predictions = await model.detect(video);
      drawBoundingBoxes(predictions);
    };

    // setInterval(detectHelmets, 1000);

    // Detect objects in real-time
    setInterval(async () => {
      // Capture video frame
      context.drawImage(video, 0, 0, 640, 480);

      // Run object detection on the video frame
      const predictions = await model.detect(canvas);

      // Display bounding boxes and labels
      predictions.forEach((prediction) => {
        const [x, y, width, height] = prediction.bbox;
        context.beginPath();
        context.rect(x, y, width, height);
        context.lineWidth = 2;
        context.strokeStyle = 'red';
        context.fillStyle = 'red';
        context.stroke();
        context.fillText(
          `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
          x,
          y > 10 ? y - 5 : 10
        );
      });
    }, 1000 / 30); // Run at 30 fps
  };
  const stopCapture = () => {
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };


  return (
    <div className="bg-black h-[100vh] text-white">
      <h1 className="text-4xl text-center py-4">Safety Equipment Detection System</h1>
      <div className="flex  justify-evenly my-5 w-full">
        <video className="border-2 border-white" ref={videoRef} width={640} height={480} autoPlay muted />
        <canvas className="border-2 border-white " ref={canvasRef} width={640} height={480} />
      </div>
      <div className="mx-auto flex my-5 justify-center gap-12">
        <button className="px-6 py-3 bg-green-400 border" onClick={() => runObjectDetection()}>Start</button>
        <button className="px-6 py-3 bg-red-400 border" onClick={() => stopCapture()}>Stop</button>
      </div>
    </div>
  )

}
