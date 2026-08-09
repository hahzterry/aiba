import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import {ImpactFrame} from "../components/ImpactFrame";
import {TypeHit} from "../components/TypeHit";
import {VideoPlate} from "../components/VideoPlate";
import {shotManifest as m} from "../data/shotManifest";

const font="Orbitron, Arial Black, Arial, sans-serif";

type ClipProps={src:string;label?:string;kicker?:string;color?:string;startFrom?:number;zoom?:number;dim?:number;panX?:number;panY?:number};

const Clip:React.FC<ClipProps>=({src,label,kicker,color,startFrom,zoom,dim,panX,panY})=><AbsoluteFill>
  <VideoPlate src={src} startFrom={startFrom} zoom={zoom} dim={dim} panX={panX} panY={panY}/>
  {label?<TypeHit kicker={kicker} color={color} size={92}>{label}</TypeHit>:null}
</AbsoluteFill>;

const EditorialLabel:React.FC<{index:string;title:string;side?:"left"|"right";color?:string}>=({index,title,side="left",color=m.colors.yellow})=>{
  const frame=useCurrentFrame();
  const x=interpolate(frame,[0,16],[side==="left"?-130:130,0],{extrapolateRight:"clamp"});
  const opacity=interpolate(frame,[0,8,65,76],[0,1,1,0],{extrapolateRight:"clamp"});
  return <div style={{position:"absolute",top:98,[side]:54,color:m.colors.paper,fontFamily:font,textAlign:side,transform:`translateX(${x}px)`,opacity,textShadow:"0 5px 18px #000"}}>
    <div style={{fontSize:20,letterSpacing:7,color}}>{index}</div>
    <div style={{fontSize:30,fontWeight:900,marginTop:8}}>{title}</div>
  </div>;
};

const FlashCut:React.FC<{color?:string}>=({color=m.colors.yellow})=>{
  const frame=useCurrentFrame();
  const amount=interpolate(frame,[0,1,5,9],[0,1,.18,0],{extrapolateRight:"clamp"});
  return <AbsoluteFill style={{background:color,opacity:amount,mixBlendMode:"screen"}}/>;
};

const Opening:React.FC=()=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const enter=spring({frame:frame-12,fps,config:{damping:13,stiffness:180,mass:.55}});
  const split=interpolate(frame,[44,90],[0,1],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  return <AbsoluteFill style={{background:m.colors.black,color:m.colors.paper,justifyContent:"center",alignItems:"center",fontFamily:font,overflow:"hidden"}}>
    <div style={{position:"absolute",inset:64,border:`2px solid ${m.colors.yellow}`,transform:`scaleY(${.08+.92*split})`,opacity:.65}}/>
    <div style={{fontSize:22,letterSpacing:12,color:m.colors.cyan,opacity:enter}}>CYBER COURT PRESENTS</div>
    <div style={{fontSize:112,lineHeight:.88,textAlign:"center",fontWeight:950,marginTop:24,transform:`scale(${.82+.18*enter})`,opacity:enter}}>THE COURT<br/><span style={{color:m.colors.yellow}}>IS CALLING</span></div>
    <div style={{width:interpolate(frame,[60,110],[0,720],{extrapolateRight:"clamp"}),height:8,background:m.colors.red,marginTop:42}}/>
  </AbsoluteFill>;
};

const HeroRoster:React.FC=()=>{
  const frame=useCurrentFrame();
  const cards=[m.covers.k24,m.covers.j23,m.covers.a03];
  return <AbsoluteFill style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,background:m.colors.yellow}}>
    {cards.map((src,i)=><div key={src} style={{position:"relative",overflow:"hidden",transform:`translateY(${interpolate(frame,[0,28],[i%2?120:-120,0],{extrapolateRight:"clamp"})}px)`}}><VideoPlate src={src} startFrom={38+i*16} zoom={1.14}/></div>)}
    <div style={{position:"absolute",left:46,right:46,bottom:114,color:m.colors.paper,fontFamily:font,textAlign:"center",textShadow:"0 8px 25px #000"}}>
      <div style={{fontSize:24,letterSpacing:8,color:m.colors.yellow}}>CHOOSE YOUR LEGEND</div>
      <div style={{fontSize:74,fontWeight:950,marginTop:14}}>MAKE IT YOURS</div>
    </div>
  </AbsoluteFill>;
};

const ThreeView:React.FC=()=>{
  const frame=useCurrentFrame();
  const widths=[.94,1,.94].map((s,i)=>s+Math.sin((frame+i*18)/22)*.015);
  return <AbsoluteFill style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,background:m.colors.cyan}}>
    {[m.footage.firstPerson,m.footage.follow,m.footage.broadcast].map((src,i)=><div key={src} style={{position:"relative",overflow:"hidden",transform:`scale(${widths[i]})`}}><VideoPlate src={src} startFrom={78+i*22} zoom={1.16}/></div>)}
    <TypeHit kicker="FIRST PERSON / FOLLOW / BROADCAST" align="center" size={76}>THREE WAYS<br/>TO FEEL IT</TypeHit>
  </AbsoluteFill>;
};

