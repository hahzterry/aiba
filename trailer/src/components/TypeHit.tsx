import React from "react";
import {interpolate,spring,useCurrentFrame,useVideoConfig} from "remotion";

type Props = {
  kicker?: string;
  children: React.ReactNode;
  align?: "left"|"center";
  color?: string;
  size?: number;
};

export const TypeHit: React.FC<Props> = ({kicker,children,align="left",color="#f3f0e7",size=128}) => {
  const frame=useCurrentFrame();
  const {fps,durationInFrames}=useVideoConfig();
  const enter=spring({frame,fps,config:{damping:15,mass:.5,stiffness:180}});
  const exit=interpolate(frame,[durationInFrames-10,durationInFrames],[1,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return (
    <div style={{
      position:"absolute",left:72,right:72,bottom:150,textAlign:align,
      opacity:enter*exit,transform:`translateY(${(1-enter)*80}px) skewY(-3deg)`,
      color,fontFamily:"Arial Black, Arial, sans-serif",textTransform:"uppercase",
      filter:"drop-shadow(0 12px 22px rgba(0,0,0,.8))"
    }}>
      {kicker?<div style={{fontSize:25,letterSpacing:8,color:"#ffd400",marginBottom:14}}>{kicker}</div>:null}
      <div style={{fontSize:size,lineHeight:.86,fontWeight:950,letterSpacing:0}}>{children}</div>
    </div>
  );
};
