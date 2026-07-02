/* ============================================================
   TonTV — shared site layout (injected on every page)
   Sprites · Nav (active state) · Footer · Deposit modal ·
   Toast · Scroll progress · Floating CTA. No dependencies.
   Loaded BEFORE app.js so page scripts can bind to injected DOM.
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // USDT 수령 공개 주소 — 유저가 둘 중 하나의 네트워크를 선택해 입금
  const CHAINS = {
    tron: {
      addr: 'TCEkL45cDG4MjGvmSab3zDfdnz8xeLYeVe',
      net: 'USDT · TRC20 (TRON)', sub: '반드시 트론(TRC20) 네트워크로만 전송하세요', short: 'TRON', code: 'TRC20',
      qr: 'assets/usdt-trc20-qr.svg', label: '입금 주소 (USDT · TRC20)',
      hint: '트론 지갑(예: TronLink · OKX · Binance)에서 QR을 스캔하고 <b>정확히 위 금액</b>의 USDT를 전송하세요.',
      warn: '<b>TRC20(트론) 네트워크의 USDT만</b> 보내세요. 다른 네트워크(ERC20·BEP20 등)로 전송 시 자산이 영구 소실될 수 있습니다.',
    },
    evm: {
      addr: '0xB5FCc21c74DA0850a6248aBbC23455A3Af4D7E2e',
      net: 'USDT · ERC20 / BEP20 (EVM)', sub: '이더리움(ERC20) 또는 BSC(BEP20) 네트워크로만 전송하세요', short: 'ETH · BSC', code: 'ERC20/BEP20',
      qr: 'assets/usdt-evm-qr.svg', label: '입금 주소 (USDT · ERC20 / BEP20)',
      hint: 'EVM 지갑(예: MetaMask · OKX · Binance)에서 QR을 스캔하고 <b>정확히 위 금액</b>의 USDT를 전송하세요.',
      warn: '<b>ERC20(이더리움) 또는 BEP20(BSC) 네트워크의 USDT만</b> 보내세요. 트론(TRC20) 등 다른 네트워크로 전송 시 자산이 영구 소실될 수 있습니다.',
    },
  };
  const NODE_PRICE = 1000;

  /* ---------------- shared markup ---------------- */
  const SPRITES = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
