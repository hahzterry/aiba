(function(global){
  "use strict";

  const coverStars=Object.freeze([
    {id:"k24",n:"Kobe Bryant",t:"Five-time Champion · Clutch Specialist",r:95,col:[0x111111,0x4a3a12],num:24,
     cover:"assets/aiba-covers/cover-k24.webp",coverVideo:"assets/aiba-covers/cover-k24-lite.mp4",skin:0x8d5524,shoe:0x552583,headband:false,wrist:0xfdb927,sleeve:0x111111,hair:0x101010,hairStyle:"fade",beard:true},
    {id:"j23",n:"Michael Jordan",t:"Six-time Champion · Fadeaway Jumper",r:96,col:[0xce1141,0x111111],num:23,
     cover:"assets/aiba-covers/cover-j23.webp",coverVideo:"assets/aiba-covers/cover-j23-lite.mp4",skin:0x8d5524,shoe:0xce1141,headband:false,wrist:0x111111,sleeve:0x111111,hair:0x101010,hairStyle:"bald",beard:0x1a1a1a},
    {id:"a03",n:"Allen Iverson",t:"Four-time Scoring Champion · Crossover",r:92,col:[0xf7f7f7,0x1d428a],num:3,
     cover:"assets/aiba-covers/cover-a03.webp",coverVideo:"assets/aiba-covers/cover-a03-lite.mp4",skin:0x8d5524,shoe:0xffffff,headband:0xffffff,wrist:0x111111,sleeve:0x111111,hair:0x141414,hairStyle:"cornrows",beard:true},
    {id:"v15",n:"Vince Carter",t:"Eight-time All-Star · 2000 Slam Dunk Champion",r:90,col:[0x5a2d81,0x111111],num:15,
     cover:"assets/aiba-covers/cover-v15.webp",coverVideo:"assets/aiba-covers/cover-v15-lite.mp4",skin:0x9c6b43,shoe:0x7b2cff,headband:false,wrist:0x7b2cff,sleeve:0x111111,hair:0x101010,hairStyle:"bald",beard:false},
    {id:"t01",n:"Tracy McGrady",t:"Seven-time All-Star · Left-handed Long-range Shooter",r:91,col:[0x006bb6,0xffffff],num:1,
     cover:"assets/aiba-covers/cover-t01.webp",coverVideo:"assets/aiba-covers/cover-t01-lite.mp4",skin:0x8d5524,shoe:0x1d6dff,headband:false,wrist:0xffffff,sleeve:0x111111,hair:0x101010,hairStyle:"fade",beard:false}
  ]);

  const audio=Object.freeze({
    bgm:"assets/aiba-audio/menu-basketball-jersey.mp3",
    crowd:"assets/aiba-audio/crowd-basketball-game.mp3",
    crowdCheer:"assets/aiba-audio/crowd-cheer-stadium.mp3",
    rain:"assets/aiba-audio/rain-light-loop.mp3",
    ocean:"assets/aiba-audio/ocean-waves-loop.mp3",
    gull:"assets/aiba-audio/gull-call.mp3",
    voiceBase:"assets/aiba-audio/voices/",
    applause:"assets/aiba-audio/sfx/crowd-cheer-indoor-01.mp3",
    boo:"assets/aiba-audio/sfx/crowd-boo-01.mp3",
    horn:"",
    buzzer:"assets/aiba-audio/sfx/game-horn-01.mp3",
    startWhistle:"assets/aiba-audio/sfx/start-whistle-01.mp3",
    shoeSqueak:"assets/aiba-audio/sfx/shoe-squeak-01.mp3",
    bounce:"assets/aiba-audio/sfx/bounce-indoor-01.mp3",
    bounce2:"assets/aiba-audio/sfx/bounce-indoor-02.mp3",
    bounceSequence:"assets/aiba-audio/sfx/bounce-sequence-indoor-01.mp3",
    swish:"assets/aiba-audio/sfx/swish-01.mp3",
    swish2:"assets/aiba-audio/sfx/swish-02.mp3",
    swish3:"assets/aiba-audio/sfx/swish-03.mp3",
    clank:"assets/aiba-audio/sfx/rim-miss-01.mp3",
    clank2:"assets/aiba-audio/sfx/rim-miss-02.mp3",
    rimMake:"assets/aiba-audio/sfx/rim-make-01.mp3",
    crowdFinalMake:"assets/aiba-audio/crowd_final_make_01.mp3",
    crowdFinalMiss:"assets/aiba-audio/crowd_final_miss_01.mp3"
  });

  global.AIBA_ASSETS=Object.freeze({coverStars,audio});
})(window);