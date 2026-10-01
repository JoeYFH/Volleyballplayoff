import { ref, readonly } from 'vue';
import { supabase, ADMIN_EMAILS } from '@/lib/supabase.js';

const user = ref(null);
const loading = ref(true);

supabase.auth.getSession().then(({ data }) => {
  user.value = data.session?.user ?? null;
  loading.value = false;
});

supabase.auth.onAuthStateChange((_event, session) => {
  user.value = session?.user ?? null;
  loading.value = false;
});

export function useAuth() {
  const isAdmin = () => ADMIN_EMAILS.includes(user.value?.email);

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });

  const signOut = () => supabase.auth.signOut();

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAdmin,
    signInWithGoogle,
    signOut,
  };
}
