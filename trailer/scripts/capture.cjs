"use strict";

const fs=require("node:fs");
const http=require("node:http");
const os=require("node:os");
const path=require("node:path");
const {spawnSync}=require("node:child_process");
const {chromium}=require("playwright-core");

const trailerRoot=path.resolve(__dirname,"..");
const gameRoot=path.resolve(trailerRoot,"..");
const outputRoot=path.join(trailerRoot,"public","footage");
const chromePath="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port=4181;
const MOBILE={width:430,height:932,renderScale:2.5};

const allShots=[
  {name:"chalk-k24",type:"action",scene:"indoor",player:"k24",action:"chalk",track:"push",durationMs:3800,side:-1},
  {name:"greet-j23",type:"action",scene:"indoor",player:"j23",action:"wave",track:"pan",durationMs:3400,side:1},
  {name:"stretch-t01",type:"action",scene:"outdoorSunny",player:"t01",action:"stretch",track:"pull",durationMs:3200,side:-1},
  {name:"dunk-v15",type:"action",scene:"indoor",player:"v15",action:"dunk",track:"low",durationMs:4000,side:1},
  {name:"taunt-a03",type:"action",scene:"indoor",player:"a03",action:"finger",track:"orbit",durationMs:3200,side:-1},
  {name:"celebrate-k24",type:"action",scene:"indoor",player:"k24",action:"pump",track:"orbit",durationMs:3600,side:1},
  {name:"first-person",type:"shot",scene:"indoor",player:"k24",camera:0,shot:"arc"},
  {name:"follow-lowarc",type:"shot",scene:"outdoorSunny",player:"t01",camera:1,shot:"arc",track:"low",trackMs:4700},
  {name:"broadcast-clutch",type:"shot",scene:"indoor",player:"j23",camera:2,shot:"deep-left",track:"push",trackMs:4800},
  {name:"rack-burst",type:"burst",scene:"indoor",player:"a03",camera:1,shot:"arc",track:"pan",count:3,feedMs:560,trackMs:7200},
  {name:"moneyball",type:"shot",scene:"indoor",player:"v15",camera:2,shot:"money",track:"pull",trackMs:4800},
  {name:"halfcourt-bullet",type:"shot",scene:"indoor",player:"k24",camera:1,shot:"super",bullet:true,bulletMs:1250,tailMs:3000},
  {name:"rain-follow",type:"shot",scene:"rainyCourt",player:"t01",camera:1,shot:"deep-right",track:"overhead",trackMs:4900},
  {name:"flower-broadcast",type:"shot",scene:"flowerCourt",progress:.94,player:"v15",camera:2,shot:"money",track:"orbit",trackMs:4800},
  {name:"sunset-follow",type:"shot",scene:"beachSunset",progress:.58,player:"k24",camera:1,shot:"deep-left",track:"pull",trackMs:5000}
];
const requested=process.argv[2];
const shots=requested?allShots.filter(shot=>shot.name===requested):allShots;
if(!shots.length)throw new Error(`Unknown shot: ${requested}`);

const mime={
  ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8", ".json":"application/json", ".png":"image/png",
  ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".mp4":"video/mp4",
  ".mp3":"audio/mpeg", ".wav":"audio/wav", ".woff2":"font/woff2"
};

function fileForUrl(rawUrl){
  const url=new URL(rawUrl,"http://127.0.0.1");
  let pathname=decodeURIComponent(url.pathname);
  if(pathname.endsWith("/"))pathname+="index.html";
  const resolved=path.resolve(gameRoot,"."+pathname);
  return resolved.startsWith(gameRoot+path.sep)?resolved:null;
}

function serveFile(req,res,file){
  if(!file||!fs.existsSync(file)||!fs.statSync(file).isFile()){
    res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");return;
  }
  const stat=fs.statSync(file);
  const type=mime[path.extname(file).toLowerCase()]||"application/octet-stream";
  const range=req.headers.range;
  if(range){
    const match=/bytes=(\d*)-(\d*)/.exec(range);
    const start=match&&match[1]?Number(match[1]):0;
    const end=Math.min(match&&match[2]?Number(match[2]):stat.size-1,stat.size-1);
    if(start>stat.size-1||end<start){res.writeHead(416);res.end();return;}
    res.writeHead(206,{"content-type":type,"content-length":end-start+1,"content-range":`bytes ${start}-${end}/${stat.size}`,"accept-ranges":"bytes","cache-control":"no-store"});
    fs.createReadStream(file,{start,end}).pipe(res);return;
  }
  res.writeHead(200,{"content-type":type,"content-length":stat.size,"accept-ranges":"bytes","cache-control":"no-store"});
  fs.createReadStream(file).pipe(res);
}

