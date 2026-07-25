#!/usr/bin/env node
"use strict";
/* 语音批量压缩:assets/aiba-audio/voices/*.wav -> *.mp3
 *
 * 语音目前全部是未压缩 WAV(约 27MB / 143 条,平均 183KB)。这些是按需加载的,
 * 不影响首屏,但每局比赛中途会持续拉取,在弱网下会造成播报延迟。转成 96kbps 单声道
 * MP3 后通常能压到原体积的 1/8 ~ 1/10,听感对语音来说几乎没有差别。
 *
 * 需要本机装有 ffmpeg(这台开发机没有,所以脚本设计成在你本地跑)。
 *
 *   node scripts/compress-voices.js --dry-run   只报告体积预估,不写任何文件
 *   node scripts/compress-voices.js             生成 .mp3,保留 .wav(游戏仍用 .wav)
 *   node scripts/compress-voices.js --apply     生成 .mp3 + 删除 .wav + 切换游戏到 .mp3
 *
 * --apply 会改动:
 *   - src/audio.js 的 VOICE_EXT 常量
 *   - .gitignore 的语音白名单后缀
 * 改完记得跑 node scripts/check.js 并提交。
 */

const fs = require("fs");
const path = require("path");
const { execFileSync, spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const voiceDir = path.join(root, "assets/aiba-audio/voices");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const apply = args.has("--apply");
const BITRATE = "96k";

function mb(bytes) { return (bytes / 1048576).toFixed(2) + " MB"; }
function kb(bytes) { return (bytes / 1024).toFixed(0) + " KB"; }

function hasFfmpeg() {
  const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore" });
  return !probe.error && probe.status === 0;
}

function main() {
  if (!fs.existsSync(voiceDir)) {
    console.error("找不到语音目录:", voiceDir);
    process.exit(1);
  }
  const wavs = fs.readdirSync(voiceDir).filter(name => /\.wav$/i.test(name)).sort();
  if (!wavs.length) {
    console.log("没有 .wav 语音需要处理(可能已经转换过了)。");
    return;
  }
  const beforeTotal = wavs.reduce((sum, name) => sum + fs.statSync(path.join(voiceDir, name)).size, 0);
  console.log(`发现 ${wavs.length} 条 WAV 语音,合计 ${mb(beforeTotal)}`);

  if (dryRun) {
    console.log(`\n预估(按 ${BITRATE} 单声道 MP3,约为原体积的 1/8~1/10):`);
    console.log(`  转换后大约 ${mb(beforeTotal / 9)} ~ ${mb(beforeTotal / 7)}`);
    console.log("\n最大的 5 条:");
    wavs.map(name => [name, fs.statSync(path.join(voiceDir, name)).size])
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .forEach(([name, size]) => console.log(`  ${kb(size).padStart(8)}  ${name}`));
    console.log("\n加 --apply 执行转换并切换游戏到 .mp3。");
    return;
  }

  if (!hasFfmpeg()) {
    console.error("\n未检测到 ffmpeg。请先安装:");
    console.error("  macOS:  brew install ffmpeg");
    console.error("  Ubuntu: sudo apt install ffmpeg");
    console.error("  Windows: https://ffmpeg.org/download.html");
    process.exit(1);
  }

  let afterTotal = 0, converted = 0, failed = [];
  wavs.forEach((name, index) => {
    const src = path.join(voiceDir, name);
    const out = path.join(voiceDir, name.replace(/\.wav$/i, ".mp3"));
    try {
      execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", src,
        "-ac", "1", "-b:a", BITRATE, "-map_metadata", "-1", out], { stdio: "pipe" });
      afterTotal += fs.statSync(out).size;
      converted++;
    } catch (error) {
      failed.push(name);
    }
    if ((index + 1) % 25 === 0 || index === wavs.length - 1) {
      process.stdout.write(`\r  已处理 ${index + 1}/${wavs.length}`);
    }
  });
  console.log("");

  if (failed.length) {
    console.error(`\n${failed.length} 条转换失败,已中止(未删除任何 .wav):`);
    failed.slice(0, 10).forEach(name => console.error("  " + name));
    process.exit(1);
  }
  console.log(`\n转换完成:${mb(beforeTotal)} -> ${mb(afterTotal)}  (省 ${(100 - afterTotal / beforeTotal * 100).toFixed(1)}%)`);

  if (!apply) {
    console.log("\n.mp3 已生成,.wav 仍保留,游戏当前仍在用 .wav。");
    console.log("确认试听没问题后,再跑一次带 --apply 完成切换。");
    return;
  }

  // 1) 切换 src/audio.js 的语音扩展名
  const audioPath = path.join(root, "src/audio.js");
  let audio = fs.readFileSync(audioPath, "utf8");
  const extLine = /const VOICE_EXT=("|')\.wav\1;/;
  if (!extLine.test(audio)) {
    console.error("\n没找到 VOICE_EXT 常量,请手动检查 src/audio.js");
    process.exit(1);
  }
  audio = audio.replace(extLine, 'const VOICE_EXT=".mp3";');
  fs.writeFileSync(audioPath, audio);

  // 2) .gitignore 白名单换后缀
  const ignorePath = path.join(root, ".gitignore");
  let ignore = fs.readFileSync(ignorePath, "utf8");
  ignore = ignore.replace(/^(!assets\/aiba-audio\/voices\/.*)\.wav$/gm, "$1.mp3");
  fs.writeFileSync(ignorePath, ignore);

  // 3) 删除原始 WAV
  wavs.forEach(name => fs.unlinkSync(path.join(voiceDir, name)));

  console.log("\n已切换到 .mp3:");
  console.log("  · src/audio.js  VOICE_EXT = \".mp3\"");
  console.log("  · .gitignore    语音白名单改为 *.mp3");
  console.log(`  · 删除 ${wavs.length} 个原始 .wav`);
  console.log("\n接下来:");
  console.log("  1. 记得给 src/audio.js 的缓存参数升个版(index.html 里的 ?v=)");
  console.log("  2. node scripts/check.js");
  console.log("  3. 本地跑一局确认语音正常再提交");
}

main();
