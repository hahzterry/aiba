(function(global){
  "use strict";

  const DIFFS=Object.freeze({
    easy:{n:"新秀",zone:11,fill:80,ai:-0.085,hideBar:99,latK:0.012,d:"甜区超大 · 投篮条全程可见"},
    normal:{n:"全明星",zone:5.5,fill:95,ai:0,hideBar:1,latK:0.02,d:"甜区收窄 · 第2个球架起隐藏投篮条"},
    hard:{n:"名人堂",zone:3.2,fill:110,ai:0.055,hideBar:1,latK:0.028,d:"甜区极窄 · 第2架起盲投 · 手机倾斜更敏感"}
  });

  const RACK_RUSH_LEVELS=Object.freeze([
    {name:"热身启动",time:30,feed:1.35,targets:{easy:18,normal:20,hard:22},bar:"all"},
    {name:"节奏加速",time:35,feed:1.25,targets:{easy:26,normal:30,hard:34},bar:"all"},
    {name:"压力测试",time:40,feed:1.15,targets:{easy:36,normal:42,hard:48},bar:"time10"},
    {name:"火力全开",time:40,feed:1.05,targets:{easy:48,normal:56,hard:64},bar:"shots5"},
    {name:"极限盲投",time:45,feed:.95,targets:{easy:62,normal:72,hard:80},bar:"none"},
    {name:"FINAL RUSH",time:30,feed:.9,targets:null,bar:"none",final:true}
  ]);

  const SCENE_PRESETS=Object.freeze({
    indoor:{name:"室内经典",type:"indoor",weather:"none",progression:"none",desc:"木地板、看台与球馆灯光"},
    outdoorSunny:{name:"晴天街头",type:"outdoor",weather:"sunny",progression:"none",desc:"蓝天、围栏与城市公园"},
    rainyCourt:{name:"雨天街头",type:"outdoor",weather:"rain",progression:"none",desc:"湿润球场、阴云与轻量雨势"},
    flowerCourt:{name:"鲜花球场",type:"outdoor",weather:"sunny",progression:"flowerBloom",desc:"从杂草到花海，每次得分都会永久生长"},
    beachSunset:{name:"西海岸夕阳",type:"outdoor",weather:"sunny",progression:"sunsetToNight",desc:"海边黄昏随比分推进至夜场"}
  });

  const WEATHER_SHOT_MODIFIERS=Object.freeze({
    none:{idealBias:0,noiseMin:0,noiseMax:0},
    sunny:{idealBias:0,noiseMin:0,noiseMax:0},
    rain:{idealBias:3.5,noiseMin:-1,noiseMax:1.5}
  });

  const CLASSIC_LEGENDS=Object.freeze([
    {n:"库里",t:"萌神 · 历史三分王",r:97,col:[0x1d428a,0xffc72c],num:30},
    {n:"克莱·汤普森",t:"佛祖 · 单节37分",r:93,col:[0xffc72c,0x1d428a],num:11},
    {n:"雷·阿伦",t:"君子雷 · 致命底角",r:91,col:[0x007a33,0xffffff],num:20},
    {n:"拉里·伯德",t:"大鸟 · 穿西装夺冠",r:89,col:[0x007a33,0x111111],num:33},
    {n:"雷吉·米勒",t:"米勒时刻",r:88,col:[0xfdbb30,0x002d62],num:31},
    {n:"利拉德",t:"利指导 · Logo Shot",r:90,col:[0xe03a3e,0x111111],num:0},
    {n:"科沃尔",t:"接球就有",r:86,col:[0xc8102e,0x26282a],num:26},
    {n:"佩贾",t:"三分大赛两连冠",r:87,col:[0x5a2d81,0x8a8d8f],num:16}
  ]);

  const DEFAULT_SHOT_PROFILE=Object.freeze({speed:1,window:1,label:"标准出手"});
  const SHOT_PROFILES=Object.freeze({
    "库里":{speed:1.13,window:1.1,label:"极速出手"},
    "克莱·汤普森":{speed:1.09,window:1.08,label:"快速定点"},
    "雷·阿伦":{speed:1.02,window:1.09,label:"标准快出手"},
    "拉里·伯德":{speed:.88,window:1.1,label:"沉稳高出手"},
    "雷吉·米勒":{speed:1,window:1.02,label:"标准出手"},
    "利拉德":{speed:1.07,window:.98,label:"快速远射"},
    "科沃尔":{speed:1.1,window:1.12,label:"极速接投"},
    "佩贾":{speed:.94,window:1.07,label:"舒展出手"},
    k24:{speed:.89,window:.97,label:"沉稳后仰"},
    j23:{speed:.84,window:.94,label:"滞空出手"},
    a03:{speed:1.04,window:.99,label:"快速拔起"},
    v15:{speed:.87,window:.92,label:"高点出手"},
    t01:{speed:.92,window:.97,label:"舒展远射"}
  });

  global.AIBA_CONFIG=Object.freeze({
    LEADERBOARD_API:"https://aiba-leaderboard-api.tiger-seeker.workers.dev",
    DIFFS,
    RACK_RUSH_LEVELS,
    SCENE_PRESETS,
    WEATHER_SHOT_MODIFIERS,
    CLASSIC_LEGENDS,
    DEFAULT_SHOT_PROFILE,
    SHOT_PROFILES
  });
})(window);
