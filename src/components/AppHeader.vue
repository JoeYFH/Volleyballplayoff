<template>
  <div class="sticky top-0 z-20 bg-gray-50 px-4 pt-4 pb-3 border-b border-gray-100">
    <div class="max-w-2xl mx-auto flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <span class="text-2xl shrink-0">🏐</span>
        <div class="hidden sm:block min-w-0">
          <h1 class="text-xl font-bold text-indigo-800 truncate">{{ t('appTitle') }}</h1>
          <p class="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <span class="w-1.5 h-1.5 bg-green-400 rounded-full inline-block animate-pulse"></span>
            <span>{{ t('liveUpdate') }}</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <button
          @click="toggleLang"
          class="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition shadow-sm"
        >
          {{ lang === 'zh' ? 'EN' : '中' }}
        </button>

        <template v-if="!user">
          <button
            @click="signInWithGoogle"
            class="flex items-center gap-1.5 border border-gray-200 bg-white rounded-xl px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 active:scale-95 transition shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-4 h-4" />
            {{ t('googleLogin') }}
          </button>
        </template>

        <template v-else>
          <div class="flex items-center gap-2">
            <img v-if="photoURL" :src="photoURL" referrerpolicy="no-referrer" class="w-8 h-8 rounded-full border border-white shadow-sm shrink-0" onerror="this.style.display='none'" />
            <div class="flex flex-col items-start gap-0.5">
              <div class="flex items-center gap-1.5">
                <p class="text-xs font-medium text-gray-700 max-w-[80px] truncate leading-none">{{ displayName }}</p>
                <span v-if="isAdmin()" class="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium leading-none">
                  {{ t('adminBadge') }}
                </span>
              </div>
              <button @click="signOut" class="text-[11px] text-gray-400 hover:text-red-400 transition leading-none">
                {{ t('logout') }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from '@/lib/i18n.js';
import { useAuth } from '@/composables/useAuth.js';

const { lang, t, setLang } = useI18n();
const { user, isAdmin, signInWithGoogle, signOut } = useAuth();

const photoURL = computed(() =>
  user.value?.user_metadata?.avatar_url
  || user.value?.identities?.[0]?.identity_data?.avatar_url
  || null
);
const displayName = computed(() =>
  user.value?.user_metadata?.full_name
  || user.value?.user_metadata?.name
  || user.value?.identities?.[0]?.identity_data?.full_name
  || user.value?.email || ''
);

function toggleLang() {
  setLang(lang.value === 'zh' ? 'en' : 'zh');
}
</script>
