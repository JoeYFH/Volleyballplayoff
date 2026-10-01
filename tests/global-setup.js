import { createTestSession } from './helpers/session.js';
import { writeFileSync, mkdirSync } from 'fs';

export default async function globalSetup() {
  mkdirSync('test-results', { recursive: true });

  console.log('\n🏐 建立測試場次...');
  const [maleId, femaleId, mixedId] = await Promise.all([
    createTestSession('male'),
    createTestSession('female'),
    createTestSession('mixed'),
  ]);

  console.log(`   ✅ 純男場次：${maleId}`);
  console.log(`   ✅ 純女場次：${femaleId}`);
  console.log(`   ✅ 混排場次：${mixedId}\n`);

  writeFileSync('test-results/test-sessions.json', JSON.stringify({
    male: maleId,
    female: femaleId,
    mixed: mixedId,
  }));
}
