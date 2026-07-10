/* ============================================================
   TonTV — Supabase 클라이언트 + 인증 헬퍼 (정적 사이트용 · 빌드 불필요)
   ESM CDN로 supabase-js를 불러와 공용 클라이언트를 만든다.
   사용:  <script type="module">
            import { supabase, signUpOperator, signIn } from './lib/supabase.js'
   ============================================================ */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://dilkbnmxuosoduhctlwo.supabase.co';

/* Publishable(anon) 키 — 브라우저 공개용. 데이터 보호는 RLS가 담당.
   ⚠️ service_role(시크릿) 키는 절대 프런트엔드에 넣지 마세요. */
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xibJ_42kFIHh1PVXn9qP2g_9vfHcK9y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,       // 멀티 페이지 사이트라 로그인 유지 필요
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

/* ---------------- 인증 헬퍼 ---------------- */

// 회원가입: Auth 사용자 생성 → DB 트리거가 node_operators 프로필 자동 생성 → 즉시 로그인
export async function signUpOperator({ name, contact, email, password, phone, referralCode }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name || '',
        contact: contact || '',
        phone: phone || '',
        referred_by_code: (referralCode || '').trim(),
      },
    },
  });
  if (error) throw error;

  // '이메일 자동확인' 트리거 덕분에 바로 로그인 가능. 세션이 없으면 직접 로그인.
  let session = data.session;
  if (!session) {
    const { data: si, error: e2 } = await supabase.auth.signInWithPassword({ email, password });
    if (e2) throw e2;
    session = si.session;
  }
  return { user: data.user, session };
}

