/* eslint-disable no-restricted-syntax */

import { FrameData } from "../annotator";
import { SeriesData, VideoObjects } from "./videograph";

function frameToSeconds(frameNumber: string): number {
  return parseInt(frameNumber, 10) / 1000;
}

function fillColourFromName(name: string): string {
  return `#${(
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 255
  )
    .toString(16)
    .padEnd(3, "0")}`;
}

/* eslint-disable no-restricted-globals */
self.onmessage = e => {
  console.log("worker got message");
  console.log(e);

  const message = JSON.parse(e.data);
  const { videoData, confidenceThreshold } = message;

  const minimumBarSeconds = 0.5;
  const intervalSize = videoData.fps * 0.2; // minimum interval size to group frames together
  const seriesDataIntermediate: Array<SeriesData> = [];
  const videoObjects: VideoObjects = {};
  const frameNumbers = Object.keys(videoData.frames);
  const lastFrameNumber = Number(frameNumbers[frameNumbers.length - 1]);
  let currentFrameObjects: Array<string>;
  const videoFrameData: Array<[string, Array<FrameData>]> = Object.entries<any>(
    videoData.frames
  ).concat([[(lastFrameNumber + intervalSize).toString(), []]]);

  for (const [frameNumber, frameData] of videoFrameData) {
    currentFrameObjects = [];
    const frameInSeconds = frameToSeconds(frameNumber);
    for (const objectData of frameData) {
      if (
        currentFrameObjects.indexOf(objectData.tag.name) === -1 &&
        objectData.confidence >= confidenceThreshold
      ) {
        currentFrameObjects.push(objectData.tag.name);

        if (typeof videoObjects[objectData.tag.name] !== "number") {
          videoObjects[objectData.tag.name] = frameInSeconds;
        }
      }
    }

    for (const videoObjectName of Object.keys(videoObjects)) {
      if (
        typeof videoObjects[videoObjectName] === "number" &&
        !currentFrameObjects.includes(videoObjectName)
      ) {
        seriesDataIntermediate.push({
          x: videoObjectName,
          y: [videoObjects[videoObjectName], frameInSeconds],
          fillColor: fillColourFromName(videoObjectName),
        });
        videoObjects[videoObjectName] = null;
      } else if (
        typeof videoObjects[videoObjectName] === "number" &&
        frameInSeconds - (videoObjects[videoObjectName] as number) >
          minimumBarSeconds
      ) {
        seriesDataIntermediate.push({
          x: videoObjectName,
          y: [videoObjects[videoObjectName], frameInSeconds],
          fillColor: fillColourFromName(videoObjectName),
        });
        videoObjects[videoObjectName] = frameInSeconds;
      } else if (typeof videoObjects[videoObjectName] !== "number") {
        videoObjects[videoObjectName] = frameInSeconds;
      }
    }
  }
  return [Object.keys(videoObjects).length, seriesDataIntermediate];
};
