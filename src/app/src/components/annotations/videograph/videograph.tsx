import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { AnalyticsData, FrameData, VideoData } from "../annotator";

interface AnalyticsBarProps {
  analyticsData: AnalyticsData;
  confidenceThreshold: number;
  fastForward: (frame: number) => void;
}

interface ObjectFrameData extends FrameData {
  frameNumber: string;
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

  console.log("videoFramesData");
  console.log(videoFramesData);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={videoFramesData}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="frameNumber" />
        <YAxis />
        <Line key={"RBC"} dataKey={"RBC"} stroke={"#FF0000"} dot={false} />;
      </LineChart>
    </ResponsiveContainer>
  );
};
export default VideoGraph;