const ModeGrid:React.FC=()=>{
  const frame=useCurrentFrame();
  const modes=[
    ["RACK RUSH","BEAT THE CLOCK",m.footage.rackBurst,m.colors.yellow],
    ["PERCENT BATTLE","FIRST TO 100",m.footage.halfcourt,m.colors.red],
    ["3PT CONTEST","PURE RHYTHM",m.footage.moneyball,m.colors.cyan]
  ] as const;
  return <AbsoluteFill style={{background:m.colors.black,padding:"90px 42px",display:"grid",gridTemplateRows:"1fr 1fr 1fr",gap:12}}>
    {modes.map(([title,sub,src,color],i)=>{
      const x=interpolate(frame,[i*9,i*9+18],[i%2?-130:130,0],{extrapolateRight:"clamp"});
      return <div key={title} style={{position:"relative",overflow:"hidden",borderLeft:`7px solid ${color}`,transform:`translateX(${x}px)`}}>
        <VideoPlate src={src} startFrom={84+i*25} zoom={1.2} dim={.28}/>
        <div style={{position:"absolute",left:34,bottom:28,color:m.colors.paper,fontFamily:font,textShadow:"0 5px 15px #000"}}><div style={{fontSize:20,letterSpacing:5,color}}>{sub}</div><div style={{fontSize:48,fontWeight:950,marginTop:5}}>{title}</div></div>
      </div>;
    })}
  </AbsoluteFill>;
};

const CourtTriptych:React.FC=()=>{
  const frame=useCurrentFrame();
  const segment=Math.min(2,Math.floor(frame/82));
  const sources=[m.footage.rain,m.footage.flower,m.footage.sunset];
  const labels=[["RAIN COURT","OWN THE WEATHER"],["FLOWER COURT","CHANGE THE WORLD"],["SUNSET COURT","CHASE THE LIGHT"]];
  return <AbsoluteFill>
    <VideoPlate src={sources[segment]} startFrom={(frame%82)+55} zoom={1.08}/>
    <div style={{position:"absolute",left:58,right:58,top:95,display:"flex",gap:10}}>{sources.map((_,i)=><div key={i} style={{height:7,flex:1,background:i===segment?m.colors.yellow:"rgba(255,255,255,.3)"}}/>)}</div>
    <TypeHit kicker={labels[segment][0]} color={segment===0?m.colors.cyan:segment===1?m.colors.yellow:m.colors.paper} size={80}>{labels[segment][1]}</TypeHit>
  </AbsoluteFill>;
};

const EndCard:React.FC=()=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const pop=spring({frame,fps,config:{damping:12,stiffness:150,mass:.6}});
  const spin=interpolate(frame,[0,180],[24,38],{extrapolateRight:"clamp"});
  return <AbsoluteFill style={{background:m.colors.black,color:m.colors.paper,justifyContent:"center",alignItems:"center",fontFamily:font,overflow:"hidden"}}>
    <div style={{position:"absolute",width:770,height:770,border:`2px solid ${m.colors.yellow}`,transform:`rotate(${spin}deg) scale(${.7+.3*pop})`,boxShadow:`0 0 130px ${m.colors.red}66`}}/>
    <div style={{fontSize:23,letterSpacing:14,color:m.colors.cyan}}>CYBER COURT</div>
    <div style={{fontSize:164,lineHeight:.8,marginTop:30,transform:`scale(${.82+.18*pop})`,textAlign:"center",fontWeight:950}}>3BALL<br/><span style={{color:m.colors.yellow}}>.fun</span></div>
    <div style={{fontSize:28,letterSpacing:6,marginTop:62}}>100 POINTS. ONE CROWN.</div>
    <div style={{position:"absolute",bottom:116,border:`2px solid ${m.colors.yellow}`,padding:"20px 52px",fontSize:26}}>PLAY NOW</div>
  </AbsoluteFill>;
};

const AudioBed:React.FC=()=>{
  const frame=useCurrentFrame();
  const musicVolume=interpolate(frame,[0,110,3050,3150,3260,3420,3599],[.12,.82,.82,.12,.12,.95,.6],{extrapolateLeft:"clamp",extrapolateRight:"clamp"});
  const crowdVolume=interpolate(frame,[0,900,2500,3050,3240,3500],[.03,.12,.2,.05,.65,.26],{extrapolateRight:"clamp"});
  return <>
    <Audio src={staticFile(m.audio.music)} trimBefore={1180} volume={musicVolume}/>
    <Audio src={staticFile(m.audio.crowd)} trimBefore={240} volume={crowdVolume}/>
    <Sequence from={3330}><Audio src={staticFile(m.audio.cheer)} volume={.66}/></Sequence>
    <Sequence from={1430}><Audio src={staticFile(m.audio.swish)} volume={.7}/></Sequence>
    <Sequence from={2078}><Audio src={staticFile(m.audio.swish)} volume={.82}/></Sequence>
    <Sequence from={2630}><Audio src={staticFile(m.audio.clank)} volume={.72}/></Sequence>
    <Sequence from={3090}><Audio src={staticFile(m.audio.finalShot)} volume={.78}/></Sequence>
    <Sequence from={3375}><Audio src={staticFile(m.audio.swish)} volume={1}/></Sequence>
  </>;
};