// 로그인 (이메일 + 비밀번호)
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// 비밀번호 변경 — 현재 비번 재인증 후 변경
export async function changePassword({ currentPassword, newPassword }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) throw new Error('로그인이 필요합니다.');
  if (!newPassword || newPassword.length < 6) throw new Error('새 비밀번호는 6자 이상이어야 합니다.');
  // 현재 비밀번호 검증(재로그인)
  const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verifyErr) throw new Error('현재 비밀번호가 올바르지 않습니다.');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return true;
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// 로그인한 사용자의 프로필(node_operators) 조회
export async function getMyProfile() {
  const { data, error } = await supabase
    .from('node_operators')
    .select('display_name, email, phone, contact, referral_code, referred_by_code, kyc_status, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/* ---------------- 노드 신청 / 입금 ---------------- */
export const NODE_PRICE_USDT = 1000;

// 신청 플랜 (베이직/플러스/프로/맥스) · 노드 1개 = $1,000 · bonus = 추가 XONT %
export const TIERS = {
  basic: { code: 'basic', name: '베이직', en: 'Basic', price: 1000,  nodes: 1,  bonus: 0 },
  plus:  { code: 'plus',  name: '플러스', en: 'Plus',  price: 3000,  nodes: 3,  bonus: 5 },
  pro:   { code: 'pro',   name: '프로',   en: 'Pro',   price: 5000,  nodes: 5,  bonus: 7 },
  max:   { code: 'max',   name: '맥스',   en: 'Max',   price: 10000, nodes: 10, bonus: 10 },
};

// 로그인한 사용자의 operator id
export async function getMyOperatorId() {
  const { data, error } = await supabase
    .from('node_operators').select('id').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data ? data.id : null;
}

// 노드 신청 = deposits에 pending 기록 생성 (어드민 승인 시 노드 자동 생성)
export async function createNodeApplication({ tier, network = 'TRC20' }) {
  const t = TIERS[tier] || TIERS.basic;
  const opId = await getMyOperatorId();
  if (!opId) throw new Error('로그인이 필요합니다.');
  const { data, error } = await supabase.from('deposits').insert({
    operator_id: opId, quantity: t.nodes, amount_usdt: t.price, network, status: 'pending', tier: t.name,
  }).select().single();
  if (error) throw error;
  return data;
}

// 본인 신청(입금) 내역
export async function getMyDeposits() {
  const { data, error } = await supabase
    .from('deposits').select('id, quantity, amount_usdt, status, created_at, tier').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* ---------------- 토크노믹스 / 지갑 / 스테이킹 ---------------- */

// 토큰/세일 설정 (공개 읽기)
export async function getTokenConfig() {
  const { data, error } = await supabase.from('token_config').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

// 오늘 채굴 집계 (공개)
export async function getMiningToday() {
  const { data } = await supabase.from('mining_daily').select('*').order('day', { ascending: false }).limit(1).maybeSingle();
  return data || null;
}

// 본인 XONT 잔액
export async function getWalletBalance() {
  const { data } = await supabase.from('wallet_balances').select('xont_balance').maybeSingle();
  return data ? Number(data.xont_balance) : 0;
}

// XONT · USDT 잔액 (영업수당·스테이킹 USDT는 USDT 원장에 적립)
export async function getWalletBalances() {
  const { data } = await supabase.from('wallet_balances').select('xont_balance, usdt_balance').maybeSingle();
  return { xont: data ? Number(data.xont_balance) : 0, usdt: data ? Number(data.usdt_balance) : 0 };
}

// 본인 USDT 내역 (추천수당 · 스테이킹 지급)
export async function getMyUsdtTx(limit = 100) {
  const { data, error } = await supabase.from('usdt_transactions')
    .select('amount, direction, kind, counterparty, level, created_at')
    .order('created_at', { ascending: false }).limit(limit);
  if (error) throw error; return data || [];
}

// 본인 노드 수
export async function getMyNodeCount() {
  const { data } = await supabase.from('nodes').select('id');
  return data ? data.length : 0;
}

// 본인 스테이킹 목록
export async function getMyStakes() {
  const { data, error } = await supabase
    .from('staking')
    .select('id, amount, months, apy, started_at, ends_at, status, principal_usdt, usdt_rate_pct, xont_rate_pct, months_paid, payout_months')
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/* 자발적 XONT 스테이킹(연 60% · 락업 1년)은 DAO 정책표에 없는 상품이라 제거했다.
   스테이킹은 노드 구매 확정 시 자동 생성되는 6개월 리워드 프로그램뿐이며,
   생성은 서버 트리거(on_deposit_confirmed)가 담당한다. */

// 어드민: 설정값 변경 (스테이킹 APY 등) — RLS로 관리자만
export async function adminUpdateConfig(patch) {
  const { data, error } = await supabase.from('token_config')
    .update(patch).eq('id', 1).select().single();
  if (error) throw error;
  return data;
}

/* 연결 확인용 — 공개 테이블(platform_stats) 1행 */
export async function pingSupabase() {
  const { data, error } = await supabase
    .from('platform_stats').select('viewers, subscribers, advertisers, updated_at').eq('id', 1).single();
  if (error) throw error;
  return data;
}

/* 입금 주소 (공개 읽기 — 모달/대시보드가 DB에서 읽음) */
export async function getDepositAddresses() {
  const { data } = await supabase.from('token_config')
    .select('deposit_addr_tron, deposit_addr_evm').eq('id', 1).maybeSingle();
  return data || null;
}

/* 비밀번호 복구 신청 (비로그인 유저 — anon insert) */
export async function submitPasswordResetRequest(email) {
  const { error } = await supabase.from('password_reset_requests').insert({ email: (email || '').trim() });
  if (error) throw error;
  return true;
}

/* ============================================================
   관리자(admin) API — 전부 RLS/함수로 is_admin() 게이팅
   ============================================================ */

export async function isAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from('node_operators').select('is_admin').eq('auth_user_id', user.id).maybeSingle();
  return !!(data && data.is_admin);
}

// 개요 KPI
export async function adminStats() {
  const cfg = await getTokenConfig();
  const [{ data: deps }, { count: opCount }, { count: nodeCount }, { count: pendingWd }] = await Promise.all([
    supabase.from('deposits').select('amount_usdt, status'),
    supabase.from('node_operators').select('id', { count: 'exact', head: true }),
    supabase.from('nodes').select('id', { count: 'exact', head: true }),
    supabase.from('withdrawals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  const d = deps || [];
  return {
    cfg,
    opCount: opCount || 0,
    nodeCount: nodeCount || 0,
    pendingApps: d.filter((x) => x.status === 'pending').length,
    depositTotal: d.filter((x) => x.status === 'confirmed').reduce((a, x) => a + Number(x.amount_usdt || 0), 0),
    pendingWithdrawals: pendingWd || 0,
  };
}

// 매출 승인 (노드 신청·입금)
export async function adminListDeposits() {
  const { data, error } = await supabase.from('deposits')
    .select('id, quantity, amount_usdt, network, tx_hash, status, created_at, confirmed_at, tier, node_operators(display_name, email, phone)')
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw error; return data || [];
}
export async function adminSetDepositStatus(id, status, txHash) {
  const patch = { status };
  if (txHash !== undefined) patch.tx_hash = txHash;
  const { error } = await supabase.from('deposits').update(patch).eq('id', id);
  if (error) throw error; return true;
}

// 회원(사업자) 관리
export async function adminListOperators() {
  const { data, error } = await supabase.from('node_operators')
    .select('id, display_name, email, phone, status, is_admin, is_center_head, kyc_status, referral_code, referred_by_code, created_at, nodes(count), wallet_balances(xont_balance)')
    .order('created_at', { ascending: false }).limit(500);
  if (error) throw error;
  return (data || []).map((o) => ({
    ...o,
    node_count: Array.isArray(o.nodes) && o.nodes[0] ? Number(o.nodes[0].count) : 0,
    xont_balance: Array.isArray(o.wallet_balances) && o.wallet_balances[0] ? Number(o.wallet_balances[0].xont_balance) : 0,
  }));
}
export async function adminUpdateOperator(id, patch) {
  const { error } = await supabase.from('node_operators').update(patch).eq('id', id);
  if (error) throw error; return true;
}

// 신규 관리자 계정 생성 (이메일 + 비밀번호) — service_role 필요, edge function 경유
export async function adminCreateAdmin({ email, password, display_name }) {
  const { data, error } = await supabase.functions.invoke('admin-create-admin', { body: { email, password, display_name } });
  if (error) throw error;
  if (data && data.error) throw new Error(data.error);
  return data; // { id, email, display_name }
}

// 대시보드 성장 추이용: 가입일자만 경량 조회
export async function adminOperatorGrowth() {
  const { data, error } = await supabase.from('node_operators').select('created_at').order('created_at', { ascending: true }).limit(5000);
  if (error) throw error;
  return data || [];
}

// 조직도 (2단계 추천)
export async function adminListReferrals() {
  const { data, error } = await supabase.from('referrals')
    .select('id, level, reward_xont, created_at, referrer:node_operators!referrer_id(display_name, email), referee:node_operators!referee_id(display_name, email)')
    .order('created_at', { ascending: false }).limit(500);
  if (error) throw error; return data || [];
}

// 영업수당 내역 — 노드 판매금액 기준 USDT 지급
//   추천수당: 1대 15% · 2대 5%   ·   총판 센터장: 10% (최근접 상위 센터장)
export async function adminListReferralCommissions() {
  const { data, error } = await supabase.from('usdt_transactions')
    .select('amount, counterparty, kind, level, created_at, node_operators(display_name, email)')
    .in('kind', ['referral', 'center_head']).eq('direction', 'in')
    .order('created_at', { ascending: false }).limit(500);
  if (error) throw error; return data || [];
}

// 조직도 트리·그래프 — 전체 사업자를 referred_by(스폰서) 체인 그대로 반환
export async function adminOrgTree() {
  const { data, error } = await supabase.from('node_operators')
    .select('id, display_name, email, referred_by, referral_code, is_center_head, created_at, nodes(count)')
    .order('created_at', { ascending: true }).limit(2000);
  if (error) throw error;
  return (data || []).map((o) => ({
    ...o,
    node_count: Array.isArray(o.nodes) && o.nodes[0] ? Number(o.nodes[0].count) : 0,
  }));
}

// 노드
export async function adminListNodes() {
  const { data, error } = await supabase.from('nodes')
    .select('id, status, price_usdt, purchased_at, activated_at, node_operators(display_name, email)')
    .order('purchased_at', { ascending: false }).limit(300);
  if (error) throw error; return data || [];
}
export async function adminSetNodeStatus(id, status) {
  const patch = { status };
  if (status === 'active') patch.activated_at = new Date().toISOString();
  const { error } = await supabase.from('nodes').update(patch).eq('id', id);
  if (error) throw error; return true;
}

// 스테이킹
export async function adminListStakes() {
  const { data, error } = await supabase.from('staking')
    .select('id, amount, months, apy, started_at, ends_at, status, principal_usdt, usdt_rate_pct, xont_rate_pct, months_paid, payout_months, node_operators(display_name, email)')
    .order('started_at', { ascending: false }).limit(300);
  if (error) throw error; return data || [];
}
export async function adminPayStakeMonth(id) {
  const { error } = await supabase.rpc('admin_pay_stake_month', { p_id: id });
  if (error) throw error; return true;
}

// 출금
export async function adminListWithdrawals() {
  const { data, error } = await supabase.from('withdrawals')
    .select('id, amount_xont, usd_equiv, wtype, address, network, status, memo, requested_at, processed_at, node_operators(display_name, email)')
    .order('requested_at', { ascending: false }).limit(300);
  if (error) throw error; return data || [];
}
export async function adminProcessWithdrawal(id, status) {
  const { error } = await supabase.rpc('admin_process_withdrawal', { p_id: id, p_status: status });
  if (error) throw error; return true;
}

// 영업수당 출금 등록(정산관리 → 출금관리로 전달). USDT 정산이므로 amount_xont는 감사·표시용 환산치만 저장(지급 시 XONT 지갑 차감 없음).
export async function adminRequestCommissionWithdrawal(operatorId, usdAmount, memo) {
  const cfg = await getTokenConfig();
  const xontEquiv = Number(usdAmount) / Number(cfg.xont_price_usd || 1);
  const { error } = await supabase.from('withdrawals').insert({
    operator_id: operatorId, amount_xont: xontEquiv, usd_equiv: usdAmount, wtype: 'commission', status: 'pending', memo: memo || '영업수당 출금',
  });
  if (error) throw error; return true;
}

// 보상 실행 (XONT 적립 · 오프체인)
export async function adminCreditReward(operatorId, xont, memo) {
  const { error } = await supabase.rpc('admin_credit_reward', { p_operator: operatorId, p_xont: xont, p_memo: memo || null });
  if (error) throw error; return true;
}

// 지갑 트랜잭션 원장
export async function adminListTransactions() {
  const { data, error } = await supabase.from('xont_transactions')
    .select('id, amount, direction, kind, counterparty, created_at, node_operators(display_name)')
    .order('created_at', { ascending: false }).limit(150);
  if (error) throw error; return data || [];
}

// 공지
export async function adminListAnnouncements() {
  const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
  if (error) throw error; return data || [];
}
export async function adminSaveAnnouncement(a) {
  const row = { title: a.title, body: a.body || '', pinned: !!a.pinned, published: a.published !== false };
  const q = a.id ? supabase.from('announcements').update(row).eq('id', a.id) : supabase.from('announcements').insert(row);
  const { error } = await q; if (error) throw error; return true;
}
export async function adminDeleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error; return true;
}

// 계정 복구
export async function adminListResetRequests() {
  const { data, error } = await supabase.from('password_reset_requests')
    .select('id, email, status, note, requested_at, processed_at, node_operators(display_name)')
    .order('requested_at', { ascending: false }).limit(200);
  if (error) throw error; return data || [];
}
export async function adminRecoverPassword(email, requestId) {
  const { data, error } = await supabase.functions.invoke('admin-recover-password', { body: { email, request_id: requestId } });
  if (error) throw error;
  if (data && data.error) throw new Error(data.error);
  return data; // { action_link, email }
}
export async function adminSetResetStatus(id, status) {
  const { error } = await supabase.from('password_reset_requests').update({ status, processed_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error; return true;
}

// 감사 로그
export async function adminListAudit() {
  const { data, error } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error; return data || [];
}

/* ============================================================
   보상플랜 (추천수당 · 보너스) — 설정 가능한 골격
   직급/승급 사다리는 없음. 총판 센터장은 node_operators.is_center_head 지정 역할.
   공개 read(active) / 관리자 write. 값은 어드민에서 입력.
   ============================================================ */

export async function getCommissionLevels() {
  const { data } = await supabase.from('commission_levels').select('*').order('level', { ascending: true });
  return data || [];
}
export async function getBonusRules() {
  const { data } = await supabase.from('bonus_rules').select('*').order('sort_order', { ascending: true });
  return data || [];
}
// 본인 조직 요약 (SECURITY DEFINER 함수 — 하위 수·추천수당·총판센터장 여부)
export async function getMyReferralSummary() {
  const { data, error } = await supabase.rpc('my_referral_summary');
  if (error) throw error;
  return (data && data[0]) || { referral_code: '', downline_count: 0, referral_earned: 0, is_center_head: false };
}

/* ---------------- 마이오피스 (계보도 · 조직 실적 · 수당) ---------------- */
export async function getMyDownlineTree(maxDepth = 6) {
  const { data, error } = await supabase.rpc('my_downline_tree', { p_max_depth: maxDepth });
  if (error) throw error; return data || [];
}
export async function getMyOrgStats() {
  const { data, error } = await supabase.rpc('my_org_stats');
  if (error) throw error;
  return (data && data[0]) || { direct_count: 0, total_count: 0, group_nodes: 0, my_nodes: 0 };
}
// 본인 노드 배당수익 누적 (xont_transactions kind='settlement' — 노드 구매 시 지급된 XONT)
export async function getMyNodeDividends() {
  const { data } = await supabase.from('xont_transactions')
    .select('amount, created_at')
    .eq('kind', 'settlement').eq('direction', 'in')
    .order('created_at', { ascending: false }).limit(200);
  return data || [];
}
export async function getMyCommissions() {
  const { data } = await supabase.from('xont_transactions')
    .select('amount, direction, kind, counterparty, created_at')
    .in('kind', ['referral', 'reward']).order('created_at', { ascending: false }).limit(100);
  return data || [];
}

// 관리자: 추천수당 레벨 CRUD
export async function adminListCommissionLevels() {
  const { data, error } = await supabase.from('commission_levels').select('*').order('level', { ascending: true });
  if (error) throw error; return data || [];
}
export async function adminSaveCommissionLevel(c) {
  const row = { level: +c.level, rate_pct: +c.rate_pct || 0, label: c.label || null, active: c.active !== false };
  const { error } = await supabase.from('commission_levels').upsert(row, { onConflict: 'level' });
  if (error) throw error; return true;
}
export async function adminDeleteCommissionLevel(level) {
  const { error } = await supabase.from('commission_levels').delete().eq('level', level);
  if (error) throw error; return true;
}

// 관리자: 보너스 규칙 CRUD
export async function adminListBonusRules() {
  const { data, error } = await supabase.from('bonus_rules').select('*').order('sort_order', { ascending: true });
  if (error) throw error; return data || [];
}
export async function adminSaveBonusRule(b) {
  const row = { code: b.code || null, name: b.name, kind: b.kind || 'custom', rate_pct: +b.rate_pct || 0, sort_order: +b.sort_order || 0, active: b.active !== false };
  const q = b.id ? supabase.from('bonus_rules').update(row).eq('id', b.id) : supabase.from('bonus_rules').insert(row);
  const { error } = await q; if (error) throw error; return true;
}
export async function adminDeleteBonusRule(id) {
  const { error } = await supabase.from('bonus_rules').delete().eq('id', id);
  if (error) throw error; return true;
}

// 관리자: 회원(노드 구매자) 상세 — 가입정보·조직·노드·스테이킹·재무 전체
export async function adminOperatorDetail(id) {
  const [{ data: op }, { data: down }, { data: nodes }, { data: stakes }, { data: bal }, { data: tx }, { data: deps }, { data: utx }] = await Promise.all([
    supabase.from('node_operators').select('id, display_name, email, phone, contact, wallet_address, status, is_admin, is_center_head, kyc_status, referral_code, referred_by, referred_by_code, created_at').eq('id', id).maybeSingle(),
    supabase.from('node_operators').select('id, display_name, email, phone, created_at, referral_code').eq('referred_by', id).order('created_at', { ascending: false }),
    supabase.from('nodes').select('id, status, price_usdt, purchased_at').eq('operator_id', id).order('purchased_at', { ascending: false }),
    supabase.from('staking').select('id, amount, months, apy, status, started_at, ends_at, principal_usdt, usdt_rate_pct, xont_rate_pct, months_paid, payout_months').eq('operator_id', id).order('started_at', { ascending: false }),
    supabase.from('wallet_balances').select('xont_balance, usdt_balance, updated_at').eq('operator_id', id).maybeSingle(),
    supabase.from('xont_transactions').select('amount, direction, kind, counterparty, created_at').eq('operator_id', id).order('created_at', { ascending: false }).limit(40),
    supabase.from('deposits').select('id, tier, quantity, amount_usdt, network, status, created_at').eq('operator_id', id).order('created_at', { ascending: false }),
    supabase.from('usdt_transactions').select('amount, direction, kind, counterparty, level, created_at').eq('operator_id', id).order('created_at', { ascending: false }).limit(40),
  ]);
  let upline = null;
  if (op && op.referred_by) {
    const { data: up } = await supabase.from('node_operators').select('display_name, email, phone, referral_code').eq('id', op.referred_by).maybeSingle();
    upline = up || null;
  }
  const txs = tx || [];
  const utxs = utx || [];
  const sumKind = (k) => txs.filter((t) => t.kind === k && t.direction === 'in').reduce((a, t) => a + Number(t.amount), 0);
  const sumUsdt = (k) => utxs.filter((t) => t.kind === k && t.direction === 'in').reduce((a, t) => a + Number(t.amount), 0);
  const stk = stakes || [];
  const finance = {
    balance: bal ? Number(bal.xont_balance) : 0,
    usdtBalance: bal ? Number(bal.usdt_balance) : 0,
    balanceUpdated: bal ? bal.updated_at : null,
    grantedXont: sumKind('settlement'),        // 노드 지급 누적
    referralUsdt: sumUsdt('referral'),         // 추천수당 누적 (USDT)
    centerHeadUsdt: sumUsdt('center_head'),    // 총판 센터장 수당 누적 (USDT)
    stakingUsdt: sumUsdt('staking_payout'),    // 스테이킹 USDT 지급 누적
    rewardXont: sumKind('reward'),             // 보상 누적
    stakedActive: stk.filter((s) => s.status === 'active').reduce((a, s) => a + Number(s.amount), 0),
    depositUsdt: (deps || []).filter((d) => d.status === 'confirmed').reduce((a, d) => a + Number(d.amount_usdt), 0),
  };
  return { op, upline, downline: down || [], nodes: nodes || [], stakes: stk, deposits: deps || [], tx: txs, usdtTx: utxs, finance };
}

/* ---------------- 매출 배분 (revenue_allocations) ---------------- */
// 공개: 대시보드 투명성 표시
export async function getRevenueAllocations() {
  const { data } = await supabase.from('revenue_allocations').select('*').order('sort_order', { ascending: true });
  return data || [];
}
export async function adminListRevenueAllocations() {
  const { data, error } = await supabase.from('revenue_allocations').select('*').order('sort_order', { ascending: true });
  if (error) throw error; return data || [];
}
export async function adminSaveRevenueAllocation(a) {
  const row = { group_name: a.group_name, item_name: a.item_name, pct: +a.pct || 0, kind: a.kind || 'other', note: a.note || null, sort_order: +a.sort_order || 0, active: a.active !== false };
  const q = a.id ? supabase.from('revenue_allocations').update(row).eq('id', a.id) : supabase.from('revenue_allocations').insert(row);
  const { error } = await q; if (error) throw error; return true;
}
export async function adminDeleteRevenueAllocation(id) {
  const { error } = await supabase.from('revenue_allocations').delete().eq('id', id);
  if (error) throw error; return true;
}

/* ---------------- XONT ↔ TONX 스왑 ---------------- */
// 본인 스왑 요청
export async function requestXontSwap(amountXont) {
  const { data, error } = await supabase.rpc('request_xont_swap', { p_amount_xont: amountXont });
  if (error) throw error;
  return data; // 생성된 swap id
}
export async function getMySwaps() {
  const { data, error } = await supabase.from('xont_swaps')
    .select('id, amount_xont, ratio, status, requested_at, processed_at').order('requested_at', { ascending: false });
  if (error) throw error; return data || [];
}
// 어드민: 스왑 요청 목록/처리
export async function adminListSwaps() {
  const { data, error } = await supabase.from('xont_swaps')
    .select('id, amount_xont, ratio, status, requested_at, processed_at, node_operators(display_name, email)')
    .order('requested_at', { ascending: false }).limit(300);
  if (error) throw error; return data || [];
}
export async function adminProcessSwap(id, status) {
  const { error } = await supabase.rpc('admin_process_swap', { p_id: id, p_status: status });
  if (error) throw error; return true;
}

// 배분 현황용: 승인(확정)된 노드 판매(입금) 내역. 판매 시각은 confirmed_at 우선, 없으면 created_at.
export async function adminListConfirmedSales() {
  const { data, error } = await supabase.from('deposits')
    .select('id, operator_id, amount_usdt, quantity, tier, network, created_at, confirmed_at')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data || []).map((d) => ({ ...d, sale_at: d.confirmed_at || d.created_at }));
}

// 회원별 영업수당 정산 롤업 (본인매출·직접(1대)/소개(2대) 수당·수당잔액)
export async function adminSettlementByMember() {
  const [sales, opsRes, allocRes, wdRes] = await Promise.all([
    adminListConfirmedSales(),
    supabase.from('node_operators').select('id, display_name, email, referred_by'),
    supabase.from('revenue_allocations').select('item_name, pct').eq('kind', 'commission'),
    supabase.from('withdrawals').select('operator_id, usd_equiv, status, wtype').eq('wtype', 'commission'),
  ]);
  if (opsRes.error) throw opsRes.error;
  const alloc = allocRes.data || [];
  const l1pct = Number((alloc.find((a) => a.item_name === '영업 1대') || {}).pct || 0);
  const l2pct = Number((alloc.find((a) => a.item_name === '영업 2대') || {}).pct || 0);

  const salesByOp = {};
  sales.forEach((s) => { salesByOp[s.operator_id] = (salesByOp[s.operator_id] || 0) + Number(s.amount_usdt || 0); });

  const childrenOf = {};
  (opsRes.data || []).forEach((o) => { if (o.referred_by) (childrenOf[o.referred_by] = childrenOf[o.referred_by] || []).push(o.id); });

  const paidByOp = {};
  (wdRes.data || []).forEach((w) => { if (w.status === 'paid') paidByOp[w.operator_id] = (paidByOp[w.operator_id] || 0) + Number(w.usd_equiv || 0); });

  return (opsRes.data || []).map((o) => {
    const ownSales = salesByOp[o.id] || 0;
    const directIds = childrenOf[o.id] || [];
    const directSales = directIds.reduce((a, id) => a + (salesByOp[id] || 0), 0);
    const level2Ids = directIds.flatMap((id) => childrenOf[id] || []);
    const level2Sales = level2Ids.reduce((a, id) => a + (salesByOp[id] || 0), 0);
    const directCommission = directSales * l1pct / 100;
    const level2Commission = level2Sales * l2pct / 100;
    const totalCommission = directCommission + level2Commission;
    const paid = paidByOp[o.id] || 0;
    return {
      operator_id: o.id, display_name: o.display_name, email: o.email,
      own_sales_usdt: ownSales,
      direct_sales_usdt: directSales, direct_commission_usdt: directCommission,
      level2_sales_usdt: level2Sales, level2_commission_usdt: level2Commission,
      total_commission_usdt: totalCommission,
      paid_commission_usdt: paid,
      balance_commission_usdt: totalCommission - paid,
    };
  }).filter((r) => r.own_sales_usdt > 0 || r.direct_sales_usdt > 0 || r.level2_sales_usdt > 0);
}
