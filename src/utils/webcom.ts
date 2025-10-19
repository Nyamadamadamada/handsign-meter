export { loadHandLandmarker, drawHands, hasGetUserMedia, stopStreamedVideo };

import { HandLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { HAND_CONNECTIONS } from '@mediapipe/hands';
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
      modelAssetPath: '/handsign-meter/models/hand_landmarker.task',
      //   delegate: 'CPU',
    },
    runningMode,
    numHands: 2,
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
