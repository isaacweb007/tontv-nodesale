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

// 신청 플랜 (베이직/프로/맥스)
export const TIERS = {
  basic: { code: 'basic', name: '베이직', en: 'Basic', price: 1000, nodes: 1 },
  pro:   { code: 'pro',   name: '프로',   en: 'Pro',   price: 2000, nodes: 2 },
  max:   { code: 'max',   name: '맥스',   en: 'Max',   price: 3000, nodes: 3 },
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

// 본인 노드 수
export async function getMyNodeCount() {
  const { data } = await supabase.from('nodes').select('id');
  return data ? data.length : 0;
}

// 본인 스테이킹 목록
export async function getMyStakes() {
  const { data, error } = await supabase
    .from('staking').select('id, amount, months, apy, started_at, ends_at, status').order('started_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// 스테이킹 생성 (APY·기본기간은 설정에서, 트리거가 잔액 차감·만기 설정)
export async function createStake({ amountXont, months }) {
  const opId = await getMyOperatorId();
  if (!opId) throw new Error('로그인이 필요합니다.');
  const cfg = await getTokenConfig();
  const m = months || cfg.staking_months_default || 12;
  const { data, error } = await supabase.from('staking').insert({
    operator_id: opId, amount: amountXont, months: m, apy: cfg.staking_apy,
  }).select().single();
  if (error) throw error;
  return data;
}

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
