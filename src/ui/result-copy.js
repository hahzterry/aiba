"use strict";

function stars(r) {
  const n = Math.round((r - 82) / 3);
  return "★".repeat(clamp(n, 2, 5));
}

const COVER_QUOTES = [
  { by: "Michael Jordan", line: "I can accept failure, but I cannot accept not trying." },
  { by: "Kobe Bryant", line: "The work you put in at 4 AM will answer when the lights come on." },
  { by: "LeBron James", line: "Greatness isn't waited for; it's raising the standard every single day." },
  { by: "Stephen Curry", line: "Range isn't the limit; confidence is the starting line." },
  { by: "Allen Iverson", line: "Height doesn't define you; heart does." },
  { by: "Vince Carter", line: "Believe you're already flying before you take off." },
  { by: "Tracy McGrady", line: "Shots can go cold, but a killer instinct never does." },
  { by: "Larry Bird", line: "When the chance comes, don't hesitate — let the ball speak." },
  { by: "Magic Johnson", line: "The best pass makes your teammates believe in miracles too." },
  { by: "Shaquille O'Neal", line: "Dominance isn't shouted; it's winning every battle in the paint." },
  { by: "Tim Duncan", line: "Fundamentals won't trend, but they'll win in the end." },
  { by: "Kevin Durant", line: "Scoring quietly is a sharpness of its own." },
  { by: "Dirk Nowitzki", line: "Master one move to perfection, and the world will make way for you." },
  { by: "Dwyane Wade", line: "Don't shy away from the big moments — that's where you're remembered." },
  { by: "Reggie Miller", line: "As long as one second remains, a shooter is still alive." },
  { by: "Ray Allen", line: "Repeat to the extreme, and pressure turns into rhythm." },
  { by: "Chris Paul", line: "He who controls the pace, controls the game's breath." },
  { by: "Damian Lillard", line: "Deep range isn't a showoff — it's telling your defender it's over." },
  { by: "Giannis Antetokounmpo", line: "Don't rush to become a legend — just get better every day." },
  { by: "Hakeem Olajuwon", line: "Footwork is the answer; patience is the key." },
  { by: "Bill Russell", line: "Victory isn't a solo act; it's making everyone around you better." },
  { by: "Kareem Abdul-Jabbar", line: "True height comes from years of self-discipline." },
  { by: "Julius Erving", line: "Style isn't decoration — it's how you solve problems." },
  { by: "Steve Nash", line: "See the gaps others don't, and the game slows down." },
  { by: "Manu Ginobili", line: "Creativity is risk, but winning takes bold risks." },
  { by: "Dennis Rodman", line: "Not every hero scores — some are there to get the ball back." },
  { by: "Isiah Thomas", line: "Pain talks, but champions keep playing." },
  { by: "Jerry West", line: "Pressure isn't the enemy — it's a reminder that this shot matters." }
];

function coverQuote() {
  return COVER_QUOTES[(Math.random() * COVER_QUOTES.length) | 0];
}

function scoreQuoteMarkup() {
  const q = coverQuote();
  return `<blockquote class="scoreQuote"><span>${q.line}</span><cite>${q.by}</cite></blockquote>`;
}