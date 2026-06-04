/* ============================================================
   TonTV · Node Sale — interactions & live (demo) dashboard
   No dependencies. Pure vanilla JS.
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt   = n => Math.round(n).toLocaleString('en-US');
  const fmt2  = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rand  = (a, b) => a + Math.random() * (b - a);

  const XONT_PRICE = 0.85;                                            // demo USD price (dashboard)
  const TONX_SUPPLY = 1e10;                                           // 100억 TONX 총 발행 한도
  const VIEWER_MINT = 0.0006;                                         // 시청자 1인당 TONX 채굴 / s (demo)
  const REF1_PCT = 0.10, REF2_PCT = 0.03;                            // 추천 보상: 1단계 10% · 2단계 3%
  const toast = (m, t) => (window.toast ? window.toast(m, t) : 0);    // shared toast (defined in layout.js)
  document.documentElement.classList.add('has-js');                  // enables scroll-reveal

  /* Shared chrome (sprites · nav · footer · deposit modal · toast · scroll bar)
     is injected by layout.js, which loads BEFORE this file. This file only owns
     page features: cinematic posters, scroll-reveal, and the dashboard. */

  /* =========================================================
     POSTERS — per-title cinematic film-still mockups (home/content)
     ========================================================= */
  const TOP10 = [
    { t: '재벌집 비밀 계약',   g: '로맨스 · 재벌',   ep: 'EP.7',  k: 'penthouse',    v: '4.2M', r: '4.9' },
    { t: '복수의 여왕',       g: '스릴러 · 복수',   ep: 'EP.12', k: 'revenge',      v: '3.8M', r: '4.8' },
    { t: '계약직 신데렐라',   g: '로맨스 · 코미디', ep: 'EP.5',  k: 'cinderella',   v: '3.1M', r: '4.7' },
    { t: '늑대의 유혹',       g: '청춘 · 로맨스',   ep: 'EP.9',  k: 'neonstreet',   v: '2.9M', r: '4.8' },
    { t: '황제의 아침',       g: '사극 · 판타지',   ep: 'EP.3',  k: 'palace',       v: '2.6M', r: '4.9' },
    { t: '이혼 후, 우리',     g: '멜로',           ep: 'EP.8',  k: 'rainpart',     v: '2.4M', r: '4.6' },
    { t: '악녀는 두 번 산다', g: '회귀 · 판타지',   ep: 'EP.6',  k: 'hourglass',    v: '2.2M', r: '4.8' },
    { t: '비밀의 정원',       g: '미스터리',       ep: 'EP.4',  k: 'garden',       v: '1.9M', r: '4.7' },
    { t: '회장님의 숨은 아들', g: '재벌 · 가족',     ep: 'EP.10', k: 'boardroom',    v: '1.7M', r: '4.6' },
    { t: '시한부 로맨스',     g: '멜로',           ep: 'EP.2',  k: 'petals',       v: '1.5M', r: '4.9' },
  ];
  const NEWS = [
    { t: '가짜 약혼자',       g: '로맨스',         ep: 'NEW', k: 'ring',         v: '892K', r: '4.7' },
    { t: '폭군의 비서',       g: '오피스 · 로맨스', ep: 'NEW', k: 'redoffice',    v: '770K', r: '4.6' },
    { t: '천 번째 환생',      g: '판타지',         ep: 'NEW', k: 'cosmic',       v: '654K', r: '4.8' },
    { t: '사장님은 내 전남편', g: '코미디',         ep: 'NEW', k: 'comedyoffice', v: '610K', r: '4.5' },
    { t: '그날의 살인',       g: '스릴러',         ep: 'NEW', k: 'noir',         v: '588K', r: '4.7' },
    { t: '달빛 아래 계약',    g: '사극 · 로맨스',   ep: 'NEW', k: 'moonpalace',   v: '540K', r: '4.8' },
  ];

  /* ---------- Cinematic per-title film-still generator (pure SVG, art-directed) ---------- */
  const loop = (n, fn) => { let o = ''; for (let i = 0; i < n; i++) o += fn(i); return o; };
  // silhouettes: male (broad), female (gown), child
  const figM = (x, y, s, c, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}" opacity="${o}"><circle cx="13" cy="8" r="7"/><path d="M1 66c0-19 6-32 12-32s12 13 12 32z"/></g>`;
  const figF = (x, y, s, c, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}" opacity="${o}"><circle cx="11" cy="9" r="6.4"/><path d="M4 33c1-5 13-5 14 0l9 35H-4z"/></g>`;
  const skyline = c => `<g fill="${c}"><rect x="-2" y="210" width="34" height="92"/><rect x="30" y="184" width="24" height="118"/><rect x="52" y="222" width="28" height="80"/><rect x="80" y="172" width="30" height="130"/><rect x="112" y="204" width="26" height="98"/><rect x="138" y="160" width="34" height="142"/><rect x="172" y="198" width="32" height="104"/></g>`;
  const winRows = c => `<g fill="${c}">` + loop(46, i => `<rect x="${6 + (i % 8) * 25 + (i % 3) * 2}" y="${184 + ((i / 8) | 0) * 13}" width="3" height="4" opacity="${(0.3 + (i % 4) * 0.18).toFixed(2)}"/>`) + `</g>`;

  function scene(kind, uid) {
    const u = 'sc' + uid;
    const lg = (id, s) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${s}</linearGradient>`;
    const rg = (id, cx, cy, r, s) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">${s}</radialGradient>`;
    const st = (o, c, a = 1) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`;
    const bg = id => `<rect width="200" height="300" fill="url(#${id})"/>`;
    const vg = `${rg(u + 'v', 100, 120, 165, st(.5, '#000', 0) + st(1, '#000', .6))}`;
    const wrap = (defs, inner) => `<svg class="scene" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice"><defs>${vg}<filter id="${u}bl" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.4"/></filter>${defs}</defs>${inner}<rect width="200" height="300" fill="url(#${u}v)"/></svg>`;
    const bokeh = cols => `<g filter="url(#${u}bl)">` + loop(13, i => { const x = (i * 41 + 9) % 196 + 2, y = 8 + (i * 59) % 150, r = 2.5 + (i % 4) * 3; return `<circle cx="${x}" cy="${y}" r="${r}" fill="${cols[i % cols.length]}" opacity="${(0.1 + (i % 3) * 0.08).toFixed(2)}"/>`; }) + `</g>`;
    const flare = (x, y, c) => `<g><rect x="${x - 30}" y="${y - .7}" width="60" height="1.4" fill="#fff" opacity=".45"/><rect x="${x - .7}" y="${y - 13}" width="1.4" height="26" fill="#fff" opacity=".35"/><circle cx="${x}" cy="${y}" r="11" fill="${c}" opacity=".55" filter="url(#${u}bl)"/><circle cx="${x}" cy="${y}" r="3" fill="#fff"/></g>`;
    const cone = (id, c) => rg(id, 100, 30, 160, st(0, c, .22) + st(1, c, 0));
    const rain = () => `<g stroke="#9db8d6" stroke-width=".8" opacity=".22">` + loop(34, i => { const x = (i * 31) % 214 - 6, y = (i * 53) % 240; return `<line x1="${x}" y1="${y}" x2="${x - 7}" y2="${y + 18}"/>`; }) + `</g>`;
    const petals = c => `<g fill="${c}">` + loop(13, i => { const x = (i * 53 + 11) % 196, y = (i * 71) % 286, rot = i * 41; return `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.5" opacity="${(0.3 + (i % 3) * 0.2).toFixed(2)}" transform="rotate(${rot} ${x} ${y})"/>`; }) + `</g>`;
    const stars = (n, c) => `<g fill="${c}">` + loop(n, i => { const x = (i * 47 + 7) % 198, y = (i * 29) % 150; return `<circle cx="${x}" cy="${y}" r="${(0.5 + (i % 3) * 0.4).toFixed(1)}" opacity="${(0.4 + (i % 4) * 0.15).toFixed(2)}"/>`; }) + `</g>`;
    const ringP = (cx, cy, r, c) => `<g fill="${c}">` + loop(18, i => { const a = i * 0.349; return `<circle cx="${(cx + Math.cos(a) * r).toFixed(1)}" cy="${(cy + Math.sin(a) * r).toFixed(1)}" r="${(0.6 + (i % 3) * 0.5).toFixed(1)}" opacity="${(0.5 + (i % 3) * 0.16).toFixed(2)}"/>`; }) + `</g>`;
    const blinds = c => `<g fill="${c}">` + loop(9, i => `<rect x="0" y="${22 + i * 27}" width="200" height="10" opacity=".13"/>`) + `</g>`;

    switch (kind) {
      // 재벌집 비밀 계약 — luxe penthouse night: floor-to-ceiling window, city bokeh,
      // chandelier glow + volumetric light, a couple (suit + red gown), floor reflection
      case 'penthouse': {
        // man — shifted to lower-LEFT so he flanks the centred play button
        const man = `<g transform="translate(-34 4)">
          <g fill="#070405">
            <ellipse cx="84" cy="151" rx="6.8" ry="8"/>
            <path d="M84 159q-2.4 0-2.4 2.4v3.4q2.4 1.7 4.8 0v-3.4q0-2.4-2.4-2.4Z"/>
            <path d="M72 182q12-10 24 0l-2.4 12q-9.6-6-19.2 0Z"/>
            <path d="M71 188q13-9 26 0l-3 72h-6.5l-3.5-44-3.5 44h-6.5Z"/></g>
          <path d="M95 184c3 12 4 34 3 74" stroke="#ffc2a6" stroke-width="1.1" fill="none" opacity=".6"/>
          <path d="M79 146q5-6 11 0q-2 3-5.5 3.4q-3.5-.4-5.5-3.4Z" fill="#ffd2b0" opacity=".5"/></g>`;
        // woman in a red gown — shifted to lower-RIGHT
        const woman = `<g transform="translate(40 4)">
          <g fill="#0a0608"><ellipse cx="115" cy="152" rx="6" ry="7"/><path d="M109 149q6-6.5 12 0q-3-3-12 0Z"/>
            <path d="M115 159q-1.9 0-1.9 1.9v3q1.9 1.4 3.8 0v-3q0-1.9-1.9-1.9Z"/></g>
          <path d="M107 177q8-9 16 0l-2 9.5q-6-3.6-12 0Z" fill="#6a0d1a"/>
          <path d="M109 185q6-3.6 12 0l9.5 75h-31Z" fill="#6a0d1a"/>
          <path d="M109 185q6-3.6 12 0l2 13q-8-3.8-16 0Z" fill="#42060f"/>
          <path d="M122 186q4 20 8 38" stroke="#c43a52" stroke-width="1" fill="none" opacity=".7"/>
          <path d="M110 147q5-5 10 0q-1.6 2.6-5 3q-3.4-.4-5-3Z" fill="#ffd0ae" opacity=".5"/></g>`;
        const couple = man + woman;
        const glasses = `<g stroke="#ffcaa0" stroke-width=".9" fill="none" opacity=".7"><path d="M100 250v6m0-6q-2.6 0-2.6-2.4h5.2q0 2.4-2.6 2.4Z"/><path d="M107 249v6m0-6q-2.6 0-2.6-2.4h5.2q0 2.4-2.6 2.4Z"/></g>`;
        return wrap(
          lg(u + 'b', st(0, '#3a0e18') + st(.5, '#1a0708') + st(1, '#070304')) +
          cone(u + 'c', '#ffd49a') +
          rg(u + 'gl', 150, 64, 120, st(0, '#ffcf8a', .5) + st(1, '#ffcf8a', 0)) +
          rg(u + 'bk', 100, 226, 132, st(0, '#ff9a64', .3) + st(1, '#ff9a64', 0)) +
          `<clipPath id="${u}win"><rect x="12" y="18" width="176" height="246" rx="2"/></clipPath>`,
          bg(u + 'b') +
          // city skyline + bokeh seen through the glass
          `<g clip-path="url(#${u}win)">` + skyline('#0a0507') + winRows('#ffc488') +
            bokeh(['#ffb877', '#ff8a9e', '#ffd9a0', '#8ab4ff']) + `</g>` +
          // window mullions
          `<g stroke="#160b0e" stroke-width="2.4" fill="none"><rect x="12" y="18" width="176" height="246" rx="2"/><line x1="70" y1="18" x2="70" y2="264"/><line x1="130" y1="18" x2="130" y2="264"/><line x1="12" y1="92" x2="188" y2="92"/></g>` +
          // chandelier warm wash + volumetric cone + flare
          `<rect width="200" height="300" fill="url(#${u}c)"/><circle cx="150" cy="64" r="58" fill="url(#${u}gl)"/>` + flare(150, 62, '#ffe6bf') +
          // glossy floor + warm floor wash that separates the silhouettes
          `<rect x="0" y="262" width="200" height="38" fill="#0a0406"/><rect x="0" y="262" width="200" height="1.5" fill="#ffcaa0" opacity=".12"/>` +
          `<ellipse cx="100" cy="228" rx="132" ry="62" fill="url(#${u}bk)"/>` +
          // reflection of the couple on the glossy floor
          `<g transform="translate(0 528) scale(1 -1)" opacity=".14">${couple}</g>` +
          // side table + wine glasses, then the couple
          `<rect x="86" y="252" width="34" height="10" rx="3" fill="#0c0608"/>` + glasses + couple +
          // cinematic crimson grade
          `<rect width="200" height="300" fill="#5a0a14" opacity=".08"/>`);
      }
      // 복수의 여왕 — woman in red, spotlight, shattered glass, smoke
      case 'revenge': return wrap(
        lg(u + 'b', st(0, '#0a1626') + st(.55, '#0a0d18') + st(1, '#05060c')) + rg(u + 's', 100, 20, 150, st(0, '#cfe2ff', .3) + st(1, '#cfe2ff', 0)),
        bg(u + 'b') + `<rect width="200" height="300" fill="url(#${u}s)"/>` +
        `<g fill="#7a0010" opacity=".5" filter="url(#${u}bl)"><ellipse cx="100" cy="250" rx="90" ry="26"/></g>` +
        `<g fill="#b3122a" opacity=".7">` + loop(9, i => { const x = (i * 43 + 12) % 188, y = (i * 67) % 150 + 24, s = 4 + (i % 3) * 4; return `<path d="M${x} ${y} l${s} ${-s * 1.6} l${s * .7} ${s * 2.1} Z" opacity="${(0.3 + (i % 3) * 0.2).toFixed(2)}"/>`; }) + `</g>` +
        figF(86, 138, 1.95, '#0a0710') +
        `<path d="M88 175c-3 16-3 50 0 92h28c3-42 3-76 0-92z" fill="#8c0f22" opacity=".55"/>` +
        flare(100, 40, '#dfeaff'));
      // 계약직 신데렐라 — warm golden, office tower, lone hopeful figure, sparkle
      case 'cinderella': return wrap(
        lg(u + 'b', st(0, '#3a2406') + st(.5, '#7a3b18') + st(1, '#2a0f10')) + rg(u + 'g', 130, 70, 120, st(0, '#ffe4a8', .7) + st(1, '#ffe4a8', 0)),
        bg(u + 'b') + `<rect width="200" height="300" fill="url(#${u}g)"/>` + bokeh(['#ffe6b0', '#ffd27a', '#fff0d0']) +
        skyline('#1a0f08') + winRows('#ffe0a0') +
        ringP(132, 70, 22, '#fff3cf') + flare(132, 70, '#ffe6b0') +
        figF(86, 158, 1.5, '#1c0c08') +
        `<path d="M92 192c-2 12-2 40 0 70h18c2-30 2-58 0-70z" fill="#ffcf8a" opacity=".4"/>`);
      // 늑대의 유혹 — neon street, two figures, wet reflection
      case 'neonstreet': return wrap(
        lg(u + 'b', st(0, '#1a0b40') + st(.55, '#180a2e') + st(1, '#0a0518')),
        bg(u + 'b') + bokeh(['#ff4fa3', '#36e0ff', '#b06bff']) +
        `<g opacity=".8"><rect x="20" y="70" width="34" height="6" rx="3" fill="#ff4fa3"/><rect x="150" y="56" width="30" height="6" rx="3" fill="#36e0ff"/><rect x="158" y="96" width="20" height="5" rx="2" fill="#ffd24a"/></g>` +
        `<g filter="url(#${u}bl)" opacity=".5"><rect x="20" y="68" width="34" height="10" fill="#ff4fa3"/><rect x="150" y="54" width="30" height="10" fill="#36e0ff"/></g>` +
        skyline('#0c0620') +
        figM(78, 150, 1.6, '#070313') + figF(112, 156, 1.42, '#070313') +
        `<rect x="0" y="252" width="200" height="48" fill="#0a0518"/><g opacity=".18"><rect x="20" y="252" width="34" height="48" fill="#ff4fa3"/><rect x="150" y="252" width="30" height="48" fill="#36e0ff"/></g>`);
      // 황제의 아침 — sunrise palace, hanbok figure, mist, crane
      case 'palace': return wrap(
        lg(u + 'b', st(0, '#ffb15a') + st(.4, '#b85a2a') + st(1, '#2a1206')) + rg(u + 'm', 100, 78, 70, st(0, '#fff1c8', .95) + st(1, '#fff1c8', 0)),
        bg(u + 'b') + `<circle cx="100" cy="80" r="40" fill="url(#${u}m)"/><circle cx="100" cy="80" r="20" fill="#fff3d2"/>` +
        `<g fill="#3a1c08" opacity=".85"><path d="M-10 236 56 168l64 68z"/><path d="M70 244 140 174l80 62z"/></g>` +
        `<g fill="#1c0d04"><path d="M30 252c26-22 114-22 140 0l-10 9H40z"/><path d="M58 232c18-15 66-15 84 0l-8 8H66z"/><rect x="96" y="214" width="8" height="20"/></g>` +
        `<g stroke="#2a1206" stroke-width="1.4" fill="none" opacity=".6"><path d="M150 120c8-4 14-2 18 3"/><path d="M150 120c-2-8 1-14 6-18"/></g>` +
        `<g fill="#fff1c8" opacity=".1"><ellipse cx="100" cy="256" rx="140" ry="14"/><ellipse cx="70" cy="276" rx="140" ry="12"/></g>` +
        figF(90, 196, 1.1, '#1c0d04'));
      // 이혼 후, 우리 — rain, two figures apart, umbrellas, reflection
      case 'rainpart': return wrap(
        lg(u + 'b', st(0, '#0e2236') + st(.6, '#081626') + st(1, '#040b14')),
        bg(u + 'b') + `<circle cx="100" cy="54" r="30" fill="#bcd6ff" opacity=".14"/>` + rain() +
        `<path d="M40 168a22 12 0 0 1 44 0z" fill="#243a52"/><path d="M62 168v34" stroke="#101c28" stroke-width="2"/>` + figM(54, 196, 1.05, '#05101c') +
        `<path d="M120 176a20 11 0 0 1 40 0z" fill="#3a2330"/><path d="M140 176v30" stroke="#101c28" stroke-width="2"/>` + figF(132, 200, .95, '#05101c') +
        `<rect x="0" y="252" width="200" height="48" fill="#06121f"/><g opacity=".06" fill="#bcd6ff"><rect x="48" y="252" width="30" height="48"/><rect x="128" y="252" width="26" height="48"/></g>`);
      // 악녀는 두 번 산다 — regression, hourglass + portal swirl
      case 'hourglass': return wrap(
        lg(u + 'b', st(0, '#3a1252') + st(.6, '#1e0a34') + st(1, '#0c0418')) + rg(u + 'o', 100, 132, 78, st(0, '#ff8af0', .9) + st(.5, '#a23bd6', .45) + st(1, '#a23bd6', 0)),
        bg(u + 'b') + `<circle cx="100" cy="132" r="80" fill="url(#${u}o)"/>` + ringP(100, 132, 56, '#ffc8f6') + ringP(100, 132, 30, '#ffe0fb') +
        `<g fill="#ffe9fb" opacity=".9"><path d="M88 104h24l-12 26z"/><path d="M88 160h24l-12-26z"/><rect x="86" y="101" width="28" height="4" rx="2"/><rect x="86" y="157" width="28" height="4" rx="2"/></g>` +
        figF(86, 168, 1.35, '#0c0418'));
      // 비밀의 정원 — night garden gate, fog, lantern
      case 'garden': return wrap(
        lg(u + 'b', st(0, '#0a2e2a') + st(.6, '#061a1c') + st(1, '#030d0e')),
        bg(u + 'b') + `<circle cx="62" cy="96" r="6" fill="#ffe6a0"/><circle cx="62" cy="96" r="30" fill="#ffe6a0" opacity=".14" filter="url(#${u}bl)"/>` +
        `<g fill="none" stroke="#04201d" stroke-width="4"><path d="M70 300V120a30 30 0 0 1 60 0v180"/><line x1="100" y1="120" x2="100" y2="300"/><path d="M70 150h60M70 190h60M70 230h60"/></g>` +
        `<g stroke="#0a3a32" stroke-width="2" fill="none" opacity=".7"><path d="M70 280c-10-20-6-40 6-50"/><path d="M130 280c10-20 6-40-6-50"/></g>` +
        figF(92, 192, 1.1, '#021310') +
        `<g fill="#bff5e0" opacity=".07"><ellipse cx="100" cy="252" rx="140" ry="16"/><ellipse cx="66" cy="276" rx="140" ry="14"/></g>`);
      // 회장님의 숨은 아들 — corporate boardroom, window, lone figure
      case 'boardroom': return wrap(
        lg(u + 'b', st(0, '#0c1830') + st(.6, '#081020') + st(1, '#040810')) + rg(u + 'g', 100, 110, 120, st(0, '#3a6aa0', .35) + st(1, '#3a6aa0', 0)),
        bg(u + 'b') + `<rect width="200" height="300" fill="url(#${u}g)"/>` + winRows('#ffcf7a') + skyline('#0a1020') +
        `<g stroke="#0a1428" stroke-width="6" fill="none"><rect x="34" y="26" width="132" height="210"/></g><line x1="100" y1="26" x2="100" y2="236" stroke="#0a1428" stroke-width="3"/><line x1="34" y1="130" x2="166" y2="130" stroke="#0a1428" stroke-width="3"/>` +
        `<rect x="20" y="244" width="160" height="10" rx="3" fill="#0a1018"/>` +
        figM(86, 150, 1.7, '#02060d'));
      // 시한부 로맨스 — cherry blossom, soft, couple, petals
      case 'petals': return wrap(
        lg(u + 'b', st(0, '#3a2240') + st(.5, '#4a2a48') + st(1, '#1a1020')) + rg(u + 'g', 100, 70, 120, st(0, '#ffd6e6', .6) + st(1, '#ffd6e6', 0)),
        bg(u + 'b') + `<rect width="200" height="300" fill="url(#${u}g)"/>` + bokeh(['#ffd6e6', '#ffe9c8', '#ffffff']) +
        `<g stroke="#2a1622" stroke-width="5" fill="none"><path d="M-10 70c40 6 70 0 100 30s60 20 120 6"/></g>` +
        petals('#ffc2d8') +
        figM(72, 168, 1.32, '#150b14') + figF(104, 170, 1.24, '#150b14') +
        flare(150, 56, '#ffe9c8'));
      // 가짜 약혼자 — warm romance, ring sparkle
      case 'ring': return wrap(
        lg(u + 'b', st(0, '#4a1422') + st(.5, '#2a0c14') + st(1, '#0e0508')) + rg(u + 'g', 110, 90, 110, st(0, '#ffd0a0', .6) + st(1, '#ffd0a0', 0)),
        bg(u + 'b') + `<rect width="200" height="300" fill="url(#${u}g)"/>` + bokeh(['#ffb877', '#ff96a8', '#ffe0c0']) +
        `<g fill="none" stroke="#ffe6b0" stroke-width="3"><circle cx="112" cy="96" r="16"/></g><path d="M112 80l3 10h-6z" fill="#fff"/>` + flare(112, 80, '#fff3cf') + ringP(112, 96, 26, '#ffe6b0') +
        figF(80, 162, 1.4, '#160708') + figM(108, 160, 1.42, '#160708'));
      // 폭군의 비서 — dramatic red/black office, blinds, figure at desk
      case 'redoffice': return wrap(
        lg(u + 'b', st(0, '#2a0810') + st(.55, '#16060a') + st(1, '#080203')) + rg(u + 'g', 150, 60, 130, st(0, '#ff3a4f', .4) + st(1, '#ff3a4f', 0)),
        bg(u + 'b') + `<rect width="200" height="300" fill="url(#${u}g)"/>` + blinds('#ff5a6e') +
        `<rect x="18" y="232" width="120" height="12" rx="2" fill="#0a0305"/><rect x="30" y="244" width="6" height="40" fill="#0a0305"/><rect x="120" y="244" width="6" height="40" fill="#0a0305"/>` +
        figM(120, 150, 1.7, '#050203') + flare(160, 58, '#ff8a96'));
      // 천 번째 환생 — cosmic portal, stars, reaching figure
      case 'cosmic': return wrap(
        lg(u + 'b', st(0, '#10123a') + st(.55, '#0a0a26') + st(1, '#050414')) + rg(u + 'o', 100, 120, 80, st(0, '#9ad8ff', .85) + st(.5, '#5a6bff', .4) + st(1, '#5a6bff', 0)),
        bg(u + 'b') + stars(26, '#cfe0ff') + `<circle cx="100" cy="120" r="80" fill="url(#${u}o)"/>` + ringP(100, 120, 52, '#bfe0ff') + ringP(100, 120, 34, '#e6f0ff') +
        figF(86, 160, 1.4, '#06061a'));
      // 사장님은 내 전남편 — bright comedy office, confetti, couple
      case 'comedyoffice': return wrap(
        lg(u + 'b', st(0, '#ff9d5c') + st(.5, '#e0513f') + st(1, '#6a1020')) + rg(u + 's', 100, 70, 130, st(0, '#fff0c0', .8) + st(1, '#fff0c0', 0)),
        bg(u + 'b') + `<rect width="200" height="300" fill="url(#${u}s)"/>` + winRows('#fff0c0') +
        `<g>` + loop(14, i => `<rect x="${14 + i * 13}" y="${28 + (i % 5) * 15}" width="4" height="8" rx="1" transform="rotate(${i * 40} ${16 + i * 13} ${32 + (i % 5) * 15})" fill="${['#fff0c0', '#ffd27a', '#ffe6ea', '#ffffff'][i % 4]}" opacity=".8"/>`) + `</g>` +
        figF(64, 160, 1.46, '#3a0810') + figM(100, 158, 1.5, '#3a0810'));
      // 그날의 살인 — noir, blinds, blood, lone figure
      case 'noir': return wrap(
        lg(u + 'b', st(0, '#0a0f16') + st(.6, '#06090f') + st(1, '#030406')),
        bg(u + 'b') + blinds('#9fc4ff') +
        `<g fill="#7a0010" opacity=".55" filter="url(#${u}bl)"><ellipse cx="92" cy="262" rx="60" ry="14"/></g>` +
        figM(82, 134, 1.95, '#02040a') +
        `<path d="M100 250 66 300h70z" fill="#02040a" opacity=".5"/>` + flare(150, 50, '#9fc4ff'));
      // 달빛 아래 계약 — blue night, big moon, palace, figure
      case 'moonpalace': return wrap(
        lg(u + 'b', st(0, '#0c2150') + st(.5, '#0a1430') + st(1, '#050a18')) + rg(u + 'm', 132, 72, 60, st(0, '#eaf2ff', .95) + st(1, '#eaf2ff', 0)),
        bg(u + 'b') + `<circle cx="132" cy="72" r="34" fill="url(#${u}m)"/><circle cx="132" cy="72" r="22" fill="#eef4ff"/><circle cx="124" cy="66" r="22" fill="#0a1430" opacity=".25"/>` + stars(18, '#cfe0ff') +
        `<g fill="#060c1c"><path d="M30 254c26-22 114-22 140 0l-10 9H40z"/><path d="M58 234c18-15 66-15 84 0l-8 8H66z"/></g>` +
        `<g fill="#dfeaff" opacity=".08"><ellipse cx="100" cy="258" rx="140" ry="13"/></g>` +
        figF(90, 198, 1.08, '#060c1c') + `<path d="M94 222c-2 10-2 40 0 62h12c2-22 2-52 0-62z" fill="#a9c4ff" opacity=".3"/>`);
      default: return wrap(lg(u + 'b', st(0, '#3a0a14') + st(1, '#070304')), bg(u + 'b'));
    }
  }

  const posterHTML = (d, rank, uid) => `
    <article class="poster ${rank ? 'rank' : ''}" title="${d.t}" tabindex="0">
      <div class="art">${scene(d.k, uid)}<img class="poster-img" src="assets/posters/${d.k}.jpg" alt="${d.t}" loading="lazy" onerror="this.remove()"></div><div class="grad"></div>
      ${rank ? `<span class="num">${rank}</span>` : ''}
      <div class="top">
        <span class="ep">${d.ep}</span>
        <span class="free">무료</span>
      </div>
      <div class="playover"><span class="playbtn"></span></div>
      <div class="body">
        <span class="genre"><svg class="icon"><use href="#i-clap"/></svg> ${d.g}</span>
        <div class="ttl">${d.t}</div>
        <div class="meta"><svg class="icon fill" style="color:#ffcf4a"><use href="#i-star"/></svg> ${d.r}<span class="msep">·</span><svg class="icon fill"><use href="#i-play"/></svg> ${d.v}<span class="msep">·</span><span style="color:#ff9aa6">+XONT</span></div>
      </div>
    </article>`;

  const railTop = $('#rail-top'), railNew = $('#rail-new');
  if (railTop) railTop.innerHTML = TOP10.map((d, i) => posterHTML(d, i + 1, 't' + i)).join('');
  if (railNew) railNew.innerHTML = NEWS.map((d, i) => posterHTML(d, 0, 'n' + i)).join('');

  $$('.poster').forEach(p => p.addEventListener('click', () =>
    toast(`"${p.getAttribute('title')}" — 2026년 9월 정식 가동 시 시청할 수 있습니다`)));

  /* hero cinematic poster wall (faint, real film stills) */
  const wall = $('#poster-wall');
  if (wall) {
    const wk = ['penthouse', 'revenge', 'palace', 'neonstreet', 'hourglass', 'garden', 'petals', 'boardroom', 'cosmic', 'moonpalace', 'redoffice', 'cinderella'];
    wall.innerHTML = wk.map((k, i) => `<i>${scene(k, 'w' + i)}</i>`).join('');
  }
  /* hero phone mockup — SVG film still sits BEHIND an optional AI photo overlay
     (the <img> in markup; if it fails to load it removes itself → SVG shows) */
  const psScene = $('#ps-scene');
  if (psScene) psScene.insertAdjacentHTML('afterbegin', scene('penthouse', 'ph'));

  /* =========================================================
     3. REVEAL on scroll (robust scroll-scan, no IntersectionObserver)
        Content is visible by default; .has-js enables the fade-in, and a
        safety net reveals everything after 3s so nothing can stay hidden.
     ========================================================= */
  document.documentElement.classList.add('has-js');
  const reveals = $$('.reveal');
  reveals.forEach((el, i) => { el.style.transitionDelay = (i % 3) * 70 + 'ms'; });

  const barsBox = $('#cpm-bars');
  if (barsBox) $$('.bar', barsBox).forEach(b => (b.style.height = '0px'));
  let barsDone = false;
  let countHook = null;             // assigned once dashboard state exists

  function revealScan() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(el => {
      if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.9)
        el.classList.add('in');
    });
    if (barsBox && !barsDone && barsBox.getBoundingClientRect().top < vh * 0.85) {
      barsDone = true;
      $$('.bar', barsBox).forEach(b => (b.style.height = (Number(b.dataset.h) / 100 * 200) + 'px'));
    }
    if (countHook) countHook(vh);
  }
  revealScan();
  window.addEventListener('scroll', revealScan, { passive: true });
  window.addEventListener('resize', revealScan);
  window.addEventListener('load', revealScan);
  setTimeout(revealScan, 500);
  setTimeout(() => reveals.forEach(el => el.classList.add('in')), 3000);  // safety net

  /* =========================================================
     DASHBOARD — live demo data (runs only on dashboard.html)
     ========================================================= */
  if (document.body.dataset.page === 'dashboard') {
  const state = {
    xont: 12480.55,        // available wallet balance
    myNodes: 5,
    totalNodes: 2188,      // sold of 3,000 (1st batch)
    pool: 182400,          // node pool USD this month (so far)
    poolRate: 4.6,         // pool $/sec
    viewers: 312840,       // concurrent viewers
    streams: 41920,        // concurrent streams
    content: 8463,
    subs: 2184300,
    advertisers: 1286,
    adRevTotal: 4218500,   // cumulative ad revenue
    tonxToday: 4218600,    // 오늘 시청자 전체 TONX 채굴량 (≡ 노드풀 XONT 발행량, 1:1 미러)
    tonxTotal: 1284500000, // 누적 TONX 채굴 (총 발행 한도 100억 대비)
    stakes: [
      { amt: 2000, mo: 6,  apy: 15, reward: 31.84 },
      { amt: 1000, mo: 12, apy: 24, reward: 58.10 },
    ],
    nodes: [],
    // 내가 추천한 노드 사업자 (2단계) — 1단계 직접 추천, 2단계는 1단계가 추천
    referrals: [
      { name: '김민준', addr: 'EQAb…3kT', tier: 1, nodes: 8,  reward: 4218.5 },
      { name: '최예나', addr: 'UQC7…9xR', tier: 1, nodes: 12, reward: 6531.2 },
      { name: '이서연', addr: 'EQDe…1mP', tier: 1, nodes: 5,  reward: 2740.8 },
      { name: '박지후', addr: 'UQF2…7kL', tier: 1, nodes: 3,  reward: 1602.3 },
      { name: '정도윤', addr: 'EQGh…4nQ', tier: 2, nodes: 6,  reward: 980.4 },
      { name: '오시우', addr: 'UQK9…2vT', tier: 2, nodes: 4,  reward: 651.7 },
      { name: '한소율', addr: 'EQLm…8wC', tier: 2, nodes: 2,  reward: 326.1 },
    ],
  };
  // 노드는 균등 채굴(÷N) — 현재 채굴 속도는 모두 같고, 누적은 가동 시점에 따라 다름
  const nodeSeed = [9820, 7640, 5210, 3180, 1290];
  for (let i = 1; i <= state.myNodes; i++)
    state.nodes.push({ id: i, x: nodeSeed[i - 1] ?? rand(1000, 9000) });

  const share        = () => state.myNodes / state.totalNodes;     // pool fraction
  // ----- TONX → XONT 미러 채굴 모델 -----
  const viewerRate   = () => state.viewers * VIEWER_MINT;          // 전체 시청자 TONX 채굴 / s
  const perNodeRate  = () => viewerRate() / state.totalNodes;      // 노드 1개 XONT 채굴 / s (÷N 균등)
  const myRate       = () => perNodeRate() * state.myNodes;        // 내 지갑 XONT 채굴 / s
  const perNodeToday = () => state.tonxToday / state.totalNodes;   // 노드 1개 오늘 채굴 (÷N)
  // 추천 보상 적립 속도(/s): 피추천자 노드의 XONT 채굴에서 1·2단계 비율 환원
  const refRate = r => (r.tier === 1 ? REF1_PCT : REF2_PCT) * r.nodes * perNodeRate();

  /* ---- count-up intro for big metrics ---- */
  function countUp(el, target, dur = 1400, pre = '', suf = '') {
    if (!el) return;
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const p = clamp((now - start) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(from + (target - from) * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* =========================================================
     6. DASHBOARD RENDER + LIVE TICK
     ========================================================= */
  // per-node list
  function renderNodes() {
    const box = $('#node-list'); if (!box) return;
    box.innerHTML = state.nodes.map(n => `
      <div class="noderow">
        <div class="li">
          <div class="nidx"><svg class="icon"><use href="#i-zap"/></svg></div>
          <div><div class="ni">Node #${String(n.id).padStart(3, '0')}</div><div class="ns">스트리밍 송출 정상</div></div>
        </div>
        <div class="nr">
          <div class="nx" id="nx-${n.id}">${fmt2(n.x)} <span class="u">XONT</span></div>
          <div class="mining"><span class="sdot"></span> 채굴중 +<span id="nrate-${n.id}">${perNodeRate().toFixed(3)}</span>/s</div>
        </div>
      </div>`).join('');
    const tag = $('#node-count-tag'); if (tag) tag.textContent = state.myNodes + '개 노드';
  }

  /* ---- 추천 네트워크 (2단계) 렌더 ---- */
  function renderReferrals() {
    const box = $('#ref-list'); if (!box) return;
    box.innerHTML = state.referrals.map((r, i) => `
      <div class="refrow">
        <div class="li">
          <div class="ridx b${r.tier}">${r.tier}</div>
          <div>
            <div class="rn">${r.name} <span class="rmask">${r.addr}</span></div>
            <div class="rs2"><span class="badge-sm b${r.tier}">${r.tier}단계</span> · 노드 ${r.nodes}개</div>
          </div>
        </div>
        <div class="rr">
          <div class="rx">+<span id="rfr-${i}">${fmt2(r.reward)}</span> <span class="u">XONT</span></div>
          <div class="rl2">내 보상 적립</div>
        </div>
      </div>`).join('');
  }

  /* ---- TONX → XONT 미러 채굴 패널 페인트 ---- */
  function paintMirror() {
    const today = state.tonxToday, pn = perNodeToday();
    $('#tonx-today')        && ($('#tonx-today').textContent        = fmt(today));
    $('#xont-pool-today')   && ($('#xont-pool-today').textContent   = fmt(today));        // 1:1 미러
    $('#tonx-mined-total')  && ($('#tonx-mined-total').textContent  = fmt(state.tonxTotal));
    const pct = state.tonxTotal / TONX_SUPPLY * 100;
    $('#tonx-supply-pct')   && ($('#tonx-supply-pct').textContent   = pct.toFixed(3) + '%');
    $('#tonx-supply-bar')   && ($('#tonx-supply-bar').style.width   = clamp(pct, 0, 100) + '%');
    $('#mirror-total-nodes')&& ($('#mirror-total-nodes').textContent= fmt(state.totalNodes));
    $('#mirror-mynodes')    && ($('#mirror-mynodes').textContent    = state.myNodes);
    $('#pernode-day')       && ($('#pernode-day').innerHTML         = fmt2(pn) + ' <span class="u">XONT</span>');
    $('#my-mine-day')       && ($('#my-mine-day').innerHTML         = fmt2(pn * state.myNodes) + ' <span class="u">XONT</span>');
  }

  /* ---- 추천 보상 요약 + 행별 적립 페인트 ---- */
  function paintReferrals() {
    let p1 = 0, n1 = 0, w1 = 0, p2 = 0, n2 = 0, w2 = 0;
    state.referrals.forEach((r, i) => {
      if (r.tier === 1) { p1++; n1 += r.nodes; w1 += r.reward; }
      else              { p2++; n2 += r.nodes; w2 += r.reward; }
      const el = $('#rfr-' + i); if (el) el.textContent = fmt2(r.reward);
    });
    const total = w1 + w2;
    $('#r1-people') && ($('#r1-people').textContent = p1 + '명');
    $('#r1-nodes')  && ($('#r1-nodes').textContent  = fmt(n1) + '개');
    $('#r1-reward') && ($('#r1-reward').textContent = fmt2(w1) + ' XONT');
    $('#r2-people') && ($('#r2-people').textContent = p2 + '명');
    $('#r2-nodes')  && ($('#r2-nodes').textContent  = fmt(n2) + '개');
    $('#r2-reward') && ($('#r2-reward').textContent = fmt2(w2) + ' XONT');
    $('#ref-total-x')   && ($('#ref-total-x').textContent   = fmt2(total));
    $('#ref-total-usd') && ($('#ref-total-usd').textContent = '≈ $' + fmt2(total * XONT_PRICE) + ' · 익월 10일 지급');
    $('#ref-people-count') && ($('#ref-people-count').textContent = (p1 + p2) + '명 · 노드 ' + fmt(n1 + n2) + '개');
  }

  // live streaming list
  const STREAMS = [
    { t: '재벌집 비밀 계약 · EP.7', v: 18420 },
    { t: '복수의 여왕 · EP.12',     v: 15310 },
    { t: '계약직 신데렐라 · EP.5',  v: 12880 },
    { t: '늑대의 유혹 · EP.9',      v: 10240 },
    { t: '황제의 아침 · EP.3',      v: 8650  },
  ];
  function renderStreams() {
    const box = $('#stream-list'); if (!box) return;
    box.innerHTML = STREAMS.map((s, i) => `
      <div class="noderow">
        <div class="li">
          <div class="nidx"><svg class="icon fill"><use href="#i-play"/></svg></div>
          <div><div class="ni">${s.t}</div><div class="ns" style="color:#5ee08a"><span class="sdot"></span> LIVE 송출 중</div></div>
        </div>
        <div class="nr">
          <div class="nx" id="sv-${i}">${fmt(s.v)}</div>
          <div class="mining" style="color:#7f858f">동시 시청</div>
        </div>
      </div>`).join('');
  }

  // active stakes
  function renderStakes() {
    const box = $('#stake-list'); if (!box) return;
    if (!state.stakes.length) { box.innerHTML = `<div style="color:#7f858f;font-size:13px;padding:6px 2px">진행 중인 스테이킹이 없습니다.</div>`; return; }
    box.innerHTML = state.stakes.map((s, i) => `
      <div class="stkrow">
        <div><div class="a">${fmt2(s.amt)} XONT</div><div class="b">${s.mo}개월 락업 · ${s.apy}% APY</div></div>
        <div class="reward"><div class="rv" id="sr-${i}">+${fmt2(s.reward)}</div><div class="rl">적립 보상</div></div>
      </div>`).join('');
  }

  renderNodes(); renderStreams(); renderStakes(); renderReferrals();
  paintMirror(); paintReferrals();

  // initial count-up for platform metrics — triggered by the scroll scan
  let counted = false;
  const metricsBox = $('.metrics');
  countHook = (vh) => {
    if (counted || !metricsBox) return;
    if (metricsBox.getBoundingClientRect().top > vh * 0.92) return;
    counted = true;
    countUp($('#m-viewers'), state.viewers);
    countUp($('#m-stream'),  state.streams);
    countUp($('#m-content'), state.content);
    countUp($('#m-subs'),    state.subs);
    countUp($('#m-adv'),     state.advertisers);
    countUp($('#m-adrev'),   state.adRevTotal, 1400, '$');
  };
  revealScan();   // re-scan now that the hook is wired

  // refresh balances across wallet/stake/transfer
  function refreshBalances() {
    const b = state.xont;
    $('#xont-bal') && ($('#xont-bal').textContent = fmt2(b));
    $('#xont-usd') && ($('#xont-usd').textContent = '≈ $' + fmt2(b * XONT_PRICE));
    $('#stake-bal') && ($('#stake-bal').textContent = fmt2(b));
    $('#xfer-bal') && ($('#xfer-bal').textContent = fmt2(b));
  }
  $('#xont-rate') && ($('#xont-rate').textContent = myRate().toFixed(2));
  refreshBalances();

  /* ---- the live heartbeat (every 120ms) ---- */
  let tick = 0;
  setInterval(() => {
    tick++;
    const dt = 0.12;

    // platform metrics jitter (trend up) — 시청자 수가 채굴량을 견인
    state.viewers   = clamp(state.viewers + rand(-90, 140), 280000, 999999);
    state.streams   = clamp(state.streams + rand(-30, 45), 38000, 99999);
    state.adRevTotal += rand(8, 26);
    if (Math.random() < 0.03) state.subs += Math.round(rand(1, 6));
    if (Math.random() < 0.01) state.advertisers += 1;
    if (Math.random() < 0.006) state.content += 1;
    if (Math.random() < 0.008 && state.totalNodes < 3000) state.totalNodes += 1;

    // ---- TONX → XONT 미러 채굴 ----
    const vr = viewerRate(), pnr = perNodeRate();
    state.tonxToday += vr * dt;          // 시청자 오늘 채굴 TONX (= 노드풀 XONT 발행, 1:1)
    state.tonxTotal += vr * dt;          // 누적 채굴 (총 발행 한도 대비)
    state.xont      += myRate() * dt;    // 내 지갑 = 노드 1개 채굴(÷N) × 내 노드 수

    // node pool + my share accrual (USD 매출 분배: 구독+광고 10%)
    state.pool += state.poolRate * dt;
    const mine = state.pool * share();

    // per-node mined — 모든 노드 동일 속도(÷N), 누적만 다름
    state.nodes.forEach(n => {
      n.x += pnr * dt;
      const el = $('#nx-' + n.id); if (el) el.firstChild.textContent = fmt2(n.x) + ' ';
      const rl = $('#nrate-' + n.id); if (rl) rl.textContent = pnr.toFixed(3);
    });

    // ---- 추천 보상 적립 (1단계 10% · 2단계 3%) ----
    state.referrals.forEach(r => { r.reward += refRate(r) * dt; });

    // stream viewers jitter
    STREAMS.forEach((s, i) => { s.v = clamp(s.v + rand(-40, 55), 2000, 99999); const el = $('#sv-' + i); if (el) el.textContent = fmt(s.v); });

    // stake rewards accrue (accelerated: 1s ≈ 1h for demo visibility)
    state.stakes.forEach((s, i) => { s.reward += s.amt * (s.apy / 100) / (365 * 24) * dt * 8; const el = $('#sr-' + i); if (el) el.textContent = '+' + fmt2(s.reward); });

    // paint (only after intro count-up to avoid clashing)
    if (counted) {
      $('#m-viewers') && ($('#m-viewers').textContent = fmt(state.viewers));
      $('#m-stream')  && ($('#m-stream').textContent  = fmt(state.streams));
      $('#m-subs')    && ($('#m-subs').textContent    = fmt(state.subs));
      $('#m-adv')     && ($('#m-adv').textContent     = fmt(state.advertisers));
      $('#m-content') && ($('#m-content').textContent = fmt(state.content));
      $('#m-adrev')   && ($('#m-adrev').textContent   = '$' + fmt(state.adRevTotal));
    }

    // my node panel
    $('#my-nodes')    && ($('#my-nodes').innerHTML   = state.myNodes + ' <span class="u">개</span>');
    $('#my-share')    && ($('#my-share').innerHTML   = (share() * 100).toFixed(3) + '<span class="u">%</span>');
    $('#total-nodes') && ($('#total-nodes').textContent = fmt(state.totalNodes));
    $('#my-accrue')   && ($('#my-accrue').textContent = fmt2(mine));
    $('#my-accrue-x') && ($('#my-accrue-x').textContent = fmt2(mine / XONT_PRICE));

    // donut + legend
    $('#donut-total') && ($('#donut-total').textContent = '$' + fmt(state.pool));
    $('#lg-ad')  && ($('#lg-ad').textContent  = '$' + fmt(state.pool * 0.62));
    $('#lg-sub') && ($('#lg-sub').textContent = '$' + fmt(state.pool * 0.24));
    $('#lg-tok') && ($('#lg-tok').textContent = '$' + fmt(state.pool * 0.14));
    $('#lg-mine') && ($('#lg-mine').textContent = '$' + fmt2(mine));

    // TONX→XONT 미러 채굴 · 추천 보상 · 내 채굴 속도
    paintMirror();
    paintReferrals();
    $('#xont-rate') && ($('#xont-rate').textContent = myRate().toFixed(2));

    // hero mirrors (throttled)
    if (tick % 5 === 0) {
      $('#hero-viewers') && ($('#hero-viewers').textContent = fmt(state.viewers));
      $('#hero-adrev')   && ($('#hero-adrev').textContent   = '$' + fmt(state.adRevTotal));
      $('#hero-remain')  && ($('#hero-remain').textContent  = fmt(3000 - state.totalNodes));
      $('#ps-coin')      && ($('#ps-coin').textContent      = fmt(1250 + (state.xont - 12480.55)));
      // wallet refresh (don't fight the user mid-typing)
      if (document.activeElement?.tagName !== 'INPUT') refreshBalances();
    }
  }, 120);

  /* =========================================================
     7. WALLET connect toggle
     ========================================================= */
  let connected = true;
  $('#connect-wallet')?.addEventListener('click', () => {
    connected = !connected;
    const btn = $('#connect-wallet'), id = $('#wallet-id');
    if (connected) { btn.innerHTML = '<svg class="icon"><use href="#i-check"/></svg> 지갑 연결됨'; btn.classList.add('btn-red'); id.textContent = 'EQ로 시작 · 지갑 연결됨'; toast('TON Connect · 지갑이 연결되었습니다'); }
    else { btn.textContent = '지갑 연결'; id.textContent = '연결 안 됨 — 클릭하여 연결'; toast('지갑 연결이 해제되었습니다', 'err'); }
  });
  const needWallet = () => { if (!connected) { toast('먼저 지갑을 연결하세요', 'err'); return true; } return false; };

  /* =========================================================
     8. STAKING form
     ========================================================= */
  let stakeTier = { mo: 6, apy: 15 };
  $$('#tiersel .tsel').forEach(b => b.addEventListener('click', () => {
    $$('#tiersel .tsel').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    stakeTier = { mo: +b.dataset.mo, apy: +b.dataset.apy };
    calcStake();
  }));
  const stakeAmt = $('#stake-amt');
  function calcStake() {
    const a = parseFloat(stakeAmt?.value) || 0;
    const est = a * (1 + (stakeTier.apy / 100) * (stakeTier.mo / 12));
    $('#stake-est') && ($('#stake-est').textContent = fmt2(est));
  }
  stakeAmt?.addEventListener('input', calcStake);
  $('#stake-max')?.addEventListener('click', () => { if (stakeAmt) { stakeAmt.value = Math.floor(state.xont); calcStake(); } });
  $('#stake-btn')?.addEventListener('click', () => {
    if (needWallet()) return;
    const a = parseFloat(stakeAmt.value) || 0;
    if (a <= 0) return toast('스테이킹 수량을 입력하세요', 'err');
    if (a > state.xont) return toast('보유 XONT가 부족합니다', 'err');
    state.xont -= a;
    state.stakes.unshift({ amt: a, mo: stakeTier.mo, apy: stakeTier.apy, reward: 0 });
    renderStakes(); refreshBalances();
    stakeAmt.value = ''; calcStake();
    toast(`${fmt2(a)} XONT 스테이킹 완료 · ${stakeTier.mo}개월 ${stakeTier.apy}% APY`);
  });

  /* =========================================================
     9. TRANSFER form
     ========================================================= */
  const xferAmt = $('#xfer-amt'), xferAddr = $('#xfer-addr');
  function calcXfer() {
    const a = parseFloat(xferAmt?.value) || 0;
    $('#xfer-receive') && ($('#xfer-receive').textContent = fmt2(a) + ' XONT');
  }
  xferAmt?.addEventListener('input', calcXfer);
  $('#xfer-max')?.addEventListener('click', () => { if (xferAmt) { xferAmt.value = Math.floor(state.xont); calcXfer(); } });
  $('#xfer-btn')?.addEventListener('click', () => {
    if (needWallet()) return;
    const a = parseFloat(xferAmt.value) || 0;
    const addr = (xferAddr.value || '').trim();
    if (!/^(EQ|UQ|0:)[A-Za-z0-9_\-]{10,}$/.test(addr)) return toast('올바른 톤체인 주소를 입력하세요 (EQ.../UQ...)', 'err');
    if (a <= 0) return toast('전송 수량을 입력하세요', 'err');
    if (a > state.xont) return toast('보유 XONT가 부족합니다', 'err');
    state.xont -= a;
    refreshBalances();
    xferAmt.value = ''; xferAddr.value = ''; calcXfer();
    toast(`${fmt2(a)} XONT 전송 완료 → ${addr.slice(0, 6)}…${addr.slice(-4)}`);
  });

  /* =========================================================
     10. REFERRAL — 코드/링크 복사
     ========================================================= */
  const copyText = (txt, ok) => {
    const done = () => toast(ok);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done));
    else fallbackCopy(txt, done);
  };
  function fallbackCopy(txt, cb) {
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) { /* noop */ }
    document.body.removeChild(ta); cb();
  }
  $('#ref-copy-code')?.addEventListener('click', () =>
    copyText($('#ref-code')?.textContent.trim() || '', '추천 코드를 복사했습니다'));
  $('#ref-copy-link')?.addEventListener('click', () =>
    copyText($('#ref-link')?.textContent.trim() || '', '추천 링크를 복사했습니다'));

  } /* ===== end: dashboard page only ===== */
})();
