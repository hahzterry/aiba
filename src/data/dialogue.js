"use strict";

const TALK_PRE=["三分线外是我的地盘。","今晚我让你两个花球。","方块小子,回家再练十年。","我闭着眼都比你准。","听到观众在喊谁的名字了吗?","希望你的手别抖。"];
const TALK_OVERTAKEN=["运气球罢了…","风!刚才一定有风!","裁判!他踩线了吧?!","别得意,还没结束。","……他什么时候变这么准的?","我热身还没做完而已。"];
const TALK_CELEBRATE=["看到没!这就是差距!","谁是三分王?!","太轻松了!","跟我斗?还嫩点!","这分我拿定了!","感受方块的力量!"];
const TALK_BATTLE_TAUNT=["快追啊!","就这点本事?","我已经看到终点了!","你还差得远呢!","100分是我的!"];
const TALK_TAUNT=["就这?","我奶奶都比你稳。","手抖了啊兄弟。","要不要借你我的发带?","观众都替你尴尬了。"];
const TALK_CHASE=["看好了,这才叫投篮。","我会让你知道差距。","记好这个分数。"];
const TALK_STREAK_THREE=[
  {t:"连进三个,手感开机了!",role:"dj"},
  {t:"别眨眼,这节奏要起飞。",role:"pa"},
  {t:"三连中,篮网开始发烫。",role:"dj"},
  {t:"你该叫暂停了。",role:"rival",emo:"taunt"}
];
const TALK_STREAK_FIVE=[
  {t:"手感火热,挡不住了!",role:"dj"},
  {t:"五连中,球馆已经炸了!",role:"dj"},
  {t:"这不是手感,这是自动瞄准!",role:"rival",emo:"angry"},
  {t:"篮筐在向你招手。",role:"pa"}
];
const TALK_STREAK_EIGHT=[
  {t:"八连中,全场进入见证模式!",role:"dj"},
  {t:"现在每一次出手都像慢动作。",role:"pa"},
  {t:"别投了,这比赛要被你打坏了!",role:"rival",emo:"angry"}
];
const TALK_MISS_FIVE=[
  {t:"五连铁了,篮筐都要报警了。",role:"rival",emo:"taunt"},
  {t:"深呼吸,下一球找回手感。",role:"pa"},
  {t:"今天这篮筐有点不讲理。",role:"pa"},
  {t:"别急,节奏回来就有。",role:"pa"},
  {t:"方块手感掉线了,重启一下。",role:"dj"}
];
const TALK_MISS_EIGHT=[
  {t:"八连铁,先把手感从地板上捡起来。",role:"rival",emo:"taunt"},
  {t:"稳住,下一球只看节奏。",role:"pa"},
  {t:"别和篮筐较劲,用弧线说话。",role:"pa"}
];
const CHEERS=["唰——!","太准了!","手起刀落!","BANG!","完美弧线!","稳!"];
const MISSES=["打铁...","弹框而出!","差一点点","哎呀短了","力量大了"];