function createServer(){
  return http.createServer((req,res)=>serveFile(req,res,fileForUrl(req.url||"/")));
}

function listen(server){
  return new Promise((resolve,reject)=>{
    server.once("error",reject);
    server.listen(port,"127.0.0.1",resolve);
  });
}

function stopServer(server){
  return new Promise(resolve=>server.close(()=>resolve()));
}

async function recordShot(page,shot){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),`aiba-${shot.name}-`));
  const raw=path.join(temp,`${shot.name}.webm`);
  const capture=await page.evaluate(()=>window.AIBATrailer.beginRecording({fps:60,bitrate:24000000}));
  try{
    await page.evaluate(async options=>{
      if(options.type==="action")return window.AIBATrailer.runAction(options);
      if(options.type==="burst")return window.AIBATrailer.runBurst(options);
      return window.AIBATrailer.runShot(options);
    },shot);
    await page.waitForTimeout(180);
  }catch(error){
    await page.evaluate(()=>window.AIBATrailer.endRecording()).catch(()=>{});
    throw error;
  }
  const recording=await page.evaluate(()=>window.AIBATrailer.endRecording());
  fs.writeFileSync(raw,Buffer.from(recording.base64,"base64"));
  if(recording.size<20000)throw new Error(`${shot.name}: recording was only ${recording.size} bytes`);
  const output=path.join(outputRoot,`${shot.name}.mp4`);
  const ffmpeg=spawnSync("ffmpeg",[
    "-y","-hide_banner","-loglevel","error","-i",raw,
    "-vf","crop=trunc(iw/2)*2:trunc((trunc(iw/2)*2)*16/9/2)*2:(iw-ow)/2:(ih-oh)/2,scale=1080:1920:flags=lanczos,fps=60",
    "-an","-c:v","libx264","-preset","slow","-crf","15",
    "-pix_fmt","yuv420p","-movflags","+faststart",output
  ],{stdio:"inherit"});
  fs.rmSync(temp,{recursive:true,force:true});
  if(ffmpeg.status!==0)throw new Error(`${shot.name}: ffmpeg failed with code ${ffmpeg.status}`);
  process.stdout.write(`captured ${shot.name}: ${capture.width}x${capture.height}, ${Math.round(recording.size/1024)} KB raw\n`);
}

async function main(){
  if(!fs.existsSync(chromePath))throw new Error(`Chrome not found at ${chromePath}`);
  fs.mkdirSync(outputRoot,{recursive:true});
  const server=createServer();
  let browser;
  try{
    await listen(server);
    browser=await chromium.launch({
      executablePath:chromePath,
      headless:true,
      args:["--mute-audio","--autoplay-policy=no-user-gesture-required","--enable-webgl","--ignore-gpu-blocklist","--hide-scrollbars"]
    });
    const context=await browser.newContext({
      viewport:{width:MOBILE.width,height:MOBILE.height},deviceScaleFactor:2,
      isMobile:true,hasTouch:true,
      userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"
    });
    const page=await context.newPage();
    let pageErrors=0;
    page.on("console",message=>{if(message.type()==="error"&&pageErrors<8)process.stderr.write(`[browser] ${message.text()}\n`);});
    page.on("pageerror",error=>{pageErrors+=1;if(pageErrors<=8)process.stderr.write(`[page] ${error.stack||error.message}\n`);});
    await page.goto(`http://127.0.0.1:${port}/next/?trailer=1&quality=ultra&v=${Date.now()}`,{waitUntil:"domcontentloaded",timeout:30000});
    await page.waitForFunction(()=>window.AIBATrailer&&window.AIBATrailer.status().ready,null,{timeout:30000});
    for(const shot of shots)await recordShot(page,shot);
    if(pageErrors)throw new Error(`Capture finished with ${pageErrors} browser runtime errors`);
  }finally{
    if(browser)await browser.close().catch(()=>{});
    await stopServer(server).catch(()=>{});
  }
}

main().catch(error=>{
  process.stderr.write(`${error.stack||error.message}\n`);
  process.exitCode=1;
});
