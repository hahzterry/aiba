"use strict";

const fs=require("node:fs");
const path=require("node:path");

const trailerRoot=path.resolve(__dirname,"..");
const gameRoot=path.resolve(trailerRoot,"..");
const copies=[
  ["assets/aiba-covers/cover-k24.mp4","public/covers/cover-k24.mp4"],
  ["assets/aiba-covers/cover-j23-lite.mp4","public/covers/cover-j23.mp4"],
  ["assets/aiba-covers/cover-a03.mp4","public/covers/cover-a03.mp4"],
  ["assets/aiba-audio/menu-basketball-dubstep.mp3","public/audio/menu-basketball-dubstep.mp3"],
  ["assets/aiba-audio/crowd-basketball-game.mp3","public/audio/crowd-basketball-game.mp3"]
];

for(const [source,target] of copies){
  const from=path.join(gameRoot,source),to=path.join(trailerRoot,target);
  if(!fs.existsSync(from))throw new Error(`Missing trailer source asset: ${from}`);
  fs.mkdirSync(path.dirname(to),{recursive:true});
  const sourceStat=fs.statSync(from);
  const targetStat=fs.existsSync(to)?fs.statSync(to):null;
  if(!targetStat||sourceStat.size!==targetStat.size||sourceStat.mtimeMs>targetStat.mtimeMs)fs.copyFileSync(from,to);
}

process.stdout.write(`Prepared ${copies.length} trailer assets.\n`);
