/* aiBA 双语支持:中文原文即词典 key,英文模式用 DOM 翻译层实时替换。
   语言判定:?lang= 参数 > localStorage > 浏览器语言;切换后刷新页面。
   未收录的文案在英文模式下保持中文原样显示(渐进覆盖,永不空白)。 */
(function(global){
"use strict";
const KEY="aiba-lang";
function detect(){
  try{
    const q=new URLSearchParams(location.search).get("lang");
    if(q==="en"||q==="zh"){try{localStorage.setItem(KEY,q);}catch(e){}return q;}
    const saved=localStorage.getItem(KEY);
    if(saved==="en"||saved==="zh")return saved;
  }catch(e){}
  return (navigator.language||"zh").toLowerCase().indexOf("zh")===0?"zh":"en";
}
const LANG=detect();
const CJK=/[一-鿿]/;
/* key 归一化:全角逗号→半角,压缩空白 */
function norm(s){return s.trim().replace(/，/g,",").replace(/\s+/g," ");}

const DICT={
/* ---- 启动 ---- */
"游戏资源加载":"Loading game assets",
"正在展开赛场":"Setting up the arena",
"初始化资源":"Initializing assets",
"画面与声音已待命":"Graphics and sound ready",
"点击任意位置或按任意键":"Tap anywhere or press any key",
/* ---- 体感引导弹窗 ---- */
"用身体投篮":"Shoot with your body",
"双手入框锁定":"Hands in the box to lock in",
"举高蓄力":"Raise up to charge",
"越线出手":"Cross the line to release",
"摄像头画面只在本机识别姿态,不上传、不存储。":"The camera runs on-device for pose detection only — nothing is uploaded or stored.",
"开启摄像头,进入真实球场":"Enable camera & hit the real court",
"还是用触屏":"Stick with touch",
/* ---- 欢迎弹窗 ---- */
"按住屏幕蓄力":"Hold to charge",
"松开手出手":"Release to shoot",
"力量停在绿色甜区":"Stop the power in the green zone",
"= 空心三分":"= nothing-but-net three",
"进入真实球场互动教学":"Interactive tutorial on the real court",
"直接开逛":"Just explore",
"查看完整玩法说明 ›":"Full how-to-play guide ›",
/* ---- 首页 ---- */
"取个球场名":"Pick your court name",
"昵称":"Nickname",
"比如 TigerBro":"e.g. TigerBro",
"上场":"Check in",
"街机闯关":"Arcade run",
"投篮机挑战":"Shooting Machine",
"连续供球,逐关达标,冲击最高总分。":"Nonstop feeds — clear stage goals and chase a high score.",
"开始闯关 »":"Start the run »",
"百分大战":"Percent Battle",
"先到 100":"First to 100",
"三分大赛":"3PT Contest",
"三分挑战":"3PT Challenge",
"70 秒挑战":"70-second challenge",
"【即将上线】":"[Coming soon]",
"今日榜":"Today",
"总榜":"All-time",
"全球榜":"Global",
"好友挑战":"Challenge a friend",
"霓虹球场,街机快攻。冲到 100,或者刷出最高分。":"Neon court, arcade pace. Race to 100 or chase the high score.",
"统治力不是吼出来的,是每次对抗都赢下来。":"Dominance isn't shouted — it's earned in every matchup.",
/* ---- 难度页 ---- */
"选择难度":"Choose difficulty",
"随机上场":"Random starter",
"每局从球星池随机抽选":"A random star from the pool each game",
"换球员 ›":"Swap player ›",
"换球员":"Swap player",
"赛场":"Court",
"室内经典":"Classic indoor",
"操作模式":"Controls",
"触屏控制":"Touch",
"体感控制":"Motion",
"推荐":"Recommended",
"新秀":"Rookie",
"全明星":"All-Star",
"名人堂":"Hall of Fame",
"甜区超大 · 前70%显示投篮条 · 最后30%靠手感":"Huge sweet zone · meter shown for first 70% · last 30% by feel",
"甜区收窄 · 第2个球架起隐藏投篮条":"Narrower sweet zone · meter hidden from rack 2",
"甜区极窄 · 第2架起盲投 · 手机倾斜更敏感":"Tiny sweet zone · blind from rack 2 · tilt more sensitive",
"百分大战中,难度会影响你的甜区宽度和对手命中节奏。":"In Percent Battle, difficulty sets your sweet-zone width and the opponent's scoring pace.",
"难度决定每关晋级目标与投篮甜区,供球速度按关卡逐步加快。":"Difficulty sets stage goals and the sweet zone; feed speed ramps up stage by stage.",
"排行与挑战":"Ranks & challenges",
"游戏设置":"Settings",
"返回设置":"Back to setup",
"返回难度":"Back to difficulty",
"返回":"Back",
/* ---- 投篮机子模式 ---- */
"闯关挑战":"Level Run",
"百分竞速":"Speed 100",
"固定弧顶连续供球。普通 2 分,花球 3 分,逐关达标进入 FINAL RUSH。":"Nonstop feeds at the top of the arc. 2 pts normal, 3 pts money ball; clear stages to reach FINAL RUSH.",
"进入后先选难度,再选择子模式:":"Pick a difficulty first, then a sub-mode:",
"闯关挑战是逐关达标刷总分;百分竞速是普通球":"Level Run is stage goals for total score; Speed 100 races the clock",
/* ---- 更衣室 ---- */
"赛前更衣室":"Pre-game locker room",
"横划查看球员。点卡片只是预览,确认后才会锁定上场。":"Swipe to browse. Tapping previews; confirm to lock in your starter.",
"确认上场":"Confirm starter",
"装备工坊":"Gear Lab",
"可穿 3 件,同时只有 1 件的加成生效,点「设为生效」切换":"Wear up to 3 pieces — only one bonus active at a time; tap “Set active” to switch",
"球鞋":"Shoes",
"未装备":"Not equipped",
"设为生效":"Set active",
"每局从球星池抽选,保留一点赛前未知感。":"Drawn from the star pool each game — keep a little pre-game mystery.",
"确认后,每局开赛会从完整球员池随机抽一个角色。":"Once confirmed, each game draws a random character from the full pool.",
"未知出手":"Unknown release",
"未知弧线":"Unknown arc",
"随机甜区":"Random sweet zone",
/* ---- 球星名 ---- */
"库里":"Curry","克莱·汤普森":"Klay Thompson","雷·阿伦":"Ray Allen","拉里·伯德":"Larry Bird",
"雷吉·米勒":"Reggie Miller","利拉德":"Lillard","科沃尔":"Korver","佩贾":"Peja",
"萨布丽娜":"Sabrina","陶乐西":"Taurasi","苏·伯德":"Sue Bird","自建球员":"Custom player",
/* ---- 赛前 / 比赛 HUD ---- */
"开战!":"Tip-off!",
"净计时":"Game clock",
"得分 PTS":"SCORE PTS",
"🔥 中场待触发":"🔥 Halfcourt: armed",
"中场待触发":"Halfcourt: armed",
"按住屏幕蓄力 · 松开出手 · 停在绿色甜区":"Hold to charge · release to shoot · stop in the green zone",
"弧顶":"Top of arc","左底角":"Left corner","右底角":"Right corner",
"左侧 45°":"Left wing 45°","右侧 45°":"Right wing 45°","中场 LOGO 超远":"Logo range",
"左彩球点":"Left color-ball spot","右彩球点":"Right color-ball spot",
"投篮热身":"Shooting warm-up","拉伸热身":"Stretch warm-up","赛前热身":"Pre-game warm-up",
"热身":"Warm-up","热身中":"Warming up",
"热身 · 按住蓄力,顶点出手!":"Warm-up · hold to charge, release at the peak!",
"🏀 热身练习 (3球)":"🏀 Warm-up (3 balls)",
"对镜头摇手指":"Wag a finger at the camera",
"跳过 ≫":"Skip ≫","跳过":"Skip",
"你 (YOU)":"YOU","你":"You","对手":"Opponent",
"球员跟随":"Follow cam","第一人称":"First person","📷 第一人称":"📷 First person",
"出手顺序随机抽签 · 对手比赛全程直播":"Shooting order drawn at random · opponent plays live",
"手感不错,上场吧!":"Nice touch — let's play!",
"找到节奏了吗?顶点出手是关键":"Found the rhythm? Release at the peak.",
"出手中":"Releasing","最后一球出手":"Last ball up","等待启动":"Standing by",
"体感投篮摄像头预览":"Motion-shot camera preview",
"关闭体感控制":"Turn off motion control",
"双手放入下方蓄力框":"Put both hands in the charge box below",
"⟺ 保持水平":"⟺ Keep it level",
"最后冲刺":"Final sprint","最后5分!":"Final 5 points!","时间到!":"Time's up!",
"中场10分!":"Halfcourt 10!","中场超远,十分到手!":"From way downtown — 10 points!",
"中场10分 力量↑":"Halfcourt 10 — power ↑","🔥 中场10分":"🔥 Halfcourt 10",
"百分竞速 · 下一球3分":"Speed 100 · next ball 3 pts",
"连续供球 · 下一球2分":"Nonstop feed · next ball 2 pts",
"发力过猛 · 跳过头才松手了":"Overcooked it — released past the peak",
"出手太早 · 等跳到最高点":"Too early — wait for the top of the jump",
"新秀挑战升级 · 最后30%隐藏投篮条":"Rookie ramp-up — meter hidden for the last 30%",
"前5球热手结束 · 蓄力条隐藏,靠手感出手":"Warm-up over (5 balls) — meter hidden, shoot by feel",
"本关进入手感投篮 · 蓄力条隐藏":"Feel-shooting this stage — meter hidden",
"盲投模式!投篮条已隐藏 · 凭手感节奏出手":"Blind mode! Meter hidden — shoot on rhythm",
"达标后不停表 · 继续刷总分":"Clock keeps running — keep stacking points",
"继续投 · 分数仍计入总分":"Keep shooting — still counts toward the total",
"雨天球更重 · 甜区略微上移,出手需要稍加力":"Rain adds weight — sweet zone shifts up, add a touch of power",
"像素之夜 PIXEL NIGHT":"PIXEL NIGHT",
"甜区":"Sweet zone","本关":"This stage","目标":"Goal","总分":"Total","用时":"Time","分数":"Score",
/* ---- 命中反馈 ---- */
"唰——!":"Swish!","太准了!":"Dead-eye!","手起刀落!":"Quick release!","完美弧线!":"Perfect arc!",
"稳!":"Money!","打铁...":"Brick...","弹框而出!":"Rims out!","差一点点":"So close",
"哎呀短了":"Short!","力量大了":"Too strong","命中 ✅":"Made ✅","打铁 ❌":"Miss ❌",
/* ---- 热手解说 ---- */
"连进三个,手感开机了!":"Three straight — the hot hand is on!",
"别眨眼,这节奏要起飞。":"Don't blink — this rhythm is taking off.",
"三连中,篮网开始发烫。":"Three in a row — the net's heating up.",
"你该叫暂停了。":"You should call a timeout.",
"手感火热,挡不住了!":"White hot — can't be stopped!",
"五连中,球馆已经炸了!":"Five straight — the arena's on fire!",
"这不是手感,这是自动瞄准!":"That's not touch, that's aimbot!",
"篮筐在向你招手。":"The rim is waving you in.",
"八连中,全场进入见证模式!":"Eight straight — witness mode, everyone!",
"现在每一次出手都像慢动作。":"Every release looks like slow motion now.",
"别投了,这比赛要被你打坏了!":"Stop shooting — you're breaking the game!",
"五连铁了,篮筐都要报警了。":"Five bricks — the rim's calling the cops.",
"深呼吸,下一球找回手感。":"Deep breath. Get it back next shot.",
"今天这篮筐有点不讲理。":"The rim's being rude today.",
"别急,节奏回来就有。":"Easy — the rhythm will come back.",
"方块手感掉线了,重启一下。":"Voxel touch disconnected — reboot it.",
"八连铁,先把手感从地板上捡起来。":"Eight bricks — pick your touch up off the floor.",
"稳住,下一球只看节奏。":"Steady. Next shot, rhythm only.",
"别和篮筐较劲,用弧线说话。":"Don't fight the rim — let the arc talk.",
/* ---- 对手垃圾话 ---- */
"三分线外是我的地盘。":"Beyond the arc is my turf.",
"今晚我让你两个花球。":"I'll spot you two money balls tonight.",
"方块小子,回家再练十年。":"Go home and practice ten more years, blockhead.",
"我闭着眼都比你准。":"I shoot better with my eyes closed.",
"听到观众在喊谁的名字了吗?":"Hear whose name they're chanting?",
"希望你的手别抖。":"Hope your hands don't shake.",
"运气球罢了…":"Lucky shot…",
"风!刚才一定有风!":"Wind! That had to be wind!",
"裁判!他踩线了吧?!":"Ref! He stepped on the line, right?!",
"别得意,还没结束。":"Don't celebrate yet — it's not over.",
"……他什么时候变这么准的?":"…when did he get this accurate?",
"我热身还没做完而已。":"I'm just not done warming up.",
"看到没!这就是差距!":"See that? That's the gap!",
"谁是三分王?!":"Who's the 3PT king?!",
"太轻松了!":"Too easy!",
"跟我斗?还嫩点!":"Coming at me? Not ready yet!",
"这分我拿定了!":"This one's mine!",
"感受方块的力量!":"Feel the power of the voxel!",
"快追啊!":"Better catch up!",
"就这点本事?":"That all you got?",
"我已经看到终点了!":"I can see the finish line!",
"你还差得远呢!":"You're miles behind!",
"100分是我的!":"100 is mine!",
"就这?":"That's it?",
"我奶奶都比你稳。":"My grandma's steadier than you.",
"手抖了啊兄弟。":"Hands shaking, huh?",
"要不要借你我的发带?":"Want to borrow my headband?",
"观众都替你尴尬了。":"Even the crowd is embarrassed for you.",
"看好了,这才叫投篮。":"Watch closely — THIS is shooting.",
"我会让你知道差距。":"I'll show you the gap.",
"记好这个分数。":"Remember this score.",
"疼痛会说话,冠军会继续打。":"Pain talks; champions keep playing.",
/* ---- 结算 / 暂停 / 回放 ---- */
"挑战结束":"Challenge over",
"百分大战惜败":"Percent Battle — tough loss",
"再来一届":"Run it back",
"生成战报海报":"Generate recap poster",
"📤 生成战报海报":"📤 Generate recap poster",
"分享成绩":"Share result",
"返回封面":"Back to home",
"本地排行榜":"Local leaderboard",
"暂停菜单":"Pause menu",
"暂停了。":"Paused.",
"可以继续、重开当前模式,或直接返回首页。":"Continue, restart this mode, or head back home.",
"继续比赛":"Resume game",
"继续 →":"Continue →","继续":"Continue","完成!":"Done!","完成":"Done",
"继续!守住领先":"Keep going — protect the lead",
"继续!扩大领先":"Keep going — stretch the lead",
"决赛":"Final","半决赛":"Semifinal","🏆 决 赛":"🏆 FINAL",
"最高连中":"Best streak","练习模式":"Practice mode",
"突然死亡决胜球 · 各投 1 记深远三分":"Sudden death · one deep three each",
"你先出手 · 命中且对手打铁即夺冠":"You shoot first — make it and a miss takes the title",
"出手决胜球!":"Take the winner!",
"突然死亡决胜":"Sudden death",
"继续决胜":"Continue the decider",
"(决胜球)":"(game winner)",
"🎬 英雄时刻 HERO BALL":"🎬 HERO BALL",
"🎬 英雄时刻":"🎬 Hero moment",
"● REPLAY 精彩回放":"● REPLAY highlight",
"⚡ 深远三分回放":"⚡ Deep-three replay",
"⏱ 压哨球回放":"⏱ Buzzer-beater replay",
"💰 关键球回放":"💰 Clutch replay",
"地板低机位":"Low floor cam","底线机位":"Baseline cam","侧翼跟踪":"Wing tracking",
"🏆 胜利庆祝":"🏆 Victory celebration",
"🏁 百分竞速完成":"🏁 Speed 100 complete",
"🏆 RACK RUSH 完成":"🏆 RACK RUSH complete",
"FINAL RUSH 完成":"FINAL RUSH complete",
"完成 FINAL RUSH":"FINAL RUSH cleared",
"百分竞速完成":"Speed 100 complete",
"可投1次":"1 attempt","秒恢复":"s to recover","百分耗时":"Time to 100",
/* ---- 排行榜 ---- */
"全球排行榜":"Global leaderboard",
"全球总榜":"Global all-time",
"全球排名同步中":"Syncing global rank",
"暂无全球记录":"No global records yet",
"玩家":"Player",
"全球排行榜暂不可用":"Global leaderboard unavailable",
"全球排行榜读取失败,稍后再试。":"Couldn't load the global leaderboard — try again later.",
"成绩与挑战链接已复制":"Score & challenge link copied",
"百分竞速排行榜":"Speed 100 leaderboard",
"RACK RUSH 排行榜":"Rack Rush leaderboard",
"百分竞速排行榜按用时越短排名越高。":"Speed 100 ranks by fastest time.",
/* ---- 设置面板 ---- */
"昵称与画面流畅度都在这里调整。":"Tune your nickname and performance here.",
"自动流畅保护":"Auto smoothness guard",
"持续低帧时自动精简观众与特效":"Trims crowd & FX automatically on sustained low FPS",
"手机端生效,桌面端保持原画质":"Active on phones; desktop keeps full quality",
"省电分辨率":"Battery-saver resolution",
"压低渲染分辨率下限,最直接的提帧手段(画面会略糊)":"Lowers the render-resolution floor — the most direct FPS boost (slightly softer image)",
"关灯光光锥":"Disable light cones",
"关掉体育馆透明光柱,iOS 填充率大头":"Turns off arena light shafts — a big iOS fill-rate cost",
"观众密度":"Crowd density",
"近场观众是 draw call 大头,关掉最省":"Nearby crowd is the draw-call hog; off saves the most",
"全部":"Full","精简":"Light","关闭":"Off",
"关火焰/纸屑特效":"Disable fire/confetti FX",
"关掉热手火焰轨迹与庆祝纸屑粒子":"Turns off hot-hand flames and celebration confetti",
"显示 FPS 读数":"Show FPS meter",
"右上角常显 帧率 / draw call / 分辨率倍率":"Always show FPS / draw calls / resolution scale (top right)",
"全部恢复默认":"Reset all to defaults",
"未设置昵称":"No nickname yet",
"修改昵称":"Edit nickname",
"设置昵称":"Set nickname",
"修改昵称 ›":"Edit nickname ›",
"设置昵称 ›":"Set nickname ›",
"语言":"Language",
"切换后自动刷新页面":"Switching reloads the page",
/* ---- 封面名言 ---- */
"基本功不会上热搜,但会赢到最后。":"Fundamentals don't trend — they win in the end.",
"安静地得分,也是一种锋利。":"Scoring quietly is its own kind of sharp.",
"把一个动作练到无解,世界就会为你让路。":"Master one move past answering, and the world steps aside.",
"关键时刻别躲,那正是你被记住的地方。":"Don't hide in big moments — that's where you're remembered.",
"只要还剩一秒,射手就还活着。":"As long as one second remains, the shooter is alive.",
"重复到极致,压力就会变成节奏。":"Repeat it enough and pressure becomes rhythm.",
"控制节奏的人,控制比赛的呼吸。":"Control the tempo and you control the game's breathing.",
"远距离不是炫技,是告诉对手时间到了。":"Deep range isn't showing off — it's telling them time's up.",
"别急着成为传奇,先每天变强一点。":"Don't rush to be a legend — get a little better every day.",
"脚步是答案,耐心是钥匙。":"Footwork is the answer; patience is the key.",
"胜利不是个人表演,是让身边的人一起变强。":"Winning isn't a solo act — it lifts everyone around you.",
"真正的高度,来自长年累月的自律。":"Real height comes from years of discipline.",
"风格不是装饰,是你解决问题的方式。":"Style isn't decoration — it's how you solve problems.",
"看见别人看不见的空当,比赛就慢了下来。":"See the gaps others can't, and the game slows down.",
"创造力是冒险,但赢球需要勇敢冒险。":"Creativity is a risk — winning takes the brave kind.",
"不是每个英雄都得分,有人负责把球权抢回来。":"Not every hero scores — someone has to win the ball back.",
"压力不是敌人,它只是提醒你这一球重要。":"Pressure isn't the enemy — just a reminder this shot matters.",
/* ---- 镜头 / 赛前动作 ---- */
"侧翼跟拍":"Wing tracking","出手合影":"Release photo-op","篮筐特写":"Rim close-up",
"高位跟拍":"High tracking","高空吊臂":"Sky crane","挑战者":"Challenger","训练搭档":"Training partner",
"向镜头致意":"Salute the camera","🎯 轮到你出手":"🎯 Your turn to shoot",
"越线触发 · 出手":"Line crossed · release","出手":"Release",
/* ---- 传奇球星名 / 标签 ---- */
"黑曼巴":"Black Mamba","飞翼":"Skywing","电闪":"Flash","空袭":"Air Raid","弧光":"Arc Light",
"黑金后仰":"Black-gold fadeaway","关键球杀手":"Clutch killer",
"红黑飞人":"Red-black flyer","空中统治":"Rules the air",
"街头控卫":"Street PG","交叉步之王":"King of the crossover",
"紫电暴扣":"Purple-lightning dunks","高光制造":"Highlight factory",
"蓝白长臂":"Blue-white wingspan","左手远射":"Lefty deep range",
"萌神":"Baby-Faced Assassin","历史三分王":"All-time 3PT king",
"佛祖":"Buddha","单节37分":"37 in a quarter",
"君子雷":"Jesus Shuttlesworth","致命底角":"Deadly corner",
"大鸟":"The Bird","穿西装夺冠":"Won one in a suit",
"米勒时刻":"Miller Time","利指导":"Dame Time","接球就有":"Catch and cash",
"三分大赛两连冠":"Back-to-back 3PT champ","自由人":"Liberty",
"白曼巴":"White Mamba","WNBA得分王":"WNBA scoring queen","四冠传奇控卫":"4-time champion PG",
"三分大赛纪录":"3PT contest record",
/* ---- 出手风格 ---- */
"极速出手":"Lightning release","快速定点":"Quick set shot","标准快出手":"Standard quick release",
"沉稳高出手":"Composed high release","标准出手":"Standard release","快速远射":"Quick deep range",
"极速接投":"Instant catch-and-shoot","舒展出手":"Smooth release","快速出手":"Quick release",
"冷血出手":"Cold-blooded release","节奏出手":"Rhythm release","沉稳后仰":"Composed fadeaway",
"滞空出手":"Hang-time release","快速拔起":"Quick rise","高点出手":"High-point release",
"舒展远射":"Smooth deep ball","稳定型":"Steady type","高弧快射":"High-arc quick shot",
"平稳弧线":"Smooth arc","标准弧线":"Standard arc","舒展高弧":"Smooth high arc","接投快弧":"Quick-arc catch-shoot",
/* ---- 装备 ---- */
"疾风橙":"Gale Orange","稳踏青":"Steady Teal","长跑灰":"Marathon Gray","回弹紫":"Rebound Purple",
"稳定白":"Stable White","冷血黑":"Clutch Black","快弹红":"Quick Red","节能蓝":"Efficient Blue",
"冷静金":"Cool Gold","专注青":"Focus Cyan"
};

/* 参数化文案:整节点正则规则 */
const RULES=[
[/^aiBA·百分大战(.*)$/,m=>"aiBA · Percent Battle"+m[1]],
[/^连中 x(.+)$/,m=>"Streak x"+m[1]],
[/^· 命中率 ?(.+)$/,m=>"· FG% "+m[1]],
[/^命中率 ?(.+)$/,m=>"FG% "+m[1]],
[/^达成100分 · 命中率 ?(.+)$/,m=>"Reached 100 · FG% "+m[1]],
[/^热身结束 · ?(.*)$/,m=>"Warm-up over · "+m[1]],
[/^对手 (\d.*)$/,m=>"Opponent "+m[1]],
[/^你 (\d.*)$/,m=>"You "+m[1]],
[/^📺 机位 (\d+) ·\s*(.*)$/,m=>"📺 Cam "+m[1]+" · "+t(m[2])],
[/^🎬 精彩回放 ?(.*)$/,m=>"🎬 Highlight "+m[1]],
[/^第 ?(\d+) ?关(.*)$/,m=>"Stage "+m[1]+m[2]],
[/^(\d+) 分$/,m=>m[1]+" pts"],
[/^目标 ?(.+)$/,m=>"Goal "+m[1]],
[/^用时 ?(.+)$/,m=>"Time "+m[1]],
[/^百分竞速完成,用时 ?(.*)$/,m=>"Speed 100 complete — time "+m[1]],
[/^本次挑战结束,总分 ?(.*)$/,m=>"Challenge over — total "+m[1]],
[/^RACK RUSH完成,总分 ?(.*)$/,m=>"RACK RUSH complete — total "+m[1]],
[/^难度: ?(.*)$/,m=>"Difficulty: "+t(m[1])],
[/^赛场 · ?(.*)$/,m=>"Court · "+t(m[1])],
[/^普通命中 3 分,彩球 4 分。(.*)$/,()=>"3 pts per make, 4 for color balls. Race to 100 fastest."],
[/^(\d+)分$/,m=>m[1]+" pts"],
[/^([A-Z]+-\d+)\s+(.+)$/,m=>m[1]+" "+t(m[2])],
[/^投射蓄力 ([+-]\d+%)$/,m=>"Charge speed "+m[1]],
[/^准星甜区 ([+-]\d+%)$/,m=>"Sweet zone "+m[1]],
[/^关键时刻准星 ([+-]\d+%)$/,m=>"Clutch aim "+m[1]],
[/^精力上限 ([+-]\d+%)$/,m=>"Stamina cap "+m[1]],
[/^精力恢复 ([+-]\d+%)$/,m=>"Stamina regen "+m[1]],
[/^精力消耗 ([+-]\d+%)$/,m=>"Stamina drain "+m[1]],
/* 兜底:按 " · " 分段各自翻译(需放在最后) */
[/ · /,m=>m.input.split(" · ").map(p=>t(p)).join(" · ")]
];

function t(s){
  if(LANG!=="en"||typeof s!=="string"||!CJK.test(s))return s;
  const key=norm(s);
  const hit=DICT[key];
  if(hit!==undefined)return hit;
  for(let i=0;i<RULES.length;i++){
    const m=key.match(RULES[i][0]);
    if(m)return RULES[i][1](m);
  }
  return s;
}

/* ---------- DOM 翻译层(仅英文模式挂载) ---------- */
function applyText(node){
  const v=node.nodeValue;
  if(!v||!CJK.test(v))return;
  const out=t(v);
  if(out!==v)node.nodeValue=out;
}
const ATTRS=["placeholder","title","aria-label"];
function applyAttrs(el){
  for(let i=0;i<ATTRS.length;i++){
    const a=el.getAttribute&&el.getAttribute(ATTRS[i]);
    if(a&&CJK.test(a)){const o=t(a);if(o!==a)el.setAttribute(ATTRS[i],o);}
  }
}
function walk(root){
  if(root.nodeType===3){applyText(root);return;}
  if(root.nodeType!==1)return;
  applyAttrs(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);
  let n;while((n=w.nextNode()))applyText(n);
  if(root.querySelectorAll){
    const els=root.querySelectorAll("[placeholder],[title],[aria-label]");
    for(let i=0;i<els.length;i++)applyAttrs(els[i]);
  }
}
function mount(){
  document.documentElement.setAttribute("lang","en");
  if(document.title)document.title=t(document.title);
  walk(document.documentElement);
  const mo=new MutationObserver(muts=>{
    for(let i=0;i<muts.length;i++){
      const m=muts[i];
      if(m.type==="characterData")applyText(m.target);
      else if(m.type==="attributes"){if(m.target.nodeType===1)applyAttrs(m.target);}
      else for(let j=0;j<m.addedNodes.length;j++)walk(m.addedNodes[j]);
    }
  });
  mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true,
    attributes:true,attributeFilter:ATTRS});
}
if(LANG==="en"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});
  else mount();
}

/* 语言切换(设置面板调用) */
global.AIBALang=function(l){
  if(l!=="en"&&l!=="zh")return;
  try{localStorage.setItem(KEY,l);}catch(e){}
  try{
    const u=new URL(location.href);u.searchParams.delete("lang");
    location.replace(u.toString());
  }catch(e){location.reload();}
};
global.AIBAI18N={lang:LANG,t:t};
})(window);
