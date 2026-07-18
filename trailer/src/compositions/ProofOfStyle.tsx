import React from "react";
import {AbsoluteFill,Audio,Sequence,interpolate,staticFile,useCurrentFrame} from "remotion";
import {ImpactFrame} from "../components/ImpactFrame";
import {TypeHit} from "../components/TypeHit";
import {VideoPlate} from "../components/VideoPlate";
import {shotManifest as m} from "../data/shotManifest";

const Clip:React.FC<{src:string;label?:string;kicker?:string;color?:string;startFrom?:number}>=({src,label,kicker,color,startFrom})=>(
  <AbsoluteFill>
    <VideoPlate src={src} startFrom={startFrom}/>
    {label?<TypeHit kicker={kicker} color={color} size={96}>{label}</TypeHit>:null}
  </AbsoluteFill>
);

const ModeStrip:React.FC = () => {
  const frame=useCurrentFrame();
  const y=interpolate(frame,[0,12],[120,0],{extrapolateRight:"clamp"});
  return <div style={{position:"absolute",left:62,right:62,bottom:95,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,transform:`translateY(${y}px)`}}>
    {["投篮机","百分大战","三分大赛"].map((x,i)=><div key={x} style={{background:i===1?m.colors.yellow:"rgba(5,6,8,.84)",color:i===1?m.colors.black:m.colors.paper,border:`2px solid ${m.colors.yellow}`,padding:"18px 6px",fontSize:24,fontFamily:"Arial Black,Arial",textAlign:"center"}}>{x}</div>)}
  </div>;
};

const EndCard:React.FC = () => {
  const frame=useCurrentFrame();
  const pop=interpolate(frame,[0,12,58],[.72,1,1.03],{extrapolateRight:"clamp"});
  return <AbsoluteFill style={{background:m.colors.black,justifyContent:"center",alignItems:"center",color:m.colors.paper,fontFamily:"Arial Black,Arial",overflow:"hidden"}}>
    <div style={{position:"absolute",width:760,height:760,border:`2px solid ${m.colors.yellow}`,transform:`rotate(34deg) scale(${pop})`,boxShadow:`0 0 120px ${m.colors.red}55`}}/>
    <div style={{fontSize:42,letterSpacing:18,color:m.colors.cyan}}>CYBER COURT</div>
    <div style={{fontSize:156,lineHeight:.82,marginTop:28,transform:`scale(${pop})`,textAlign:"center"}}>aiBA<br/><span style={{color:m.colors.yellow}}>百分大战</span></div>
    <div style={{fontFamily:"Arial",fontWeight:700,fontSize:30,letterSpacing:7,marginTop:52}}>100 POINTS. ONE CROWN.</div>
    <div style={{position:"absolute",bottom:110,fontFamily:"Arial",fontSize:27,color:"#b8bdc5"}}>现在上场 / PLAY NOW</div>
  </AbsoluteFill>;
};

export const ProofOfStyle:React.FC = () => (
  <AbsoluteFill style={{backgroundColor:m.colors.black}}>
    <Audio src={staticFile(m.audio.music)} trimBefore={1560} volume={.82}/>
    <Audio src={staticFile(m.audio.crowd)} trimBefore={480} volume={.18}/>

    <Sequence from={0} durationInFrames={105}><Clip src={m.covers.k24} label="ONE SHOT" kicker="THE COURT IS CALLING" color={m.colors.yellow}/></Sequence>
    <Sequence from={98} durationInFrames={8}><ImpactFrame/></Sequence>
    <Sequence from={105} durationInFrames={54}><Clip src={m.covers.j23} startFrom={35}/></Sequence>
    <Sequence from={153} durationInFrames={8}><ImpactFrame color={m.colors.red}/></Sequence>
    <Sequence from={159} durationInFrames={51}><Clip src={m.covers.a03} label="BUILD YOUR GAME" kicker="CHOOSE YOUR LEGEND" color={m.colors.paper}/></Sequence>

    <Sequence from={210} durationInFrames={150}>
      <AbsoluteFill style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,backgroundColor:m.colors.yellow}}>
        <div style={{position:"relative",overflow:"hidden"}}><VideoPlate src={m.footage.firstPerson} zoom={1.09}/></div>
        <div style={{position:"relative",overflow:"hidden"}}><VideoPlate src={m.footage.follow} zoom={1.09}/></div>
        <div style={{position:"relative",overflow:"hidden"}}><VideoPlate src={m.footage.broadcast} zoom={1.09}/></div>
      </AbsoluteFill>
      <TypeHit kicker="THREE CAMERAS" align="center" size={80}>ONE MOMENT</TypeHit>
    </Sequence>
    <Sequence from={352} durationInFrames={8}><ImpactFrame color={m.colors.cyan}/></Sequence>

    <Sequence from={360} durationInFrames={74}><Clip src={m.footage.rain} label="OWN THE WEATHER" kicker="RAIN COURT" color={m.colors.cyan}/></Sequence>
    <Sequence from={428} durationInFrames={8}><ImpactFrame color={m.colors.paper}/></Sequence>
    <Sequence from={434} durationInFrames={74}><Clip src={m.footage.flower} label="CHANGE THE WORLD" kicker="FLOWER COURT" color={m.colors.yellow}/></Sequence>
    <Sequence from={502} durationInFrames={8}><ImpactFrame color={m.colors.red}/></Sequence>
    <Sequence from={508} durationInFrames={82}><Clip src={m.footage.bullet} label="FREEZE THE MOMENT" kicker="BULLET TIME" color={m.colors.paper}/></Sequence>

    <Sequence from={590} durationInFrames={82}><Clip src={m.footage.follow} label="RACK RUSH" kicker="BEAT THE CLOCK" color={m.colors.yellow}/></Sequence>
    <Sequence from={672} durationInFrames={74}><Clip src={m.footage.broadcast} label="PERCENT BATTLE" kicker="FIRST TO 100" color={m.colors.red}/></Sequence>
    <Sequence from={746} durationInFrames={64}><Clip src={m.footage.firstPerson} label="THREE POINT" kicker="PURE RHYTHM" color={m.colors.cyan}/><ModeStrip/></Sequence>
    <Sequence from={804} durationInFrames={8}><ImpactFrame/></Sequence>
    <Sequence from={810} durationInFrames={90}><EndCard/></Sequence>
  </AbsoluteFill>
);