export const LaunchFilm:React.FC=()=> <AbsoluteFill style={{background:m.colors.black}}>
  <AudioBed/>
  <Sequence from={0} durationInFrames={120}><Opening/></Sequence>
  <Sequence from={120} durationInFrames={210}><Clip src={m.footage.chalk} startFrom={25}/><EditorialLabel index="K-24" title="ENTER THE ARENA"/></Sequence>
  <Sequence from={324} durationInFrames={8}><FlashCut/></Sequence>
  <Sequence from={330} durationInFrames={180}><Clip src={m.footage.greet} startFrom={46}/><EditorialLabel index="J-23" title="OWN THE MOMENT" side="right" color={m.colors.cyan}/></Sequence>
  <Sequence from={504} durationInFrames={8}><FlashCut color={m.colors.red}/></Sequence>
  <Sequence from={510} durationInFrames={180}><HeroRoster/></Sequence>
  <Sequence from={684} durationInFrames={8}><ImpactFrame color={m.colors.paper}/></Sequence>
  <Sequence from={690} durationInFrames={150}><Clip src={m.footage.stretch} startFrom={35} label="LOCK IN" kicker="WARM UP" color={m.colors.paper}/></Sequence>
  <Sequence from={834} durationInFrames={8}><FlashCut/></Sequence>
  <Sequence from={840} durationInFrames={180}><Clip src={m.footage.dunk} startFrom={42} label="RISE ABOVE" kicker="NO GRAVITY" color={m.colors.yellow}/></Sequence>
  <Sequence from={1014} durationInFrames={8}><ImpactFrame color={m.colors.red}/></Sequence>
  <Sequence from={1020} durationInFrames={180}><Clip src={m.footage.firstPerson} startFrom={70} label="YOU ARE THE SHOOTER" kicker="FIRST PERSON" color={m.colors.paper}/></Sequence>
  <Sequence from={1194} durationInFrames={8}><FlashCut color={m.colors.cyan}/></Sequence>
  <Sequence from={1200} durationInFrames={180}><Clip src={m.footage.follow} startFrom={78} label="CHASE THE ARC" kicker="BALL FOLLOW" color={m.colors.cyan}/></Sequence>
  <Sequence from={1374} durationInFrames={8}><FlashCut/></Sequence>
  <Sequence from={1380} durationInFrames={180}><Clip src={m.footage.broadcast} startFrom={65} label="FEEL THE BROADCAST" kicker="COURTSIDE" color={m.colors.yellow}/></Sequence>
  <Sequence from={1560} durationInFrames={180}><ThreeView/></Sequence>
  <Sequence from={1734} durationInFrames={8}><ImpactFrame color={m.colors.cyan}/></Sequence>
  <Sequence from={1740} durationInFrames={300}><ModeGrid/></Sequence>
  <Sequence from={2040} durationInFrames={240}><Clip src={m.footage.rackBurst} startFrom={210} label="BEAT THE CLOCK" kicker="RACK RUSH" color={m.colors.yellow}/></Sequence>
  <Sequence from={2274} durationInFrames={8}><ImpactFrame/></Sequence>
  <Sequence from={2280} durationInFrames={240}><Clip src={m.footage.moneyball} startFrom={72} label="MAKE IT COUNT" kicker="MONEY BALL" color={m.colors.red}/></Sequence>
  <Sequence from={2514} durationInFrames={8}><FlashCut color={m.colors.red}/></Sequence>
  <Sequence from={2520} durationInFrames={300}><Clip src={m.footage.halfcourt} startFrom={105} label="TEN POINTS" kicker="HALF COURT" color={m.colors.paper}/></Sequence>
  <Sequence from={2814} durationInFrames={8}><ImpactFrame color={m.colors.paper}/></Sequence>
  <Sequence from={2820} durationInFrames={246}><CourtTriptych/></Sequence>
  <Sequence from={3060} durationInFrames={180}><Clip src={m.footage.halfcourt} startFrom={185} zoom={1.12} dim={.08} label="ONE LAST SHOT" kicker="SILENCE THE NOISE" color={m.colors.paper}/></Sequence>
  <Sequence from={3234} durationInFrames={10}><ImpactFrame/></Sequence>
  <Sequence from={3240} durationInFrames={180}><Clip src={m.footage.celebrate} startFrom={36} label="MAKE THEM REMEMBER" kicker="THE MOMENT IS YOURS" color={m.colors.yellow}/></Sequence>
  <Sequence from={3414} durationInFrames={8}><FlashCut color={m.colors.paper}/></Sequence>
  <Sequence from={3420} durationInFrames={180}><EndCard/></Sequence>
</AbsoluteFill>;
