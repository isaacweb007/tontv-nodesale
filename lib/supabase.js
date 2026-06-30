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

/* 연결 확인용 — 공개 테이블(platform_stats) 1행 */
export async function pingSupabase() {
  const { data, error } = await supabase
    .from('platform_stats').select('viewers, subscribers, advertisers, updated_at').eq('id', 1).single();
  if (error) throw error;
  return data;
}
