<template>
  <div class="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4" @click.self="$emit('close')">
    <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl p-5 pb-8 sm:pb-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-gray-800">💬 {{ isZh ? '意見回饋' : 'Feedback' }}</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
      </div>

      <div v-if="submitted" class="text-center py-8">
        <div class="text-4xl mb-3">✅</div>
        <p class="font-semibold text-gray-700">{{ isZh ? '感謝您的回饋！' : 'Thanks for your feedback!' }}</p>
        <p class="text-sm text-gray-400 mt-1">{{ isZh ? '我們會盡快改善' : "We'll improve asap" }}</p>
        <button @click="$emit('close')" class="mt-5 text-indigo-600 text-sm font-medium hover:underline">
          {{ isZh ? '關閉' : 'Close' }}
        </button>
      </div>

      <form v-else @submit.prevent="submit" class="space-y-3">
        <div class="flex gap-2">
          <select v-model="form.type" class="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-indigo-400">
            <option value="bug">🐛 {{ isZh ? '程式問題' : 'Bug' }}</option>
            <option value="idea">💡 {{ isZh ? '功能建議' : 'Feature request' }}</option>
            <option value="other">📝 {{ isZh ? '其他' : 'Other' }}</option>
          </select>
          <select v-model="form.urgency" class="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-indigo-400">
            <option value="low">{{ isZh ? '低' : 'Low' }}</option>
            <option value="medium">{{ isZh ? '中' : 'Med' }}</option>
            <option value="high">{{ isZh ? '高' : 'High' }}</option>
          </select>
        </div>

        <textarea v-model="form.description" :placeholder="isZh ? '請描述您遇到的問題或建議…' : 'Describe the issue or suggestion…'"
          rows="4" required
          class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-indigo-400 placeholder-gray-300">
        </textarea>

        <input v-model="form.email" type="email" :placeholder="isZh ? '聯絡信箱（選填）' : 'Your email (optional)'"
          class="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 placeholder-gray-300" />

        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

        <button type="submit" :disabled="submitting"
          class="w-full bg-indigo-600 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 transition">
          {{ submitting ? (isZh ? '送出中…' : 'Sending…') : (isZh ? '送出回饋' : 'Submit Feedback') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { supabase } from '@/lib/supabase.js';

const props = defineProps({
  isZh: { type: Boolean, default: true },
});
defineEmits(['close']);

const form = reactive({ type: 'idea', urgency: 'low', description: '', email: '' });
const submitted = ref(false);
const submitting = ref(false);
const error = ref('');

async function submit() {
  error.value = '';
  submitting.value = true;
  try {
    const { error: err } = await supabase.from('feedback').insert({
      type: form.type,
      urgency: form.urgency,
      description: form.description.trim(),
      email: form.email.trim() || null,
    });
    if (err) throw err;
    submitted.value = true;
  } catch (e) {
    error.value = props.isZh ? '送出失敗，請稍後再試' : 'Failed to submit, please try again';
  } finally {
    submitting.value = false;
  }
}
</script>