<symbol id="i-infinity" viewBox="0 0 24 24"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/></symbol>
<symbol id="i-crown" viewBox="0 0 24 24"><path d="M11.56 3.27a.5.5 0 0 1 .88 0l3 5.6a1 1 0 0 0 1.5.3l4.28-3.67a.5.5 0 0 1 .8.52l-2.84 10.25a1 1 0 0 1-.95.73H5.8a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52L7.1 9.17a1 1 0 0 0 1.5-.3Z"/><path d="M5 21h14"/></symbol>
<symbol id="i-zap" viewBox="0 0 24 24"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14Z"/></symbol>
<symbol id="i-send" viewBox="0 0 24 24"><path d="M14.54 21.69a.5.5 0 0 0 .93-.03l6.5-19a.5.5 0 0 0-.63-.63l-19 6.5a.5.5 0 0 0-.03.94l7.93 3.18a2 2 0 0 1 1.11 1.11Z"/><path d="m21.85 2.15-10.94 10.94"/></symbol>
<symbol id="i-flame" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/></symbol>
<symbol id="i-trending" viewBox="0 0 24 24"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></symbol>
<symbol id="i-server" viewBox="0 0 24 24"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01M6 18h.01"/></symbol>
<symbol id="i-coins" viewBox="0 0 24 24"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="i-bars" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16V9"/><path d="M12 16v-5"/><path d="M17 16v-3"/></symbol>
<symbol id="i-users" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></symbol>
<symbol id="i-user-check" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></symbol>
<symbol id="i-wallet" viewBox="0 0 24 24"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-radio" viewBox="0 0 24 24"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/></symbol>
<symbol id="i-film" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7.5h4"/><path d="M3 12h18"/><path d="M3 16.5h4"/><path d="M17 7.5h4"/><path d="M17 16.5h4"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="M11.52 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.16.76a.53.53 0 0 1 .3.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.02a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16Z"/></symbol>
<symbol id="i-megaphone" viewBox="0 0 24 24"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></symbol>
<symbol id="i-dollar" viewBox="0 0 24 24"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></symbol>
<symbol id="i-arrow-ur" viewBox="0 0 24 24"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></symbol>
<symbol id="i-pie" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></symbol>
<symbol id="i-play" viewBox="0 0 24 24"><path d="m6 3 14 9-14 9V3z"/></symbol>
<symbol id="i-heart" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></symbol>
<symbol id="i-message" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></symbol>
<symbol id="i-share" viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></symbol>
<symbol id="i-plus" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></symbol>
<symbol id="i-bookmark" viewBox="0 0 24 24"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></symbol>
<symbol id="i-clap" viewBox="0 0 24 24"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
<symbol id="i-alert" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></symbol>
<symbol id="i-chevron-r" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>
<symbol id="i-chevron-l" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>
<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol>
<symbol id="i-calendar" viewBox="0 0 24 24"><path d="M8 2v4M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></symbol>
<symbol id="i-settings" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>
<symbol id="i-download" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></symbol>
<symbol id="i-refresh" viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></symbol>
<symbol id="i-ban" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></symbol>
<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></symbol>
<symbol id="i-inbox" viewBox="0 0 24 24"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></symbol>
<symbol id="i-edit" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></symbol>
<symbol id="i-key" viewBox="0 0 24 24"><path d="m15.5 7.5 3 3L22 7l-3-3"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></symbol>
<symbol id="i-sliders" viewBox="0 0 24 24"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></symbol>
<linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff2740"/><stop offset="1" stop-color="#7a0910" stop-opacity=".55"/></linearGradient>
</defs></svg>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="logo-mark" viewBox="0 0 44 44"><defs>
<linearGradient id="lm-g" x1="6" y1="4" x2="38" y2="40" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff3a4f"/><stop offset="1" stop-color="#a3060f"/></linearGradient>
<linearGradient id="lm-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
<rect x="3" y="3" width="38" height="38" rx="12" fill="url(#lm-g)"/><rect x="3" y="3" width="38" height="19" rx="12" fill="url(#lm-sheen)"/>
<rect x="3.6" y="3.6" width="36.8" height="36.8" rx="11.6" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.2"/>
<path d="M17.5 13.8 31 21.4a.7.7 0 0 1 0 1.2L17.5 30.2a.7.7 0 0 1-1.05-.6V14.4a.7.7 0 0 1 1.05-.6Z" fill="#fff"/>
<g fill="#fff"><circle cx="16.8" cy="14.2" r="3.1"/><circle cx="16.8" cy="29.8" r="3.1"/><circle cx="31.4" cy="22" r="3.1"/></g>
<g stroke="#ffd0d5" stroke-width="1" opacity=".5"><path d="M16.8 14.2 31.4 22 16.8 29.8"/></g></symbol></svg>`;

  const BRAND = `<a href="index.html" class="brand">
      <svg class="brand-mark" viewBox="0 0 44 44" aria-hidden="true"><use href="#logo-mark"/></svg>
      <span class="brand-word"><span class="logo">Ton</span><span class="tv">TV</span></span>
      <span class="brand-div"></span><span class="tag">NODE&nbsp;SALE</span></a>`;

  const NAV = `<header class="nav" id="nav"><div class="wrap nav-inner">
    ${BRAND}
    <nav class="nav-links" id="nav-links">
      <a href="index.html" data-page="home">홈</a>
      <a href="about.html" data-page="about">소개</a>
      <a href="node.html" data-page="node">노드 세일</a>
      <a href="content.html" data-page="content">콘텐츠</a>
      <a href="blog.html" data-page="blog">블로그</a>
      <a href="resources.html" data-page="resources">자료실</a>
      <a href="myoffice.html" data-page="myoffice">마이오피스</a>
      <a href="login.html" data-page="login" id="nav-auth">로그인</a>
      <a href="admin.html" data-page="admin" class="nav-admin"><svg class="icon" aria-hidden="true"><use href="#i-shield"/></svg> 어드민</a>
    </nav>
    <div class="nav-cta">
      <button class="btn btn-red" data-open-modal>노드 신청 →</button>
      <button class="burger" id="burger" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span><span></span></button>
    </div></div></header>`;

  const FOOTER = `<footer class="footer"><div class="wrap">
    <div class="footer-top">
      <div class="footer-lead">
        ${BRAND.replace('class="brand"', 'class="brand brand-footer"')}
        <h3>시청이 자산이 되는 시대,<br><span class="u">그 인프라를 소유하세요.</span></h3>
        <p>숏폼의 넷플릭스, 텔레그램 위에서.</p>
      </div>
      <div class="footer-cols">
        <div class="fcol"><h5>둘러보기</h5>
          <a href="about.html">톤티비 소개</a><a href="content.html">콘텐츠</a>
          <a href="blog.html">블로그</a><a href="resources.html">자료실</a>
          <a href="node.html">노드 세일</a><a href="myoffice.html">마이오피스</a></div>
        <div class="fcol"><h5>노드 세일</h5>
          <a href="#" data-open-modal>노드 신청하기</a><a href="node.html#staking">스테이킹</a>
          <a href="node.html#roadmap">로드맵</a><a href="node.html#risk">리스크 고지</a></div>
        <div class="fcol"><h5>문의</h5>
          <p>www.ton-tv.com</p><p>TonGram Ventures Group</p>
          <p><svg class="icon" style="vertical-align:-.14em"><use href="#i-send"/></svg> Telegram · @TonTV</p></div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="org">주관 <b>TonGram Ventures Group</b> · 플랫폼 <b>TON Corporation Co., Ltd.</b> (베트남 호치민, Ho Chi Minh City) · CEO Kim Man Ho</div>
      © 2026 TonTV · Node Sale. 본 웹사이트는 정보 제공 목적이며 투자 권유 또는 증권 신고가 아닙니다. 노드 구매는 원금 손실 위험이 있는 고위험 의사결정입니다. 표기된 모든 수익 · 지표는 예시 또는 데모 데이터이며 보장되지 않습니다.
    </div></div></footer>`;

  const MODAL = `<div class="modal-back" id="modal"><div class="modal" role="dialog" aria-modal="true" aria-label="노드 신청">
    <div id="modal-step1">
      <div class="modal-head"><div class="topbar"></div>
        <button class="modal-x" data-close-modal aria-label="닫기"><svg class="icon"><use href="#i-x"/></svg></button>
        <h3>톤티비 노드 신청</h3><p>USDT(TRC20 또는 ERC20/BEP20)로 입금하면 노드 배정 후 XONT가 지급됩니다.</p></div>
      <div class="modal-body">
        <div class="mlabel">신청 플랜 선택</div>
        <div class="tier-grid" id="tier-grid">
          <button class="tierchip on" data-tier="basic" data-price="1000" data-nodes="1"><div class="tt">베이직</div><div class="te">Basic</div><div class="tp">$1,000</div><div class="tnd">노드 1개</div></button>
          <button class="tierchip" data-tier="plus" data-price="3000" data-nodes="3"><span class="tbonus">+3% XONT</span><div class="tt">플러스</div><div class="te">Plus</div><div class="tp">$3,000</div><div class="tnd">노드 3개</div></button>
          <button class="tierchip" data-tier="pro" data-price="5000" data-nodes="5"><span class="tbonus">+5% XONT</span><div class="tt">프로</div><div class="te">Pro</div><div class="tp">$5,000</div><div class="tnd">노드 5개</div></button>
          <button class="tierchip" data-tier="max" data-price="10000" data-nodes="10"><span class="tbonus">+10% XONT</span><div class="tt">맥스</div><div class="te">Max</div><div class="tp">$10,000</div><div class="tnd">노드 10개</div></button>
        </div>
        <div class="total-box"><div class="l">결제 금액<b id="total-tier">베이직 · 노드 1개</b></div><div class="amt"><span id="total-amt">1,000</span><span class="u">USDT</span></div></div>
        <div class="mlabel" style="margin-top:2px">입금 네트워크 선택</div>
        <div class="chain-grid" id="chain-grid">
          <button class="chainchip on" data-chain="tron"><span class="ck"><svg class="icon"><use href="#i-check"/></svg></span><div class="cn">TRON</div><div class="ce">USDT · TRC20</div></button>
          <button class="chainchip" data-chain="evm"><span class="ck"><svg class="icon"><use href="#i-check"/></svg></span><div class="cn">Ethereum / BSC</div><div class="ce">USDT · ERC20 / BEP20</div></button>
        </div>
        <div class="net-badge"><div class="ic">₮</div><div class="nt"><b id="net-name">USDT · TRC20 (TRON)</b><span id="net-sub">반드시 트론(TRC20) 네트워크로만 전송하세요</span></div><span class="tron" id="net-short">TRON</span></div>
        <div class="qr-zone"><div class="qr"><img id="dep-qr" src="assets/usdt-trc20-qr.svg" alt="USDT 입금 주소 QR"></div>
          <div class="qi"><div class="l">QR 스캔으로 간편 입금</div><div class="scan" id="qr-hint">트론 지갑(예: TronLink · OKX · Binance)에서 QR을 스캔하고 <b>정확히 위 금액</b>의 USDT를 전송하세요.</div></div></div>
        <div class="addr-row"><div class="l" id="addr-label">입금 주소 (USDT · TRC20)</div>
          <div class="copy-field"><span class="val" id="dep-addr">${CHAINS.tron.addr}</span><button class="cp" id="copy-addr">복사</button></div></div>
        <div class="warn"><span class="i"><svg class="icon"><use href="#i-alert"/></svg></span>
          <div id="warn-text"><b>TRC20 네트워크의 USDT만</b> 보내세요. 다른 토큰/네트워크(ERC20·BEP20 등)로 전송 시 자산이 영구 소실될 수 있습니다.</div></div>
        <button class="btn btn-red btn-block btn-lg" id="confirm-deposit">입금을 완료했습니다 →</button>
        <p class="demo-note">※ 선택한 <b>네트워크와 주소</b>를 반드시 확인하세요. 잘못된 네트워크로 전송된 자산은 복구할 수 없습니다. 입금은 취소·환불이 불가합니다.</p>
      </div>
    </div>
    <div id="modal-step2" style="display:none">
      <div class="modal-head"><div class="topbar"></div>
        <button class="modal-x" data-close-modal aria-label="닫기"><svg class="icon"><use href="#i-x"/></svg></button>
        <h3>신청이 접수되었습니다</h3><p>입금 확인 후 노드가 배정됩니다.</p></div>
      <div class="modal-body"><div class="msuccess">
        <div class="check"><svg class="icon"><use href="#i-check"/></svg></div>
        <h3>노드 신청 완료</h3>
        <p>입금 트랜잭션이 확인되면 대시보드에 노드가 반영되고, 노드증명 토큰 <b>XONT</b>가 지갑으로 지급됩니다.</p>
        <div class="rec">
          <div class="rr"><span class="k">신청 노드</span><span class="v"><span id="rec-qty">1</span>개</span></div>
          <div class="rr"><span class="k">결제 금액</span><span class="v r"><span id="rec-amt">1,000</span> USDT (TRC20)</span></div>
          <div class="rr"><span class="k">예상 XONT 지급</span><span class="v"><span id="rec-xont">1,000</span> XONT</span></div>
          <div class="rr"><span class="k">가동 시점</span><span class="v">2026. 9</span></div>
        </div>
        <a class="btn btn-dark btn-block" href="myoffice.html" data-close-modal>내 마이오피스 보기 →</a>
      </div></div>
    </div></div></div>`;

  const EXTRAS = `<div class="grain-overlay" aria-hidden="true"></div>
    <div class="float-cta"><button class="btn btn-red" data-open-modal>노드 신청하기 · $1,000 →</button></div>
    <div class="toast-wrap" id="toast-wrap"></div>`;

  /* ---------------- inject ---------------- */
  document.body.insertAdjacentHTML('afterbegin', SPRITES + `<div class="scroll-prog"><i id="scroll-bar"></i></div>` + NAV);
  document.body.insertAdjacentHTML('beforeend', FOOTER + MODAL + EXTRAS);

  /* active nav */
  const page = document.body.dataset.page || 'home';
  $$('#nav-links a').forEach(a => { if (a.dataset.page === page) a.setAttribute('aria-current', 'page'), a.classList.add('active'); });

  /* ---- auth-aware nav: 로그인 ↔ 내 계정 / 로그아웃 (localStorage 세션 기반, SDK 미로딩) ---- */
  const sbAuthKey = () => { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) return k; } } catch (e) {} return null; };
  const sbHasSession = () => {
    const k = sbAuthKey(); if (!k) return false;
    try { const j = JSON.parse(localStorage.getItem(k)); const exp = (j && (j.expires_at ?? (j.currentSession && j.currentSession.expires_at))); return exp ? exp * 1000 > Date.now() : true; } catch (e) { return false; }
  };
  (() => {
    const link = $('#nav-auth'); if (!link || !sbHasSession()) return;
    link.textContent = '내 계정';
    link.setAttribute('href', 'account.html');
    if (!$('#nav-logout')) {
      const out = document.createElement('a');
      out.id = 'nav-logout'; out.href = '#'; out.textContent = '로그아웃';
      out.addEventListener('click', (e) => {
        e.preventDefault();
        const k = sbAuthKey(); if (k) { try { localStorage.removeItem(k); } catch (_) {} }
        window.toast && window.toast('로그아웃되었습니다');
        setTimeout(() => location.href = 'index.html', 350);
      });
      link.insertAdjacentElement('afterend', out);
    }
  })();

  /* ---------------- toast (global) ---------------- */
  const toastWrap = $('#toast-wrap');
  window.toast = (msg, type = 'ok') => {
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'err' ? ' err' : '');
    t.setAttribute('role', 'status');
    t.innerHTML = `<span class="ic"><svg class="icon"><use href="#${type === 'err' ? 'i-alert' : 'i-check'}"/></svg></span><span>${msg}</span>`;
    toastWrap.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
  };

  /* ---------------- nav: scrolled + progress + burger ---------------- */
  const nav = $('#nav'), scrollBar = $('#scroll-bar');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    scrollBar.style.transform = `scaleX(${h > 0 ? Math.min(1, window.scrollY / h) : 0})`;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('#nav-links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }));

  /* ---------------- smooth in-page anchors + data-scroll ---------------- */
  const scrollToEl = sel => { const t = $(sel); if (!t) return; window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); };
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) { e.preventDefault(); nav.classList.remove('open'); scrollToEl(id); }
  }));
  $$('[data-scroll]').forEach(el => el.addEventListener('click', () => {
    const sel = el.getAttribute('data-scroll');
    setTimeout(() => scrollToEl(sel), el.hasAttribute('data-close-modal') ? 280 : 0);
  }));

  /* ---------------- deposit modal ---------------- */
  const modal = $('#modal');
  let qty = 1, selectedTier = 'basic', selectedChain = 'tron';
  let _tk = { per: 10000, plus: 3, pro: 5, max: 10 };   // XONT 지급/보너스 (DB에서 최신화)
  import('./lib/supabase.js').then(m => m.getTokenConfig ? m.getTokenConfig() : null).then(c => {
    if (c) _tk = { per: Number(c.xont_per_1000_usd) || 10000, plus: Number(c.xont_bonus_plus_pct) || 0, pro: Number(c.xont_bonus_pro_pct) || 0, max: Number(c.xont_bonus_max_pct) || 0 };
  }).catch(() => {});
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const TIER_NAMES = { basic: '베이직', pro: '프로', max: '맥스' };
  const updateTotal = () => {
    const chip = $('#tier-grid .tierchip.on');
    const nodes = +((chip && chip.dataset.nodes) || 1);
    const price = +((chip && chip.dataset.price) || 1000);
    qty = nodes;
    $('#total-tier') && ($('#total-tier').textContent = (TIER_NAMES[selectedTier] || '베이직') + ' · 노드 ' + nodes + '개');
    $('#total-amt') && ($('#total-amt').textContent = fmt(price));
  };
  const openModal = () => { $('#modal-step1').style.display = 'block'; $('#modal-step2').style.display = 'none'; modal.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const closeModal = () => { modal.classList.remove('open'); document.body.style.overflow = ''; };

  $$('[data-open-modal]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); openModal(); }));
  $$('[data-close-modal]').forEach(b => b.addEventListener('click', closeModal));
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  $$('#tier-grid .tierchip').forEach(c => c.addEventListener('click', () => {
    $$('#tier-grid .tierchip').forEach(x => x.classList.remove('on')); c.classList.add('on');
    selectedTier = c.dataset.tier; updateTotal();
  }));

  /* 주소로 QR을 동적 생성(어드민이 주소 변경 시 즉시 반영) · 실패 시 정적 SVG 유지 */
  let _qrlib = null;
  const updateQR = async (c) => {
    const img = $('#dep-qr'); if (!img) return;
    img.src = c.qr;
    try {
      if (!_qrlib) _qrlib = (await import('https://esm.sh/qrcode@1.5.4')).default;
      const url = await _qrlib.toDataURL(c.addr, { margin: 1, width: 240, color: { dark: '#000000', light: '#ffffff' } });
      if (CHAINS[selectedChain] && CHAINS[selectedChain].addr === c.addr) img.src = url;
    } catch (e) { /* 정적 SVG 폴백 유지 */ }
  };
  /* 입금 네트워크(체인) 선택 — 주소·QR·경고문 전환 */
  const applyChain = () => {
    const c = CHAINS[selectedChain]; if (!c) return;
    $('#dep-addr') && ($('#dep-addr').textContent = c.addr);
    updateQR(c);
    $('#net-name') && ($('#net-name').textContent = c.net);
    $('#net-sub') && ($('#net-sub').textContent = c.sub);
    $('#net-short') && ($('#net-short').textContent = c.short);
    $('#addr-label') && ($('#addr-label').textContent = c.label);
    $('#qr-hint') && ($('#qr-hint').innerHTML = c.hint);
    $('#warn-text') && ($('#warn-text').innerHTML = c.warn);
  };
  $$('#chain-grid .chainchip').forEach(c => c.addEventListener('click', () => {
    $$('#chain-grid .chainchip').forEach(x => x.classList.remove('on')); c.classList.add('on');
    selectedChain = c.dataset.chain; applyChain();
  }));
  /* 입금 주소를 DB(token_config)에서 로드해 최신화 */
  import('./lib/supabase.js').then(m => m.getDepositAddresses ? m.getDepositAddresses() : null).then(a => {
    if (a) { if (a.deposit_addr_tron) CHAINS.tron.addr = a.deposit_addr_tron; if (a.deposit_addr_evm) CHAINS.evm.addr = a.deposit_addr_evm; applyChain(); }
  }).catch(() => {});

  $('#copy-addr').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(CHAINS[selectedChain].addr); }
    catch { const r = document.createRange(); r.selectNode($('#dep-addr')); getSelection().removeAllRanges(); getSelection().addRange(r); document.execCommand('copy'); getSelection().removeAllRanges(); }
    const b = $('#copy-addr'); b.innerHTML = '복사됨 <svg class="icon" style="width:12px;height:12px;vertical-align:-.1em"><use href="#i-check"/></svg>'; b.classList.add('done');
    window.toast('입금 주소가 복사되었습니다');
    setTimeout(() => { b.textContent = '복사'; b.classList.remove('done'); }, 1800);
  });
  const showDepositDone = () => {
    const bonus = selectedTier === 'plus' ? _tk.plus : selectedTier === 'pro' ? _tk.pro : selectedTier === 'max' ? _tk.max : 0;
    const grant = qty * _tk.per * (1 + bonus / 100);
    $('#rec-qty').textContent = fmt(qty); $('#rec-amt').textContent = fmt(qty * NODE_PRICE); $('#rec-xont').textContent = fmt(grant);
    $('#modal-step1').style.display = 'none'; $('#modal-step2').style.display = 'block'; modal.querySelector('.modal').scrollTop = 0;
  };
  $('#confirm-deposit').addEventListener('click', async () => {
    const btn = $('#confirm-deposit');
    if (!sbHasSession()) {                       // 노드 신청은 로그인 필요
      window.toast && window.toast('노드 신청은 로그인 후 가능합니다', 'err');
      setTimeout(() => location.href = 'login.html', 800);
      return;
    }
    const orig = btn.textContent; btn.disabled = true; btn.textContent = '신청 처리 중…';
    try {
      const m = await import('/lib/supabase.js');
      await m.createNodeApplication({ tier: selectedTier, network: CHAINS[selectedChain].code });   // deposits에 pending 기록
      showDepositDone();
      window.toast && window.toast('노드 신청이 접수되었습니다 · 승인 대기');
    } catch (e) {
      window.toast && window.toast('신청 실패: ' + (e && e.message || e), 'err');
    } finally {
      btn.disabled = false; btn.textContent = orig;
    }
  });
  updateTotal();
  applyChain();

  /* ---------------- Unicorn Studio animated background (vanilla embed) ----------------
     Loads the official UMD script only when a [data-us-project] scene is on the page
     and the user hasn't requested reduced motion. The dark base bg remains as fallback. */
  if (document.querySelector('[data-us-project]') &&
      !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false };
      const us = document.createElement('script');
      us.src = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js';
      us.async = true;
      us.onload = () => { if (window.UnicornStudio && !window.UnicornStudio.isInitialized) { try { UnicornStudio.init(); } catch (e) {} window.UnicornStudio.isInitialized = true; } };
      (document.head || document.body).appendChild(us);
    }
  }
})();
