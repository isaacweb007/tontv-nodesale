/* ============================================================
   TonTV — 운영자 어드민 콘솔 (데모). admin.html 에서만 실행.
   탭 전환 · 신청/입금/사업자 테이블 · 토큰분배 · 광고정산 ·
   토큰/지갑/설정 관리. layout.js(토스트·스프라이트) 의존. No deps.
   ============================================================ */
(() => {
  'use strict';
  if (document.body.dataset.page !== 'admin') return;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = n => Math.round(n).toLocaleString('en-US');
  const fmt2 = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtC = n => n >= 1e9 ? '$' + (n / 1e9).toFixed(2) + 'B' : n >= 1e6 ? '$' + (n / 1e6).toFixed(2) + 'M' : '$' + fmt(n); // 축약 통화
  const toast = (m, t) => (window.toast ? window.toast(m, t) : 0);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TONX_SUPPLY = 1e10, XONT_PRICE = 0.85, NODE_PRICE = 1000;

  const BADGE = {
    pending: ['amber', '대기'], approved: ['green', '승인'], rejected: ['red', '거절'],
    unconfirmed: ['amber', '미확인'], confirmed: ['green', '확인'], failed: ['red', '실패'],
    active: ['green', '활성'], suspended: ['red', '정지'],
    done: ['green', '완료'], paid: ['green', '지급완료'], scheduled: ['amber', '예정'],
  };
  const badge = k => { const b = BADGE[k] || ['gray', k]; return `<span class="stbadge ${b[0]}">${b[1]}</span>`; };

  /* ===================== 데모 데이터 ===================== */
  const S = {
    totalNodes: 2188, cap1: 3000, capTotal: 50000,
    pool: 182400, poolRate: 4.6,
    tonxToday: 4218600, tonxTotal: 1284500000,
    xontSupply: 86420500, xontStaked: 12480000, xontCirc: 61500500,
    swap: { ratio: null, active: false },
    depositAddress: 'TUgTV1NodeSa1eTreasuryDem0xXyZ12345',
    applications: [
      { id: 4821, name: '김도현', wallet: 'TXk9…3kT2', qty: 5, date: '2026-06-04', status: 'pending' },
      { id: 4820, name: '이수아', wallet: 'TGq2…8mP1', qty: 12, date: '2026-06-04', status: 'pending' },
      { id: 4819, name: '박준영', wallet: 'TLm7…4nQ9', qty: 3, date: '2026-06-04', status: 'pending' },
      { id: 4818, name: '최민지', wallet: 'TBv5…1wR6', qty: 8, date: '2026-06-03', status: 'pending' },
      { id: 4817, name: '정현우', wallet: 'TPx3…9kL4', qty: 1, date: '2026-06-03', status: 'pending' },
      { id: 4816, name: '강서윤', wallet: 'T9aa…2vT7', qty: 20, date: '2026-06-03', status: 'pending' },
      { id: 4815, name: '조은채', wallet: 'TKn8…6yU3', qty: 2, date: '2026-06-03', status: 'pending' },
      { id: 4814, name: '윤재호', wallet: 'TWc1…5bN8', qty: 10, date: '2026-06-02', status: 'approved' },
      { id: 4813, name: '임하늘', wallet: 'TFd4…7cM2', qty: 4, date: '2026-06-02', status: 'approved' },
      { id: 4812, name: '한지민', wallet: 'TRe6…0dK9', qty: 6, date: '2026-06-02', status: 'approved' },
      { id: 4811, name: '오태양', wallet: 'TYg9…3fJ1', qty: 15, date: '2026-06-01', status: 'approved' },
      { id: 4810, name: '서아인', wallet: 'THj2…8gH5', qty: 7, date: '2026-06-01', status: 'approved' },
      { id: 4809, name: '신우진', wallet: 'TZk5…1hG7', qty: 9, date: '2026-05-31', status: 'rejected' },
      { id: 4808, name: '문가람', wallet: 'TQm3…4jF6', qty: 1, date: '2026-05-31', status: 'rejected' },
    ],
    deposits: [
      { id: 'D-9043', order: 4821, amount: 5000, tx: '8f3a…c21b', time: '06-04 14:22', status: 'unconfirmed' },
      { id: 'D-9042', order: 4820, amount: 12000, tx: 'a91d…7e0f', time: '06-04 13:58', status: 'unconfirmed' },
      { id: 'D-9041', order: 4819, amount: 3000, tx: '2c44…9b13', time: '06-04 12:41', status: 'unconfirmed' },
      { id: 'D-9040', order: 4818, amount: 8000, tx: 'd7e2…1a55', time: '06-03 22:09', status: 'unconfirmed' },
      { id: 'D-9039', order: 4817, amount: 1000, tx: 'f015…8d2c', time: '06-03 19:30', status: 'unconfirmed' },
      { id: 'D-9038', order: 4814, amount: 10000, tx: '5b8c…3f7a', time: '06-02 16:12', status: 'confirmed' },
      { id: 'D-9037', order: 4813, amount: 4000, tx: '9a2e…6c40', time: '06-02 15:47', status: 'confirmed' },
      { id: 'D-9036', order: 4812, amount: 6000, tx: 'c33f…2b91', time: '06-02 11:05', status: 'confirmed' },
      { id: 'D-9035', order: 4811, amount: 15000, tx: '1d6a…5e88', time: '06-01 18:20', status: 'confirmed' },
      { id: 'D-9034', order: 4810, amount: 7000, tx: 'e480…0a3d', time: '06-01 09:14', status: 'confirmed' },
      { id: 'D-9033', order: 4809, amount: 9000, tx: '7c19…4f2e', time: '05-31 20:51', status: 'failed' },
    ],
    operators: [
      { name: '윤재호', wallet: 'EQWc1…5bN8', nodes: 10, kyc: 1, joined: '2026-06-02', status: 'active' },
      { name: '임하늘', wallet: 'EQFd4…7cM2', nodes: 4, kyc: 1, joined: '2026-06-02', status: 'active' },
      { name: '한지민', wallet: 'EQRe6…0dK9', nodes: 6, kyc: 1, joined: '2026-06-02', status: 'active' },
      { name: '오태양', wallet: 'EQYg9…3fJ1', nodes: 15, kyc: 1, joined: '2026-06-01', status: 'active' },
      { name: '서아인', wallet: 'EQHj2…8gH5', nodes: 7, kyc: 1, joined: '2026-06-01', status: 'active' },
      { name: '김민준', wallet: 'EQAb…3kT', nodes: 8, kyc: 1, joined: '2026-05-28', status: 'active' },
      { name: '최예나', wallet: 'UQC7…9xR', nodes: 12, kyc: 1, joined: '2026-05-26', status: 'active' },
      { name: '이서연', wallet: 'EQDe…1mP', nodes: 5, kyc: 1, joined: '2026-05-24', status: 'active' },
      { name: '박지후', wallet: 'UQF2…7kL', nodes: 3, kyc: 0, joined: '2026-05-22', status: 'active' },
      { name: '정도윤', wallet: 'EQGh…4nQ', nodes: 6, kyc: 1, joined: '2026-05-20', status: 'active' },
      { name: '오시우', wallet: 'UQK9…2vT', nodes: 4, kyc: 1, joined: '2026-05-18', status: 'active' },
      { name: '한소율', wallet: 'EQLm…8wC', nodes: 2, kyc: 0, joined: '2026-05-15', status: 'active' },
      { name: '배준서', wallet: 'EQNp…6zB', nodes: 18, kyc: 1, joined: '2026-05-12', status: 'suspended' },
      { name: '권나윤', wallet: 'UQRt…1aD', nodes: 1, kyc: 0, joined: '2026-05-10', status: 'suspended' },
    ],
    distHistory: [
      { date: '2026-06-03', tonx: 19840500, nodes: 2185, status: 'done' },
      { date: '2026-06-02', tonx: 18920400, nodes: 2180, status: 'done' },
      { date: '2026-06-01', tonx: 18044100, nodes: 2174, status: 'done' },
      { date: '2026-05-31', tonx: 17655900, nodes: 2168, status: 'done' },
      { date: '2026-05-30', tonx: 16980300, nodes: 2161, status: 'done' },
    ],
    settleHistory: [
      { month: '2026-05', revenue: 5920000, nodes: 2150, pay: '2026-06-10', status: 'scheduled' },
      { month: '2026-04', revenue: 5410000, nodes: 1980, pay: '2026-05-10', status: 'paid' },
      { month: '2026-03', revenue: 4870000, nodes: 1760, pay: '2026-04-10', status: 'paid' },
      { month: '2026-02', revenue: 4120000, nodes: 1490, pay: '2026-03-10', status: 'paid' },
      { month: '2026-01', revenue: 3380000, nodes: 1210, pay: '2026-02-10', status: 'paid' },
    ],
    wallets: [
      { label: 'USDT 입금 트레저리', chain: 'TRC20', addr: 'TUgT…Z123', bal: 2188000, unit: 'USDT', status: 'active' },
      { label: 'TON 운영 지갑', chain: 'TON', addr: 'EQop…9Qt4', bal: 184250, unit: 'TON', status: 'active' },
      { label: 'XONT 발행 지갑', chain: 'TON', addr: 'EQmt…2Lk8', bal: 24920000, unit: 'XONT', status: 'active' },
      { label: '광고수익 정산 풀', chain: 'TRC20', addr: 'TPay…7Rb2', bal: 182400, unit: 'USDT', status: 'active' },
    ],
    txs: [
      { type: '유입', wallet: 'USDT 트레저리', amount: '+5,000 USDT', peer: '8f3a…c21b', time: '06-04 14:22', status: 'unconfirmed' },
      { type: '유입', wallet: 'USDT 트레저리', amount: '+10,000 USDT', peer: '5b8c…3f7a', time: '06-02 16:12', status: 'confirmed' },
      { type: '발행', wallet: 'XONT 발행 지갑', amount: '+18,920 XONT', peer: '분배 라운드 06-02', time: '06-02 00:00', status: 'confirmed' },
      { type: '지급', wallet: '광고수익 정산 풀', amount: '-241,800 USDT', peer: '04월 노드풀 정산', time: '05-10 10:00', status: 'confirmed' },
      { type: '유입', wallet: 'USDT 트레저리', amount: '+15,000 USDT', peer: '1d6a…5e88', time: '06-01 18:20', status: 'confirmed' },
      { type: '발행', wallet: 'XONT 발행 지갑', amount: '+18,044 XONT', peer: '분배 라운드 06-01', time: '06-01 00:00', status: 'confirmed' },
    ],
    logs: [
      { i: 'i-check', t: '06월 입금 #D-9038 확인 → 노드 10개 배정', time: '2분 전' },
      { i: 'i-coins', t: 'TONX→XONT 분배 라운드 완료 (19.84M)', time: '11분 전' },
      { i: 'i-user-check', t: '신청 #4814 승인 (윤재호 · 10노드)', time: '26분 전' },
      { i: 'i-ban', t: '사업자 배준서 계정 정지', time: '1시간 전' },
      { i: 'i-megaphone', t: '05월 광고수익 정산 예약 ($592만)', time: '3시간 전' },
      { i: 'i-wallet', t: 'XONT 발행 지갑 18,920 XONT 발행', time: '6시간 전' },
    ],
  };

  /* ===================== 탭 전환 ===================== */
  const tabs = $$('.atab'), panels = $$('.apanel');
  const showTab = name => {
    tabs.forEach(t => t.classList.toggle('on', t.dataset.tab === name));
    panels.forEach(p => { const on = p.dataset.panel === name; p.classList.toggle('on', on); p.hidden = !on; });
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    // 모바일 가로 탭바: 활성 탭을 가운데로 (세로 스크롤은 유발하지 않음)
    const at = tabs.find(t => t.dataset.tab === name);
    if (at && window.innerWidth <= 1024) at.scrollIntoView({ inline: 'center', block: 'nearest' });
  };
  tabs.forEach(t => t.addEventListener('click', () => showTab(t.dataset.tab)));
  const initial = (location.hash || '').replace('#', '');
  if (initial && tabs.some(t => t.dataset.tab === initial)) showTab(initial);

  /* ===================== 공통 액션 셀렉터(.aseg) ===================== */
  function segGroup(sel, onPick) {
    const box = $(sel); if (!box) return;
    $$('button', box).forEach(b => b.addEventListener('click', () => {
      $$('button', box).forEach(x => x.classList.remove('on'));
      b.classList.add('on'); onPick(b.dataset.f || b.dataset.t, b);
    }));
  }

  /* ===================== 렌더러 ===================== */
  // 개요
  function renderOverview() {
    const pending = S.applications.filter(a => a.status === 'pending').length;
    const unconf = S.deposits.filter(d => d.status === 'unconfirmed').length;
    const depositTotal = S.deposits.filter(d => d.status === 'confirmed').reduce((s, d) => s + d.amount, 0) + S.totalNodes * NODE_PRICE;
    $('#o-nodes').textContent = fmt(S.totalNodes);
    $('#o-nodes-cap').textContent = '/ ' + fmt(S.cap1);
    $('#o-deposit').textContent = fmtC(depositTotal);
    $('#o-pending').textContent = pending;
    $('#o-unconf').textContent = unconf;
    $('#o-ops').textContent = fmt(1842);
    $('#o-pool').textContent = '$' + fmt(S.pool);
    $('#tc-apps').textContent = pending;
    $('#tc-deps').textContent = unconf;
    // 처리 대기
    const todo = [
      ...S.applications.filter(a => a.status === 'pending').map(a => ({ k: 'app', id: a.id, ic: 'i-inbox', t: `신청 #${a.id} · ${esc(a.name)} · ${a.qty}노드`, sub: '승인 대기', btn: '승인', cls: 'ok' })),
      ...S.deposits.filter(d => d.status === 'unconfirmed').map(d => ({ k: 'dep', id: d.id, ic: 'i-dollar', t: `입금 ${d.id} · $${fmt(d.amount)}`, sub: 'TRC20 확인 필요', btn: '확인', cls: 'ok' })),
    ].slice(0, 7);
    $('#todo-count').textContent = (S.applications.filter(a => a.status === 'pending').length + unconf) + '건';
    $('#todo-list').innerHTML = todo.length ? todo.map(x => `
      <div class="noderow">
        <div class="li"><div class="nidx"><svg class="icon"><use href="#${x.ic}"/></svg></div>
          <div><div class="ni">${x.t}</div><div class="ns">${x.sub}</div></div></div>
        <button class="act ${x.cls}" data-todo="${x.k}:${x.id}">${x.btn}</button>
      </div>`).join('') : `<div class="empty">처리할 대기 항목이 없습니다 🎉</div>`;
    $$('#todo-list [data-todo]').forEach(b => b.addEventListener('click', () => {
      const [k, id] = b.dataset.todo.split(':');
      if (k === 'app') approveApp(+id); else confirmDeposit(id);
    }));
    // 로그
    $('#log-list').innerHTML = S.logs.map(l => `
      <div class="noderow">
        <div class="li"><div class="nidx"><svg class="icon"><use href="#${l.i}"/></svg></div>
          <div><div class="ni" style="font-weight:600">${esc(l.t)}</div><div class="ns">${l.time}</div></div></div>
      </div>`).join('');
  }

  // 노드 신청
  let appsFilter = 'all', appsQ = '';
  function renderApps() {
    let rows = S.applications.filter(a =>
      (appsFilter === 'all' || a.status === appsFilter) &&
      (!appsQ || a.name.includes(appsQ) || a.wallet.toLowerCase().includes(appsQ.toLowerCase()) || String(a.id).includes(appsQ)));
    rows = applySort('apps', rows);
    $('#apps-count').textContent = rows.length + '건';
    $('#apps-body').innerHTML = rows.map(a => `
      <tr>
        <td><div class="cell-main">#${a.id} <b>${esc(a.name)}</b></div></td>
        <td class="mono">${esc(a.wallet)}</td>
        <td>${a.qty}개</td>
        <td class="ta-num">$${fmt(a.qty * NODE_PRICE)}</td>
        <td class="muted">${a.date}</td>
        <td>${badge(a.status)}</td>
        <td class="ta-r">${a.status === 'pending'
          ? `<button class="act ok" data-ap="${a.id}">승인</button><button class="act no" data-rj="${a.id}">거절</button>`
          : `<span class="muted sm">처리됨</span>`}</td>
      </tr>`).join('') || emptyRow(7);
    $$('#apps-body [data-ap]').forEach(b => b.addEventListener('click', () => approveApp(+b.dataset.ap)));
    $$('#apps-body [data-rj]').forEach(b => b.addEventListener('click', () => rejectApp(+b.dataset.rj)));
    labelTable($('#apps-body'));
  }
  function approveApp(id) {
    const a = S.applications.find(x => x.id === id); if (!a || a.status !== 'pending') return;
    a.status = 'approved'; S.totalNodes += a.qty;
    pushLog('i-user-check', `신청 #${id} 승인 (${a.name} · ${a.qty}노드)`);
    toast(`신청 #${id} 승인 · 노드 ${a.qty}개 배정`);
    renderApps(); renderOverview(); renderOperators();
  }
  function rejectApp(id) {
    const a = S.applications.find(x => x.id === id); if (!a || a.status !== 'pending') return;
    a.status = 'rejected'; pushLog('i-x', `신청 #${id} 거절 (${a.name})`);
    toast(`신청 #${id} 거절 처리`, 'err'); renderApps(); renderOverview();
  }

  // 입금
  let depsFilter = 'all', depsQ = '';
  function renderDeposits() {
    const all = S.deposits;
    $('#d-total').textContent = '$' + fmt(all.filter(d => d.status === 'confirmed').reduce((s, d) => s + d.amount, 0));
    $('#d-today').textContent = '$' + fmt(all.filter(d => d.time.startsWith('06-04')).reduce((s, d) => s + d.amount, 0));
    $('#d-unconf').textContent = all.filter(d => d.status === 'unconfirmed').length;
    $('#d-conf').textContent = all.filter(d => d.status === 'confirmed').length;
    let rows = all.filter(d =>
      (depsFilter === 'all' || d.status === depsFilter) &&
      (!depsQ || d.id.toLowerCase().includes(depsQ.toLowerCase()) || d.tx.includes(depsQ) || String(d.order).includes(depsQ)));
    rows = applySort('deps', rows);
    $('#deps-count').textContent = rows.length + '건';
    $('#deps-body').innerHTML = rows.map(d => `
      <tr>
        <td><b>${d.id}</b><div class="muted sm">신청 #${d.order}</div></td>
        <td class="ta-num">$${fmt(d.amount)}</td>
        <td><span class="netpill">TRC20</span></td>
        <td class="mono">${esc(d.tx)}</td>
        <td class="muted">${d.time}</td>
        <td>${badge(d.status)}</td>
        <td class="ta-r">${d.status === 'unconfirmed'
          ? `<button class="act ok" data-dc="${d.id}">확인</button><button class="act no" data-df="${d.id}">실패</button>`
          : `<span class="muted sm">처리됨</span>`}</td>
      </tr>`).join('') || emptyRow(7);
    $$('#deps-body [data-dc]').forEach(b => b.addEventListener('click', () => confirmDeposit(b.dataset.dc)));
    $$('#deps-body [data-df]').forEach(b => b.addEventListener('click', () => failDeposit(b.dataset.df)));
    labelTable($('#deps-body'));
  }
  function confirmDeposit(id) {
    const d = S.deposits.find(x => x.id === id); if (!d || d.status !== 'unconfirmed') return;
    d.status = 'confirmed';
    pushLog('i-check', `입금 ${id} 확인 → $${fmt(d.amount)} 트레저리 반영`);
    toast(`입금 ${id} 확인 완료 · $${fmt(d.amount)}`);
    renderDeposits(); renderOverview();
  }
  function failDeposit(id) {
    const d = S.deposits.find(x => x.id === id); if (!d || d.status !== 'unconfirmed') return;
    d.status = 'failed'; pushLog('i-alert', `입금 ${id} 실패 처리`);
    toast(`입금 ${id} 실패 처리`, 'err'); renderDeposits(); renderOverview();
  }

  // 사업자
  let opsFilter = 'all', opsQ = '';
  function renderOperators() {
    $('#op-total').textContent = fmt(1842);
    $('#op-active').textContent = fmt(1828);
    $('#op-susp').textContent = S.operators.filter(o => o.status === 'suspended').length + 12;
    $('#op-nodes').textContent = fmt(S.totalNodes);
    let rows = S.operators.filter(o =>
      (opsFilter === 'all' || o.status === opsFilter) &&
      (!opsQ || o.name.includes(opsQ) || o.wallet.toLowerCase().includes(opsQ.toLowerCase())));
    rows = applySort('ops', rows);
    $('#ops-count').textContent = `${rows.length}명 표시 · 전체 1,842`;
    $('#ops-body').innerHTML = rows.map((o, i) => `
      <tr>
        <td><div class="cell-av"><span class="avx">${esc(o.name[0])}</span><b>${esc(o.name)}</b></div></td>
        <td class="mono">${esc(o.wallet)}</td>
        <td>${o.nodes}개</td>
        <td>${o.kyc ? '<span class="stbadge green">인증</span>' : '<span class="stbadge amber">대기</span>'}</td>
        <td class="muted">${o.joined}</td>
        <td>${badge(o.status)}</td>
        <td class="ta-r">${o.status === 'active'
          ? `<button class="act no" data-sp="${i}">정지</button>`
          : `<button class="act ok" data-av="${i}">활성</button>`}</td>
      </tr>`).join('') || emptyRow(7);
    $$('#ops-body [data-sp]').forEach(b => b.addEventListener('click', () => { S.operators[+b.dataset.sp].status = 'suspended'; pushLog('i-ban', `사업자 ${S.operators[+b.dataset.sp].name} 정지`); toast('사업자 계정을 정지했습니다', 'err'); renderOperators(); }));
    $$('#ops-body [data-av]').forEach(b => b.addEventListener('click', () => { S.operators[+b.dataset.av].status = 'active'; pushLog('i-user-check', `사업자 ${S.operators[+b.dataset.av].name} 활성화`); toast('사업자 계정을 활성화했습니다'); renderOperators(); }));
    labelTable($('#ops-body'));
  }

  // 토큰 분배
  function renderDist() {
    const per = S.tonxToday / S.totalNodes;
    $('#ad-tonx').textContent = fmt(S.tonxToday);
    $('#ad-xont').textContent = fmt(S.tonxToday);
    $('#ad-nodes').textContent = fmt(S.totalNodes);
    $('#ad-per').innerHTML = fmt2(per) + ' <span class="u">XONT</span>';
    $('#dist-body').innerHTML = S.distHistory.map(d => `
      <tr>
        <td><b>${d.date}</b></td>
        <td class="ta-num">${fmt(d.tonx)}</td>
        <td class="ta-num r">${fmt(d.tonx)}</td>
        <td>${fmt(d.nodes)}개</td>
        <td class="ta-num">${fmt2(d.tonx / d.nodes)}</td>
        <td>${badge(d.status)}</td>
      </tr>`).join('');
    labelTable($('#dist-body'));
  }
  function runDistribution() {
    if (S.distHistory[0]?.date === '2026-06-04') { toast('오늘 분배는 이미 실행되었습니다', 'err'); return; }
    S.distHistory.unshift({ date: '2026-06-04', tonx: Math.round(S.tonxToday), nodes: S.totalNodes, status: 'done' });
    $('#ad-state').textContent = '완료';
    pushLog('i-coins', `TONX→XONT 분배 실행 (${fmt(S.tonxToday)})`);
    toast(`오늘 분배 실행 · ${fmt(S.tonxToday)} XONT 발행`);
    renderDist();
  }

  // 광고수익 분배
  function renderAdrev() {
    $('#ar-pool').textContent = '$' + fmt(S.pool);
    $('#ar-ad').textContent = '$' + fmt(S.pool * 0.62);
    $('#ar-sub').textContent = '$' + fmt(S.pool * 0.24);
    $('#ar-tok').textContent = '$' + fmt(S.pool * 0.14);
    $('#ar-per').textContent = '$' + fmt2(S.pool / S.cap1);
    $('#settle-body').innerHTML = S.settleHistory.map(s => `
      <tr>
        <td><b>${s.month}</b></td>
        <td class="ta-num">$${fmt(s.revenue)}</td>
        <td class="ta-num r">$${fmt(s.revenue * 0.1)}</td>
        <td>${fmt(s.nodes)}개</td>
        <td class="ta-num">$${fmt2(s.revenue * 0.1 / s.nodes)}</td>
        <td class="muted">${s.pay}</td>
        <td>${badge(s.status)}</td>
      </tr>`).join('');
    labelTable($('#settle-body'));
  }
  function runSettlement() {
    const s = S.settleHistory.find(x => x.status === 'scheduled');
    if (!s) { toast('정산 예정 건이 없습니다', 'err'); return; }
    s.status = 'paid';
    pushLog('i-megaphone', `${s.month} 노드풀 정산 지급 ($${fmt(s.revenue * 0.1)})`);
    toast(`${s.month} 월 정산 실행 · 노드풀 $${fmt(s.revenue * 0.1)} 지급`);
    renderAdrev();
  }

  // 토큰 관리
  function renderToken() {
    const pct = S.tonxTotal / TONX_SUPPLY * 100;
    $('#tk-tonx-bar').style.width = Math.min(100, pct) + '%';
    $('#tk-tonx-mined').textContent = fmt(S.tonxTotal);
    $('#tk-tonx-pct').textContent = pct.toFixed(3) + '%';
    $('#tk-tonx-circ').textContent = fmt(S.tonxTotal * 0.78);
    $('#tk-tonx-holders').textContent = fmt(312840);
    $('#tk-xont-supply').textContent = fmt(S.xontSupply);
    $('#tk-xont-circ').textContent = fmt(S.xontCirc);
    $('#tk-xont-stake').textContent = fmt(S.xontStaked);
    $('#tk-xont-holders').textContent = fmt(2188);
    const tag = $('#swap-state-tag');
    if (S.swap.active && S.swap.ratio) tag.innerHTML = `활성 · 1 XONT = ${S.swap.ratio} TONX`, tag.className = 'tagx on';
    else tag.textContent = '미설정 (TBD)', tag.className = 'tagx';
  }

  // 지갑
  function renderWallets() {
    $('#wallet-list').innerHTML = S.wallets.map(w => `
      <div class="wrow">
        <div class="li"><div class="widx"><svg class="icon"><use href="#i-wallet"/></svg></div>
          <div><div class="wn">${esc(w.label)} <span class="netpill sm">${w.chain}</span></div><div class="wa mono">${esc(w.addr)}</div></div></div>
        <div class="wr"><div class="wb">${fmt(w.bal)} <span class="u">${w.unit}</span></div><div class="ws"><span class="livedot"></span> 정상</div></div>
      </div>`).join('');
    $('#cur-addr').textContent = S.depositAddress;
    $('#tx-body').innerHTML = S.txs.map(t => `
      <tr>
        <td><span class="txtype ${t.type === '유입' ? 'in' : t.type === '지급' ? 'out' : 'mint'}">${t.type}</span></td>
        <td>${esc(t.wallet)}</td>
        <td class="ta-num ${t.amount.startsWith('-') ? 'rneg' : 'r'}">${esc(t.amount)}</td>
        <td class="mono">${esc(t.peer)}</td>
        <td class="muted">${t.time}</td>
        <td>${badge(t.status)}</td>
      </tr>`).join('');
    labelTable($('#tx-body'));
  }

  /* ===================== 로그 헬퍼 ===================== */
  function pushLog(i, t) { S.logs.unshift({ i, t, time: '방금' }); S.logs = S.logs.slice(0, 8); if ($('#log-list')) renderOverview(); }
  function emptyRow(cols) { return `<tr><td colspan="${cols}" class="empty"><div class="empty-ico"><svg class="icon"><use href="#i-inbox"/></svg><b>표시할 항목이 없습니다</b><span>필터를 조정하거나 검색어를 지워보세요</span></div></td></tr>`; }

  /* ===================== 테이블 정렬 (클릭/키보드) ===================== */
  const SORT = { apps: { i: null, d: 1 }, deps: { i: null, d: 1 }, ops: { i: null, d: 1 } };
  const SORT_COLS = {  // 컬럼 인덱스 → 정렬 접근자 (null = 정렬 불가)
    apps: [a => a.name, a => a.wallet, a => a.qty, a => a.qty, a => a.date, a => a.status, null],
    deps: [d => d.id, d => d.amount, null, d => d.tx, d => d.time, d => d.status, null],
    ops: [o => o.name, o => o.wallet, o => o.nodes, o => o.kyc, o => o.joined, o => o.status, null],
  };
  function applySort(key, arr) {
    const s = SORT[key]; if (s.i == null) return arr;
    const acc = SORT_COLS[key][s.i]; if (!acc) return arr;
    return [...arr].sort((a, b) => { const x = acc(a), y = acc(b); return (x < y ? -1 : x > y ? 1 : 0) * s.d; });
  }
  function bindSort(key, bodyId, reRender) {
    const table = $('#' + bodyId).closest('table');
    [...table.querySelectorAll('thead th')].forEach((th, i) => {
      if (!SORT_COLS[key][i]) return;
      th.classList.add('sortable'); th.tabIndex = 0; th.setAttribute('role', 'button');
      if (!th.querySelector('.sar')) th.insertAdjacentHTML('beforeend', '<span class="sar" aria-hidden="true">▲</span>');
      const go = () => {
        const s = SORT[key]; if (s.i === i) s.d *= -1; else { s.i = i; s.d = 1; }
        [...table.querySelectorAll('thead th')].forEach(h => h.removeAttribute('aria-sort'));
        th.setAttribute('aria-sort', s.d === 1 ? 'ascending' : 'descending');
        reRender();
      };
      th.onclick = go;
      th.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
    });
  }

  /* ===================== KPI 스파크라인 (미니 추세) ===================== */
  function spark(seed, up) {
    const n = 22, pts = []; let v = 46;
    for (let i = 0; i < n; i++) { v += (Math.sin(seed + i * 0.6) + Math.cos(seed * 1.7 + i * 0.33)) * 7 + (up ? 1.4 : -1.4); v = Math.max(10, Math.min(90, v)); pts.push(v); }
    const W = 200, H = 30, col = up ? '#22c55e' : '#ef4444';
    const line = pts.map((p, i) => `${(i / (n - 1) * W).toFixed(1)},${(H - p / 100 * H).toFixed(1)}`).join(' ');
    const u = 'spk' + Math.round(seed * 97);
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".30"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><polyline points="0,${H} ${line} ${W},${H}" fill="url(#${u})"/><polyline points="${line}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/></svg>`;
  }
  function injectSparklines() {
    $$('.am-metrics .metric').forEach((m, i) => { if (!m.querySelector('.spark')) m.insertAdjacentHTML('beforeend', spark(i * 1.3 + 0.6, true)); });
  }
  // 모바일 카드 모드: thead 라벨을 각 td에 data-label 로 부여 + 첫 셀은 카드 헤더
  function labelTable(tb) {
    if (!tb) return;
    const heads = [...tb.closest('table').querySelectorAll('thead th')].map(th => th.textContent.trim());
    tb.querySelectorAll('tr').forEach(tr => {
      const cells = [...tr.children];
      if (cells.length === 1 && cells[0].hasAttribute('colspan')) return;   // 빈 행
      cells.forEach((td, i) => { if (heads[i]) td.setAttribute('data-label', heads[i]); });
      if (cells[0]) cells[0].classList.add('cell-head');
    });
  }

  /* ===================== 인터랙션 바인딩 ===================== */
  // 검색 + 필터
  $('#apps-q')?.addEventListener('input', e => { appsQ = e.target.value.trim(); renderApps(); });
  segGroup('#apps-filter', f => { appsFilter = f; renderApps(); });
  $('#deps-q')?.addEventListener('input', e => { depsQ = e.target.value.trim(); renderDeposits(); });
  segGroup('#deps-filter', f => { depsFilter = f; renderDeposits(); });
  $('#ops-q')?.addEventListener('input', e => { opsQ = e.target.value.trim(); renderOperators(); });
  segGroup('#ops-filter', f => { opsFilter = f; renderOperators(); });

  // 분배 / 정산
  $('#ad-run')?.addEventListener('click', runDistribution);
  $('#ad-auto')?.addEventListener('change', e => toast(e.target.checked ? '자동 분배 활성화' : '자동 분배 해제'));
  $('#ar-run')?.addEventListener('click', runSettlement);

  // 토큰: 스왑 비율 / 발행·소각
  $('#swap-save')?.addEventListener('click', () => {
    const r = parseFloat($('#swap-ratio').value);
    const active = $('#swap-active').checked;
    if (active && (!r || r <= 0)) { toast('유효한 스왑 비율을 입력하세요', 'err'); return; }
    S.swap = { ratio: r || null, active };
    pushLog('i-arrow-ur', active ? `스왑 비율 설정 1 XONT=${r} TONX` : '스왑 비활성');
    toast(active ? `스왑 비율 저장 · 1 XONT = ${r} TONX (활성)` : '스왑 비율 저장 (비활성)');
    renderToken();
  });
  let mbToken = 'XONT';
  segGroup('#mb-token', t => { mbToken = t; $('#mb-unit').textContent = t; });
  $('#mb-mint')?.addEventListener('click', () => mintBurn(1));
  $('#mb-burn')?.addEventListener('click', () => mintBurn(-1));
  function mintBurn(sign) {
    const amt = parseFloat(($('#mb-amt').value || '').replace(/,/g, ''));
    if (!amt || amt <= 0) { toast('수량을 입력하세요', 'err'); return; }
    if (mbToken === 'XONT') { S.xontSupply += sign * amt; S.xontCirc += sign * amt; }
    else { S.tonxTotal += sign * amt; }
    pushLog(sign > 0 ? 'i-plus' : 'i-flame', `${mbToken} ${sign > 0 ? '발행' : '소각'} ${fmt(amt)}`);
    toast(`${mbToken} ${fmt(amt)} ${sign > 0 ? '발행' : '소각'} 완료`);
    $('#mb-amt').value = ''; renderToken();
  }

  // 지갑: 주소 복사 / 교체
  $('#adm-copy-addr')?.addEventListener('click', () => {
    const txt = S.depositAddress;
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => toast('입금 주소를 복사했습니다'), () => toast('입금 주소를 복사했습니다'));
  });
  $('#addr-save')?.addEventListener('click', () => {
    const v = ($('#new-addr').value || '').trim();
    if (!/^T[A-Za-z0-9]{20,}$/.test(v)) { toast('올바른 TRC20 주소를 입력하세요 (T...)', 'err'); return; }
    S.depositAddress = v;
    const depAddr = $('#dep-addr'); if (depAddr) depAddr.textContent = v;   // 신청 모달에도 반영
    pushLog('i-key', '입금 주소 교체');
    toast('입금 주소를 교체했습니다 · 신청 모달에 즉시 반영');
    $('#new-addr').value = ''; renderWallets();
  });

  // 설정 저장
  $('#set-save')?.addEventListener('click', () => {
    S.cap1 = parseInt(($('#set-cap1').value || '').replace(/,/g, '')) || S.cap1;
    pushLog('i-settings', '플랫폼 설정 변경');
    toast('설정이 저장되었습니다 (데모)');
    renderOverview();
  });
  $('#set-maint')?.addEventListener('change', e => toast(e.target.checked ? '점검 모드 ON · 사용자 구매 일시 중지' : '점검 모드 OFF', e.target.checked ? 'err' : 'ok'));

  /* ===================== 라이브 틱 (가벼운 데모 갱신) ===================== */
  setInterval(() => {
    S.tonxToday += 186 * 1.4;
    S.tonxTotal += 186 * 1.4;
    S.pool += S.poolRate * 1.4;
    if (!$('[data-panel="distribute"]').hidden) renderDist();
    if (!$('[data-panel="adrev"]').hidden) renderAdrev();
    if (!$('[data-panel="token"]').hidden) renderToken();
    if (!$('[data-panel="overview"]').hidden) $('#o-pool').textContent = '$' + fmt(S.pool);
  }, 1400);

  /* ===================== 초기 렌더 ===================== */
  renderOverview(); renderApps(); renderDeposits(); renderOperators();
  renderDist(); renderAdrev(); renderToken(); renderWallets();
  injectSparklines();
  bindSort('apps', 'apps-body', renderApps);
  bindSort('deps', 'deps-body', renderDeposits);
  bindSort('ops', 'ops-body', renderOperators);
})();
