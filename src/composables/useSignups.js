import { ref, onUnmounted } from 'vue';
import { supabase } from '@/lib/supabase.js';
import { mapSignup } from './useSessions.js';

export function useSignups(sessionId, { limit, maleLimit, femaleLimit }) {
  const signups = ref([]);
  let channel = null;

  async function fetchSignups() {
    const { data } = await supabase
      .from('signups')
      .select('*')
      .eq('session_id', sessionId)
      .order('signed_at', { ascending: true });
    signups.value = (data || []).map((row, i) => ({ ...mapSignup(row), position: i + 1 }));
    computeGenderPositions();
  }

  function computeGenderPositions() {
    if (!maleLimit && !femaleLimit) return;
    let maleCount = 0, femaleCount = 0;
    signups.value.forEach(s => {
      if (s.gender === 'male') {
        maleCount++;
        s.genderPosition = maleCount;
        s.genderWait = !s.forceConfirmed && (s.forceWaitlisted || (maleLimit > 0 && maleCount > maleLimit));
      } else if (s.gender === 'female') {
        femaleCount++;
        s.genderPosition = femaleCount;
        s.genderWait = !s.forceConfirmed && (s.forceWaitlisted || (femaleLimit > 0 && femaleCount > femaleLimit));
      } else {
        s.genderWait = !s.forceConfirmed && !!s.forceWaitlisted;
      }
    });
  }

  channel = supabase
    .channel('signups-' + sessionId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'signups', filter: `session_id=eq.${sessionId}` }, fetchSignups)
    .subscribe();

  fetchSignups();

  onUnmounted(() => {
    if (channel) supabase.removeChannel(channel);
  });

  return { signups };
}
