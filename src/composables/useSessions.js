import { ref, readonly } from 'vue';
import { supabase } from '@/lib/supabase.js';

function mapSession(row) {
  return {
    id: row.id, title: row.title, date: row.date, time: row.time,
    location: row.location, venue: row.venue, type: row.type || '',
    limit: row.limit_total || 0, maleLimit: row.male_limit || 0, femaleLimit: row.female_limit || 0,
    equipment: row.equipment || [], note: row.note,
    isOpen: row.is_open, isPrivate: row.is_private, cancelled: row.cancelled,
    openAt: row.open_at, closeAt: row.close_at,
    createdBy: row.created_by, creatorName: row.creator_name, creatorPhoto: row.creator_photo,
    createdAt: row.created_at,
  };
}

export function mapSignup(row) {
  return {
    id: row.id, sessionId: row.session_id, uid: row.uid, name: row.name,
    isLate: row.is_late, lateTime: row.late_minutes,
    forFriend: row.friend_name || '', pairWith: row.pair, bringEquip: row.bring_equip || [],
    gender: row.gender || '', friendGender: row.friend_gender || '',
    forceConfirmed: row.force_confirmed, forceWaitlisted: row.force_waitlisted,
    signedAt: row.signed_at,
  };
}

export function sessionToRow(data) {
  return {
    title: data.title, date: data.date, time: data.time, location: data.location,
    venue: data.venue, type: data.type, limit_total: data.limit,
    male_limit: data.maleLimit, female_limit: data.femaleLimit,
    equipment: data.equipment, note: data.note, is_open: data.isOpen,
    is_private: data.isPrivate, open_at: data.openAt, close_at: data.closeAt,
    created_by: data.createdBy, creator_name: data.creatorName, creator_photo: data.creatorPhoto,
  };
}

export function signupToRow(data) {
  return {
    session_id: data.sessionId, uid: data.uid, name: data.name,
    is_late: data.isLate || false, late_minutes: data.lateTime || null,
    is_friend: data.forFriend ? true : false, friend_name: data.forFriend || null,
    pair: data.pairWith || null, bring_equip: data.bringEquip || [],
    gender: data.gender || '', friend_gender: data.friendGender || '',
    force_confirmed: false, force_waitlisted: false,
  };
}

export function useSessions() {
  const sessions = ref([]);
  const loading = ref(true);

  const dateFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  async function fetchSessions() {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .gte('date', dateFrom)
      .order('date', { ascending: true });
    sessions.value = (data || []).map(mapSession);
    loading.value = false;
  }

  fetchSessions();

  supabase
    .channel('sessions-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchSessions)
    .subscribe();

  return { sessions: readonly(sessions), loading: readonly(loading), fetchSessions };
}
