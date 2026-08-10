"use strict";

const TALK_PRE = [
  "This arc is MY block.",
  "I'll spot you two money balls — you're gonna need 'em.",
  "Square boy, go hit the lab for a decade.",
  "Eyes closed, no cap. Still splashing.",
  "Hear that crowd? They already know the name.",
  "Hope your hands ain't shaky, bro."
];

const TALK_OVERTAKEN = [
  "Fluke. That's all that was.",
  "Bruh, there's a draft in here!",
  "Ref! He's on the line — that's a 2!",
  "Save the celly, this ain't over.",
  "...Since when is he dialed in like that?",
  "I'm not even warmed up, fr fr."
];

const TALK_CELEBRATE = [
  "See that? LEVELS to this!",
  "Who runs this arc?! Say my name!",
  "Light work. Too easy.",
  "You ain't ready for this smoke.",
  "This bucket's mine. Lock it in.",
  "Feel the Block power! Get styled on!"
];

const TALK_BATTLE_TAUNT = [
  "Keep up! Stop lagging!",
  "That all you got? Yikes.",
  "I see the finish line — bet.",
  "You're way behind. Giving washed vibes.",
  "100 is MINE. Book it."
];

const TALK_TAUNT = [
  "That's it? Wait, that's the play?",
  "My grandma shoots straighter, no cap.",
  "Shaky hands? Yikes, bro.",
  "Need a headband? Or a map?",
  "The whole crowd is cringing for you."
];

const TALK_CHASE = [
  "Watch this — THAT'S a bucket.",
  "Imma show you the gap, fr.",
  "Remember this score. Frame it."
];

const TALK_STREAK_THREE = [
  { t: "3 straight. I'm LOCKED IN.", role: "dj" },
  { t: "Don't blink — the vibe's about to pop off.", role: "pa" },
  { t: "Three in a row? The net is TOAST.", role: "dj" },
  { t: "Call a timeout, bro. Save yourself.", role: "rival", emo: "taunt" }
];

const TALK_STREAK_FIVE = [
  { t: "FIVE straight! He's on fire, unstoppable!", role: "dj" },
  { t: "5 in a row! The gym is BANGING!", role: "dj" },
  { t: "This ain't a hot streak — it's auto‑aim, IRL.", role: "rival", emo: "angry" },
  { t: "The rim is literally calling your name.", role: "pa" }
];

const TALK_STREAK_EIGHT = [
  { t: "8 straight! We are witnessing GENERATIONAL aura!", role: "dj" },
  { t: "Every shot feels like slow‑mo. Icy.", role: "pa" },
  { t: "Chill, bro! You're literally breaking the game!", role: "rival", emo: "angry" }
];

const TALK_MISS_FIVE = [
  { t: "5 bricks? The rim is calling 911.", role: "rival", emo: "taunt" },
  { t: "Breathe. Lock in on the next one, fam.", role: "pa" },
  { t: "This rim is straight up TOXIC today.", role: "pa" },
  { t: "Chill, the flow will come back around.", role: "pa" },
  { t: "Block's connection dropped. Reboot incoming.", role: "dj" }
];

const TALK_MISS_EIGHT = [
  { t: "8 bricks? Pick your shot up off the floor, my guy.", role: "rival", emo: "taunt" },
  { t: "Steady… next one is pure rhythm, trust.", role: "pa" },
  { t: "Don't fight the rim — let the arc do the talking.", role: "pa" }
];

const CHEERS = [
  "SWISH!",
  "WET!",
  "DAGGER!",
  "BANG!",
  "SILKY!",
  "CASH!"
];

const MISSES = [
  "BRICK.",
  "RIM OUT!",
  "Oof. So close...",
  "Short... air? nah.",
  "Overcooked it."
];