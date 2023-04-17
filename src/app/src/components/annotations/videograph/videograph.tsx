/* eslint-disable no-restricted-syntax */
import React from "react";
import ReactApexChart from "react-apexcharts";
import { AnalyticsData, FrameData, VideoData } from "../annotator";

interface AnalyticsBarProps {
  analyticsData: AnalyticsData;
  confidenceThreshold: number;
  fastForward: (frame: number) => void;
}

interface VideoObjects {
  [objectName: string]: number | null;
}

interface SeriesData {
  x: string;
  y: Array<any>;
}

interface SingleSeries {
  data: Array<SeriesData>;
}

type Series = Array<SingleSeries>;

interface ObjectFrameData extends FrameData {
  frameNumber: string;
}

function timestampToSeconds(timestamp: string): number {
  return parseInt(timestamp, 10) / 10000;
}

const VideoGraph = ({
  analyticsData,
  confidenceThreshold,
  fastForward,
}: AnalyticsBarProps): JSX.Element => {
  console.log("analyticsData");
  console.log(analyticsData);

  const videoData: VideoData = analyticsData.data as VideoData;
  const videoFramesData: Array<ObjectFrameData> = Object.entries(
    videoData.frames
  ).flatMap(([frameNumber, data]) =>
    data.map(frameData => ({ ...frameData, frameNumber }))
  );

  /** Loop over each frame array. Since the number of unique objects is likely to be small,
      we just need the unique list of unique objects at that point in time.
      Also, check if the unique object is in the time object and add it to the time object with a value of null if it is not present.
      The time object keeps track of the time that an object was started being seen.
      Then, check the time object. For every key in the time object, if the value is null and the object is in the current frame,
      set the value to the current frame number to indicate that the object was started to be seen here.
      If the value is non null and the object is not in the current frame,
      set the value to null and add the time data to the final result data array.
   */

  const seriesData: Array<SeriesData> = [];
  const videoObjects: VideoObjects = {};
  let currentFrameObjects: Array<string>;
  const frameNumbers = Object.keys(videoData.frames);
  const lastFrameNumber = frameNumbers[frameNumbers.length - 1];
  // console.log(
  //   "new array",
  //   Object.entries(videoData.frames).concat([[lastFrameNumber + 1, []]])
  // );
  // const tempDebugObj = [Object.entries(videoData.frames)[0]];
  for (const [frameNumber, frameData] of Object.entries(
    videoData.frames
  ).concat([[lastFrameNumber + 1, []]])) {
    currentFrameObjects = [];
    // console.log("frameData", frameData);
    for (const objectData of frameData) {
      if (
        currentFrameObjects.indexOf(objectData.tag.name) === -1 &&
        objectData.confidence >= confidenceThreshold
      ) {
        currentFrameObjects.push(objectData.tag.name);

        if (typeof videoObjects[objectData.tag.name] !== "number") {
          videoObjects[objectData.tag.name] = timestampToSeconds(frameNumber);
        }
      }
    }
    // console.log("Frame", frameNumber, ":", currentFrameObjects);
    // console.log("videoObjects", videoObjects);

    // Check each object in videoObjects, if they are not in currentFrameObjects, push to data array
    for (const videoObjectName of Object.keys(videoObjects)) {
      // console.log(
      //   "typeof videoObjects[videoObjectName]",
      //   typeof videoObjects[videoObjectName]
      // );
      // console.log(
      //   currentFrameObjects,
      //   ".includes",
      //   videoObjectName,
      //   ":",
      //   currentFrameObjects.includes(videoObjectName)
      // );
      if (
        typeof videoObjects[videoObjectName] === "number" &&
        !currentFrameObjects.includes(videoObjectName)
      ) {
        seriesData.push({
          x: videoObjectName,
          y: [videoObjects[videoObjectName], timestampToSeconds(frameNumber)],
        });
        videoObjects[videoObjectName] = null;
      } else if (typeof videoObjects[videoObjectName] !== "number") {
        // console.log(
        //   "Setting",
        //   videoObjectName,
        //   "to",
        //   timestampToSeconds(frameNumber)
        // );
        videoObjects[videoObjectName] = timestampToSeconds(frameNumber);
      }
    }

    // console.log("videoObjects", videoObjects);
  }

  // Each frame is an array of objects. Transform each object into an {x: obj.tag.name, y: timestampToSeconds(frameNumber)} object.
  // Then push all those objects onto the data array
  // const seriesData = Object.entries(videoData.frames).flatMap(
  //   ([frameNumber, data]) =>
  //     data.map(frameData => ({
  //       x: frameData.tag.name,
  //       y: timestampToSeconds(frameNumber),
  //     }))
  // );
  console.log("seriesData");
  console.log(seriesData);

  const series: Series = [{ data: seriesData }];
  // const series: ApexAxisChartSeries = [
  //   {
  //     data: [
  //       {
  //         x: "Code",
  //         y: [
  //           new Date("2019-03-02").getTime(),
  //           new Date("2019-03-04").getTime(),
  //         ],
  //       },
  //       {
  //         x: "Code",
  //         y: [
  //           new Date("2019-03-06").getTime(),
  //           new Date("2019-03-09").getTime(),
  //         ],
  //       },
  //       {
  //         x: "Test",
  //         y: [
  //           new Date("2019-03-04").getTime(),
  //           new Date("2019-03-08").getTime(),
  //         ],
  //       },
  //       {
  //         x: "Validation",
  //         y: [
  //           new Date("2019-03-08").getTime(),
  //           new Date("2019-03-12").getTime(),
  //         ],
  //       },
  //       {
  //         x: "Deployment",
  //         y: [
  //           new Date("2019-03-12").getTime(),
  //           new Date("2019-03-18").getTime(),
  //         ],
  //       },
  //     ],
  //   },
  // ];

  const options: ApexCharts.ApexOptions = {
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    xaxis: {
      // type: "datetime",
      labels: {
        style: {
          colors: "white",
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "white",
        },
      },
    },
  };

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="rangeBar"
      height={120}
      width={"275%"}
    />
  );
};
export default VideoGraph;
