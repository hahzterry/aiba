"use strict";

function stars(r){
  const n=Math.round((r-82)/3);
  return "★".repeat(clamp(n,2,5));
}
const COVER_QUOTES=[
  {by:"Michael Jordan",line:"我可以接受失败,但不能接受从未尝试。"},
  {by:"Kobe Bryant",line:"凌晨的努力,会在灯光亮起时回答一切。"},
  {by:"LeBron James",line:"伟大不是等来的,是每天把标准再抬高一点。"},
  {by:"Stephen Curry",line:"射程不是边界,信心才是起点。"},
  {by:"Allen Iverson",line:"身高不会定义你,心气会。"},
  {by:"Vince Carter",line:"起跳前先相信自己已经飞起来了。"},
  {by:"Tracy McGrady",line:"手感会冷,但杀手本能不能冷。"},
  {by:"Larry Bird",line:"当机会出现,别犹豫,让球说话。"},
  {by:"Magic Johnson",line:"最好的传球,是让队友也相信奇迹。"},
  {by:"Shaquille O'Neal",line:"统治力不是吼出来的,是每次对抗都赢下来。"},
  {by:"Tim Duncan",line:"基本功不会上热搜,但会赢到最后。"},
  {by:"Kevin Durant",line:"安静地得分,也是一种锋利。"},
  {by:"Dirk Nowitzki",line:"把一个动作练到无解,世界就会为你让路。"},
  {by:"Dwyane Wade",line:"关键时刻别躲,那正是你被记住的地方。"},
  {by:"Reggie Miller",line:"只要还剩一秒,射手就还活着。"},
  {by:"Ray Allen",line:"重复到极致,压力就会变成节奏。"},
  {by:"Chris Paul",line:"控制节奏的人,控制比赛的呼吸。"},
  {by:"Damian Lillard",line:"远距离不是炫技,是告诉对手时间到了。"},
  {by:"Giannis Antetokounmpo",line:"别急着成为传奇,先每天变强一点。"},
  {by:"Hakeem Olajuwon",line:"脚步是答案,耐心是钥匙。"},
  {by:"Bill Russell",line:"胜利不是个人表演,是让身边的人一起变强。"},
  {by:"Kareem Abdul-Jabbar",line:"真正的高度,来自长年累月的自律。"},
  {by:"Julius Erving",line:"风格不是装饰,是你解决问题的方式。"},
  {by:"Steve Nash",line:"看见别人看不见的空当,比赛就慢了下来。"},
  {by:"Manu Ginobili",line:"创造力是冒险,但赢球需要勇敢冒险。"},
  {by:"Dennis Rodman",line:"不是每个英雄都得分,有人负责把球权抢回来。"},
  {by:"Isiah Thomas",line:"疼痛会说话,冠军会继续打。"},
  {by:"Jerry West",line:"压力不是敌人,它只是提醒你这一球重要。"}
];
function coverQuote(){return COVER_QUOTES[(Math.random()*COVER_QUOTES.length)|0];}
function scoreQuoteMarkup(){
  const q=coverQuote();
  return `<blockquote class="scoreQuote"><span>${q.line}</span><cite>${q.by}</cite></blockquote>`;
}

