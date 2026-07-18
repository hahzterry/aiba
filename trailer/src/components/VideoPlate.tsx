import React from "react";
import {AbsoluteFill, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {Video} from "@remotion/media";

type Props = {
  src: string;
  startFrom?: number;
  zoom?: number;
  dim?: number;
  panX?: number;
  panY?: number;
};

export const VideoPlate: React.FC<Props> = ({src,startFrom=0,zoom=1.05,dim=0,panX=0,panY=0}) => {
  const frame=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  const scale=interpolate(frame,[0,durationInFrames],[zoom,zoom+0.045],{extrapolateRight:"clamp"});
  return (
    <AbsoluteFill style={{overflow:"hidden",backgroundColor:"#050608"}}>
      <Video
        src={staticFile(src)}
        trimBefore={startFrom}
        muted
        objectFit="cover"
        style={{
          width:"100%",
          height:"100%",
          transform:`translate(${panX}px, ${panY}px) scale(${scale})`
        }}
      />
      {dim>0?<AbsoluteFill style={{backgroundColor:`rgba(0,0,0,${dim})`}}/>:null}
    </AbsoluteFill>
  );
};
