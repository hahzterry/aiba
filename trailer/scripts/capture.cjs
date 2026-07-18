"use strict";

const fs=require("node:fs");
const http=require("node:http");
const os=require("node:os");
const path=require("node:path");
const {spawn,spawnSync}=require("node:child_process");
const {chromium}=require("playwright-core");

const trailerRoot=path.resolve(__dirname,"..");
const gameRoot=path.resolve(trailerRoot,"..");
const outputRoot=path.join(trailerRoot,"public","footage");
const chromePath="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port=4181;

const allShots=[
  {name:"first-person",scene:"indoor",player:"k24",camera:0,shot:"arc"},
  {name:"follow",scene:"outdoorSunny",player:"j23",camera:1,shot:"arc"},
  {name:"broadcast",scene:"indoor",player:"a03",camera:2,shot:"deep-left"},
  {name:"rain-follow",scene:"rainyCourt",player:"t01",camera:1,shot:"deep-right"},
  {name:"flower-broadcast",scene:"flowerCourt",progress:.94,player:"v15",camera:2,shot:"money"},
  {name:"sunset-bullet",scene:"beachSunset",progress:.58,player:"k24",camera:1,shot:"deep-left",bullet:true,bulletMs:1100}
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

async function recordShot(page,cdp,shot){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),`aiba-${shot.name}-`));
  const pending=new Set();
  let frameNo=0;
  const onFrame=event=>{
    frameNo+=1;
    const target=path.join(temp,`frame-${String(frameNo).padStart(6,"0")}.jpg`);
    const write=fs.promises.writeFile(target,Buffer.from(event.data,"base64")).finally(()=>pending.delete(write));
    pending.add(write);
    cdp.send("Page.screencastFrameAck",{sessionId:event.sessionId}).catch(()=>{});
  };
  cdp.on("Page.screencastFrame",onFrame);
  await cdp.send("Page.startScreencast",{format:"jpeg",quality:92,maxWidth:720,maxHeight:1280,everyNthFrame:1});
  try{
    await page.evaluate(async options=>window.AIBATrailer.runShot(options),shot);
    await page.waitForTimeout(250);
  }finally{
    await cdp.send("Page.stopScreencast").catch(()=>{});
    cdp.removeListener("Page.screencastFrame",onFrame);
    await Promise.all([...pending]);
  }
  if(frameNo<30)throw new Error(`${shot.name}: only ${frameNo} screencast frames captured`);
  const output=path.join(outputRoot,`${shot.name}.mp4`);
  const ffmpeg=spawnSync("ffmpeg",[
    "-y","-hide_banner","-loglevel","error","-framerate","30",
    "-i",path.join(temp,"frame-%06d.jpg"),"-c:v","libx264","-preset","slow","-crf","15",
    "-pix_fmt","yuv420p","-movflags","+faststart",output
  ],{stdio:"inherit"});
  fs.rmSync(temp,{recursive:true,force:true});
  if(ffmpeg.status!==0)throw new Error(`${shot.name}: ffmpeg failed with code ${ffmpeg.status}`);
  process.stdout.write(`captured ${shot.name}: ${frameNo} frames\n`);
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
    const context=await browser.newContext({viewport:{width:720,height:1280},deviceScaleFactor:1});
    const page=await context.newPage();
    let pageErrors=0;
    page.on("console",message=>{if(message.type()==="error"&&pageErrors<8)process.stderr.write(`[browser] ${message.text()}\n`);});
    page.on("pageerror",error=>{pageErrors+=1;if(pageErrors<=8)process.stderr.write(`[page] ${error.stack||error.message}\n`);});
    await page.goto(`http://127.0.0.1:${port}/next/?trailer=1&v=${Date.now()}`,{waitUntil:"domcontentloaded",timeout:30000});
    await page.waitForFunction(()=>window.AIBATrailer&&window.AIBATrailer.status().ready,null,{timeout:30000});
    const cdp=await context.newCDPSession(page);
    for(const shot of shots)await recordShot(page,cdp,shot);
    if(pageErrors)throw new Error(`Capture finished with ${pageErrors} browser runtime errors`);
    await cdp.detach();
  }finally{
    if(browser)await browser.close().catch(()=>{});
    await stopServer(server).catch(()=>{});
  }
}

main().catch(error=>{
  process.stderr.write(`${error.stack||error.message}\n`);
  process.exitCode=1;
});
