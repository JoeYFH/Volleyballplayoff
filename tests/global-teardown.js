import { deleteTestSession } from './helpers/session.js';
import { readFileSync, existsSync, unlinkSync } from 'fs';

export default async function globalTeardown() {
  const path = 'test-results/test-sessions.json';
  if (!existsSync(path)) return;

  const sessions = JSON.parse(readFileSync(path, 'utf8'));

  console.log('\n🗑️  刪除測試場次...');
  await Promise.all(Object.entries(sessions).map(async ([type, id]) => {
    await deleteTestSession(id);
    console.log(`   ✅ ${type}：${id}`);
  }));

  unlinkSync(path);
  console.log('');
}
