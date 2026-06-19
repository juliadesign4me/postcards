import { supabase } from './supabaseClient.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(raw){
  return String(raw ?? '').trim().toLowerCase();
}

function isDuplicateError(error){
  if(!error) return false;
  const code = String(error.code ?? '');
  const message = String(error.message ?? '').toLowerCase();
  const details = String(error.details ?? '').toLowerCase();
  return code === '23505'
    || message.includes('duplicate')
    || message.includes('unique')
    || details.includes('duplicate')
    || details.includes('unique');
}

/** Calls join_waitlist RPC; duplicates are treated as success. */
export async function joinWaitlist(email){
  const p_email = normalizeEmail(email);
  if(!p_email || !EMAIL_RE.test(p_email)){
    throw new Error('Please enter a valid email address.');
  }

  const { error } = await supabase.rpc('join_waitlist', { p_email });
  if(!error) return { ok: true };

  if(isDuplicateError(error)){
    return { ok: true, duplicate: true };
  }

  throw error;
}
