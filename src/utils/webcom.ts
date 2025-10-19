export { loadHandLandmarker, drawHands, hasGetUserMedia, stopStreamedVideo, warmUpHandLandmarker, fitSizeCanvas };

import { HandLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';
// 描画スタイル
const connectorsColor = '#00FF00';
const connectorsWidth = 5;
const pointsColor = '#FF0000';
const pointsWidth = 2;

/**
 * HandLandmarker を読み込むヘルパー
 * @param {('IMAGE'|'VIDEO')} runningMode
 * @returns {Promise<import('@mediapipe/tasks-vision').HandLandmarker>}
 */
async function loadHandLandmarker(runningMode: 'IMAGE' | 'VIDEO' = 'IMAGE') {
  // CDNのWASMパスを使うと、ローカルでwasm配置を気にせず動きます。
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
  );

  const handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
      // modelAssetPath: '/handsign-meter/models/hand_landmarker.task', // ローカルに置く場合（モデルはgoogleからダウンロードしてください。）
    },
    runningMode,
    numHands: 1, // 片手のみ検出
  });
  return handLandmarker;
}

/**
 * 手のランドマークを描画
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<Array<{x:number,y:number,z:number}>>} landmarksArray
 */
const drawHands = (ctx: CanvasRenderingContext2D, landmarksArray: Array<Array<NormalizedLandmark>>) => {
  if (!landmarksArray?.length) return;
  const utils = new DrawingUtils(ctx);

  for (const landmarks of landmarksArray) {
    utils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
      color: connectorsColor,
      lineWidth: connectorsWidth,
    });
    utils.drawLandmarks(landmarks, {
      color: pointsColor,
      lineWidth: pointsWidth,
    });
  }
};

/** getUserMedia対応可否 */
const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

/**
 * 停止しているvideo要素のストリームを停止＆解放する
 * https://developer.mozilla.org/ja/docs/Web/API/MediaStreamTrack/stop
 * @param videoElem HTMLMediaElement
 */
const stopStreamedVideo = (videoElem: HTMLMediaElement) => {
  const stream = videoElem.srcObject as MediaStream;
  const tracks = stream?.getTracks();

  tracks?.forEach((track) => {
    track.stop();
  });

  videoElem.srcObject = null;
  // Safari/iOSの復帰不具合回避（黒画面に戻す）
  videoElem.load();
};

/**
 * 手のランドマークモデルのウォームアップ推論
 * https://developers.googleblog.com/ja/7-dos-and-donts-of-using-ml-on-the-web-with-mediapipe/
 */
const warmUpHandLandmarker = async (landmarker: HandLandmarker, canvas: HTMLCanvasElement) => {
  const width = 1;
  const height = 1;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, width, height);
  }
  landmarker.detect(canvas);
};

/**
 * canvasサイズをvideoサイズに合わせる
 * @param canvas HTMLCanvasElement
 * @param video HTMLVideoElement
 * void
 */
const fitSizeCanvas = (canvas: HTMLCanvasElement, video: HTMLVideoElement) => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.style.width = `${video.videoWidth}px`;
  canvas.style.height = `${video.videoHeight}px`;
};

/** Webカメラ用のMediaStreamを作成
 * @returns {Promise<MediaStream>}
 */
export async function createMediaStream(): Promise<MediaStream> {
  const mediaStream = navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user', // フロントカメラを指定
      width: { min: 360, ideal: 640, max: 640 },
      height: { min: 240, ideal: 480, max: 480 },
      // https://developer.mozilla.org/ja/docs/Web/API/MediaDevices/getUserMedia
      frameRate: { ideal: 20, max: 30 }, // FPSを抑えて負荷軽減
    },
    audio: false,
  });
  return mediaStream;
}
