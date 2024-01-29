/* eslint-disable no-restricted-syntax */
import React, { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { AnalyticsData, VideoData } from "../annotator";

interface AnalyticsBarProps {
  analyticsData: AnalyticsData;
  confidenceThreshold: number;
  goToVideoTime: (frame: number) => void;
}

export interface VideoObjects {
  [objectName: string]: number | null;
}

export interface SeriesData {
  x: string;
  y: Array<number>;
  fillColor?: string;
}

interface SingleSeries {
  data: Array<SeriesData>;
}

type Series = Array<SingleSeries>;

export function frameToSeconds(frameNumber: string): number {
  return parseInt(frameNumber, 10) / 1000;
}

export function fillColourFromName(name: string): string {
  return `#${(
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 255
  )
    .toString(16)
    .padEnd(3, "0")}`;
}

function isNumber(obj: any): obj is number {
  return typeof obj === "number";
}

function optionsGenerator(
  goToVideoTime: (seconds: number) => void
): ApexCharts.ApexOptions {
  return {
    chart: {
      toolbar: {
        tools: {
          download: false,
        },
      },
      events: {
        dataPointSelection(e, chart, config) {
          goToVideoTime(
            config.w.config.series[0].data[config.dataPointIndex].y[0]
          );
        },
      },
    },
    noData: {
      text: "No objects found. Try lowering the confidence threshold.",
      verticalAlign: "middle",
      align: "center",
      style: {
        color: "white",
        fontSize: "20",
      },
    },
    tooltip: {
      custom({ series: customSeries, seriesIndex, dataPointIndex, w }) {
        return `<div style="padding: 5px;">${w.globals.seriesX[0][dataPointIndex]}: ${customSeries[0][dataPointIndex]}s</div>`;
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
      },
    },
    xaxis: {
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
}

const debounce = (
  func: () => void,
  timer: NodeJS.Timeout | null,
  setTimer: React.Dispatch<React.SetStateAction<NodeJS.Timeout | null>>
) => {
  return () => {
    if (timer) clearTimeout(timer);
    setTimer(
      setTimeout(() => {
        func();
      }, 300)
    );
  };
};

const VideoGraph = ({
  analyticsData,
  confidenceThreshold,
  goToVideoTime,
}: AnalyticsBarProps): JSX.Element => {
  if (analyticsData.type === "image") {
    return (
      <div style={{ textAlign: "center" }}>
        The video graph feature is for analysed videos only. Please select a
        video first.
      </div>
    );
  }

  const videoData: VideoData = analyticsData.data as VideoData;
  const minimumBarSeconds = 0.5;
  const intervalSize = videoData.fps * 0.2; // minimum interval size to group frames together
  const [
    debouncedConfidenceThreshold,
    setDebouncedConfidenceThreshold,
  ] = useState(confidenceThreshold);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [chartWidth, setChartWidth] = useState(window.innerWidth - 250);
  useEffect(() => {
    debounce(
      () => {
        setDebouncedConfidenceThreshold(confidenceThreshold);
      },
      debounceTimer,
      setDebounceTimer
    )();
  }, [confidenceThreshold]);

  useEffect(() => {
    const debouncedResize = debounce(
      () => {
        setChartWidth(window.innerWidth - 250);
      },
      debounceTimer,
      setDebounceTimer
    );

    window.addEventListener("resize", debouncedResize);

    return () => window.removeEventListener("resize", debouncedResize);
  });

  const [uniqueObjectCount, seriesData] = useMemo<
    [number, Array<SeriesData>]
  >(() => {
    const seriesDataIntermediate: Array<SeriesData> = [];
    const videoObjects: VideoObjects = {};
    const frameNumbers = Object.keys(videoData.frames);
    const lastFrameNumber = Number(frameNumbers[frameNumbers.length - 1]);
    let currentFrameObjects: Array<string>;
    const videoFrameData = Object.entries(videoData.frames).concat([
      [(lastFrameNumber + intervalSize).toString(), []],
    ]);

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
        const videoObject = videoObjects[videoObjectName];
        if (
          isNumber(videoObject) &&
          !currentFrameObjects.includes(videoObjectName)
        ) {
          seriesDataIntermediate.push({
            x: videoObjectName,
            y: [videoObject, frameInSeconds],
            fillColor: fillColourFromName(videoObjectName),
          });
          videoObjects[videoObjectName] = null;
        } else if (
          isNumber(videoObject) &&
          frameInSeconds - videoObject > minimumBarSeconds
        ) {
          seriesDataIntermediate.push({
            x: videoObjectName,
            y: [videoObject, frameInSeconds],
            fillColor: fillColourFromName(videoObjectName),
          });
          videoObjects[videoObjectName] = frameInSeconds;
        } else if (!isNumber(videoObject)) {
          videoObjects[videoObjectName] = frameInSeconds;
        }
      }
    }
    return [Object.keys(videoObjects).length, seriesDataIntermediate];
  }, [debouncedConfidenceThreshold]);

  const series: Series = [{ data: seriesData }];
  const options = optionsGenerator(goToVideoTime);
  if (seriesData.length === 0) {
    return (
      <div style={{ textAlign: "center" }}>
        No objects found. Try lowering the confidence threshold.
      </div>
    );
  }

  return (
    <div style={{ overflowY: "auto" }}>
      <ReactApexChart
        options={options}
        series={series}
        type="rangeBar"
        height={50 * uniqueObjectCount}
        width={chartWidth}
      />
    </div>
  );
};
export default VideoGraph;
