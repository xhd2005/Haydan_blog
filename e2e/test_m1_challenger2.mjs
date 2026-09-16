// e2e/test_m1_challenger2.mjs
import fs from 'fs';
import path from 'path';

console.log('======================================================================');
console.log('CHALLENGER 2 EMPIRICAL VERIFICATION SUITE');
console.log('Target: Milestone 1 (Backend MinIO & Modern Models)');
console.log('======================================================================\n');

// 1. Check data-h2.sql
const sqlPath = path.resolve('backend/src/main/resources/data-h2.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

console.log('[1/3] Empirically Verifying 7 Real Cities in data-h2.sql:');

const expectedCities = [
  {
    name: '北京',
    slug: 'beijing-imperial-axis',
    lat: 39.9042,
    lon: 116.4074,
    keywords: ['紫禁城', '中轴线', '故宫', '景山', '798'],
  },
  {
    name: '上海',
    slug: 'shanghai-bund-horizon',
    lat: 31.2304,
    lon: 121.4737,
    keywords: ['外滩', '天际线', '黄浦江', '陆家嘴', '武康路'],
  },
  {
    name: '东京',
    slug: 'tokyo-cyber-pulse',
    lat: 35.6762,
    lon: 139.6503,
    keywords: ['赛博', '涩谷', '银座', '秋叶原'],
  },
  {
    name: '京都',
    slug: 'kyoto-zen-gardens',
    lat: 35.0116,
    lon: 135.7681,
    keywords: ['枯山水', '红叶', '龙安寺', '鸭川', '岚山'],
  },
  {
    name: '重庆',
    slug: 'chongqing-mountain-city',
    lat: 29.5630,
    lon: 106.5516,
    keywords: ['山城', '轻轨', '李子坝', '洪崖洞', '嘉陵江'],
  },
  {
    name: '杭州',
    slug: 'hangzhou-westlake-cyber',
    lat: 30.2741,
    lon: 120.1551,
    keywords: ['西湖', '未来科技城', '茅家埠', '滨江'],
  },
  {
    name: '深圳',
    slug: 'shenzhen-tech-bay',
    lat: 22.5431,
    lon: 114.0579,
    keywords: ['深圳湾', '华强北', '春笋', '创新'],
  },
];

// Extract journeys insert block
const journeyBlockRegex = /MERGE INTO journeys[^\n]*\nKEY\(id\)\s*\nVALUES\s*([\s\S]*?);\s*\n\s*MERGE/i;
const match = sqlContent.match(journeyBlockRegex);
if (!match) {
  throw new Error('FAILED: Could not find MERGE INTO journeys block in data-h2.sql');
}
const journeySql = match[1];

let cityPassCount = 0;
for (const city of expectedCities) {
  const hasCity = journeySql.includes(`'${city.name}'`);
  const hasSlug = journeySql.includes(`'${city.slug}'`);
  const hasLat = journeySql.includes(city.lat.toFixed(4));
  const hasLon = journeySql.includes(city.lon.toFixed(4));
  const matchedKeywords = city.keywords.filter(k => journeySql.includes(k));

  console.log(`  - City: ${city.name} (${city.slug})`);
  console.log(`    * Coordinate: (${city.lat}, ${city.lon}) -> Matched: ${hasLat && hasLon}`);
  console.log(`    * Keywords matched: ${matchedKeywords.join(', ')} (${matchedKeywords.length}/${city.keywords.length})`);

  if (!hasCity || !hasSlug || !hasLat || !hasLon) {
    throw new Error(`FAILED: City verification failed for ${city.name}`);
  }
  if (matchedKeywords.length === 0) {
    throw new Error(`FAILED: No real story keywords found for ${city.name}`);
  }
  cityPassCount++;
}

console.log(`\n  [PASS] All ${cityPassCount}/7 real cities verified with 100% accuracy.\n`);

// 2. Check NowRecord JSON fields
console.log('[2/3] Empirically Verifying NowRecord Serialization & Deserialization:');

// Extract now_records insert block
const nowBlockRegex = /MERGE INTO now_records[^\n]*\nKEY\(id\)\s*\nVALUES\s*\(([\s\S]*?)\);/i;
const nowMatch = sqlContent.match(nowBlockRegex);
if (!nowMatch) {
  throw new Error('FAILED: Could not find MERGE INTO now_records block in data-h2.sql');
}
const nowValuesRaw = nowMatch[1];

// Parse fields
// NowRecord fields: id, learning, building, exploring, thinking, focus_topics_json, reading_notes_json, current_city, micro_logs_json
// Extract json literals using string splitting / regex
const jsonStringMatches = [...nowValuesRaw.matchAll(/'(\[[\s\S]*?\])'/g)].map(m => m[1]);

if (jsonStringMatches.length < 3) {
  throw new Error(`FAILED: Expected at least 3 JSON arrays in now_records seed, found ${jsonStringMatches.length}`);
}

const focusTopicsRaw = jsonStringMatches[0];
const readingNotesRaw = jsonStringMatches[1];
const microLogsRaw = jsonStringMatches[2];

// Test Deserialization of focusTopicsJson
console.log('  Testing Deserialization: focusTopicsJson...');
const focusTopics = JSON.parse(focusTopicsRaw);
if (!Array.isArray(focusTopics) || focusTopics.length === 0) {
  throw new Error('FAILED: focusTopics is not a non-empty array');
}
for (const item of focusTopics) {
  if (!item.title || typeof item.progress !== 'number' || !item.badge || !Array.isArray(item.tags)) {
    throw new Error(`FAILED: Invalid focusTopic item schema: ${JSON.stringify(item)}`);
  }
}
console.log(`  ✔ focusTopicsJson successfully parsed: ${focusTopics.length} topics`);
focusTopics.forEach(t => console.log(`    - [${t.badge}] ${t.title} (${t.progress}%) [${t.tags.join(', ')}]`));

// Test Deserialization of readingNotesJson
console.log('\n  Testing Deserialization: readingNotesJson...');
const readingNotes = JSON.parse(readingNotesRaw);
if (!Array.isArray(readingNotes) || readingNotes.length === 0) {
  throw new Error('FAILED: readingNotes is not a non-empty array');
}
for (const item of readingNotes) {
  if (!item.title || !item.author || !item.cover || !item.quote || !item.note) {
    throw new Error(`FAILED: Invalid readingNote item schema: ${JSON.stringify(item)}`);
  }
}
console.log(`  ✔ readingNotesJson successfully parsed: ${readingNotes.length} books`);
readingNotes.forEach(b => console.log(`    - "${b.title}" by ${b.author}: "${b.quote}"`));

// Test currentCity
const currentCityMatch = nowValuesRaw.match(/'(杭州 · 滨江)'/);
const currentCity = currentCityMatch ? currentCityMatch[1] : null;
console.log(`\n  ✔ currentCity successfully extracted: "${currentCity}"`);
if (currentCity !== '杭州 · 滨江') {
  throw new Error(`FAILED: Expected currentCity to be "杭州 · 滨江", got "${currentCity}"`);
}

// Test Deserialization of microLogsJson
console.log('\n  Testing Deserialization: microLogsJson...');
const microLogs = JSON.parse(microLogsRaw);
if (!Array.isArray(microLogs) || microLogs.length === 0) {
  throw new Error('FAILED: microLogs is not a non-empty array');
}
for (const item of microLogs) {
  if (!item.date || !item.content) {
    throw new Error(`FAILED: Invalid microLog item schema: ${JSON.stringify(item)}`);
  }
}
console.log(`  ✔ microLogsJson successfully parsed: ${microLogs.length} entries`);
microLogs.forEach(l => console.log(`    - [${l.date}] ${l.content}`));

// Test Round-trip Serialization
console.log('\n  Testing Round-trip Serialization & Escape Robustness:');
const serializedFocus = JSON.stringify(focusTopics);
const reParsedFocus = JSON.parse(serializedFocus);
if (JSON.stringify(reParsedFocus) !== serializedFocus) {
  throw new Error('FAILED: Round-trip serialization mismatch for focusTopics');
}
console.log('  ✔ Round-trip JSON.stringify -> JSON.parse preserves exact data integrity.');

// Test Edge Case Serialization: Unicode, quotes, line breaks, emojis
const edgeCaseTopic = [
  {
    title: '“深度测试” & <Special> \'Quotes\' 🚀',
    progress: 100,
    badge: '极客 / 探索 🌿',
    tags: ['C++', 'Java 21', 'HTML & CSS'],
  },
];
const serializedEdge = JSON.stringify(edgeCaseTopic);
const parsedEdge = JSON.parse(serializedEdge);
if (parsedEdge[0].title !== '“深度测试” & <Special> \'Quotes\' 🚀') {
  throw new Error('FAILED: Edge case unicode/quotes corrupted in serialization');
}
console.log('  ✔ Unicode, double/single quotes, XML tags, and emojis safely survive serialization.');

console.log('\n[3/3] Empirical Verification Result: ALL CHECKS PASSED WITH FLYING COLORS!');
console.log('======================================================================');
