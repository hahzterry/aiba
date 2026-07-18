import React from "react";
import {AbsoluteFill,interpolate,useCurrentFrame} from "remotion";

export const ImpactFrame: React.FC<{color?:string}> = ({color="#ffd400"}) => {
  const frame=useCurrentFrame();
  const alpha=interpolate(frame,[0,2,7],[.92,.28,0],{extrapolateRight:"clamp"});
  const border=interpolate(frame,[0,7],[42,0],{extrapolateRight:"clamp"});
  return <AbsoluteFill style={{backgroundColor:color,opacity:alpha,border:`${border}px solid white`,mixBlendMode:"screen"}}/>;
};
