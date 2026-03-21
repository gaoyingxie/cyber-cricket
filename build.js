#!/usr/bin/env node
/**
 * cyber-cricket build script
 * 把 src/*.js 按顺序拼接 → index.html，并生成 source map
 *
 * 调试: Chrome DevTools Sources 面板会显示 src/ 下的原始文件
 * 用法: node build.js
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const htmlPath = path.join(__dirname, 'index.html');
const mapPath = path.join(__dirname, 'game.map');

// ---------- helpers ----------
function base64VLQ(n) {
    // 模拟 esbuild 的 zigzag: 正数→奇数，负数→偶数
    n = n < 0 ? (~n << 1) : (n << 1);
    let s = '';
    do {
        let chunk = n & 0x1f;
        n >>= 5;
        if (n) chunk |= 0x20; // 继续位
        s += String.fromCharCode(64 + chunk); // 0-31 → @-_
    } while (n);
    return s;
}

// ---------- 1. 读取源文件 ----------
const ORDER = ['constants.js', 'state.js', 'battle.js', 'reward.js', 'modes.js', 'ui.js'];
const sources = {};
ORDER.forEach(f => {
    sources[f] = fs.readFileSync(path.join(srcDir, f), 'utf8');
});

// ---------- 2. 生成 bundle（带分界注释）----------
const SEP = '\n// ---- // ----\n';
let bundle = '';
ORDER.forEach(f => {
    bundle += `// ===== ${f} =====\n${sources[f]}\n`;
});
bundle = bundle.trimEnd();

// ---------- 3. 生成 source map ----------
const bundleLines = bundle.split('\n');
const genLineCount = bundleLines.length;

// 对每一行 bundle，生成 mappings
// 策略: 每个文件在 bundle 中占据连续行段，每段第一个字符映射到源文件第一行
// 生成: [genColumn, srcIdx, srcLine, 0]
const mappings = [];

let currentSrcIdx = -1;
let currentSrcLine = 0;
let lineStarted = false;

bundleLines.forEach((line, genLine) => {
    // 检测文件分界注释行
    const sepMatch = line.match(/^\/\/ ===== (.+) =====/);
    if (sepMatch) {
        currentSrcIdx = ORDER.indexOf(sepMatch[1]);
        currentSrcLine = 0;
        mappings.push(''); // 空行
        return;
    }

    if (line.trim() === '') {
        mappings.push(''); // 空行
        return;
    }

    // 非空行: 生成一段映射
    // genColumn=0, srcIdx, srcLine, nameIdx=0
    if (currentSrcIdx >= 0) {
        const seg = base64VLQ(0) + ',' + base64VLQ(currentSrcIdx) + ',' + base64VLQ(currentSrcLine) + ',' + base64VLQ(0);
        mappings.push(seg);
        currentSrcLine++;
    } else {
        mappings.push(''); // 无效行
    }
});

const map = {
    version: 3,
    file: 'index.html',
    sources: ORDER.map(f => `src/${f}`),
    sourcesContent: ORDER.map(f => sources[f]),
    mappings: mappings.join(';'),
    names: []
};

// ---------- 4. 更新 index.html ----------
let html = fs.readFileSync(htmlPath, 'utf8');

// 移除旧内联脚本（保留外部脚本如 font）
html = html.replace(/<script>([\s\S]*?)<\/script>/g, (m) => {
    if (m.includes(' src=')) return m;
    return '';
});

// 注入新脚本
const newScript = `<script>\n${bundle}\n</script>\n`;
html = html.replace('</body>', newScript + '</body>');

// 追加 sourceMappingURL
html += '<!--# sourceMappingURL=game.map -->\n';

fs.writeFileSync(htmlPath, html);
fs.writeFileSync(mapPath, JSON.stringify(map));

// ---------- 5. 统计 ----------
const srcLines = ORDER.reduce((a, f) => a + sources[f].split('\n').length, 0);
console.log(`✓ Build: ${ORDER.length} modules`);
console.log(`  Source: ${srcLines} lines`);
console.log(`  Bundle: ${genLineCount} lines`);
console.log(`  Map: ${mapPath}`);
console.log(`  → Chrome DevTools → Sources → (no domain) → src/`);
