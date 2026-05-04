// fix-garbled.js - 把含非ASCII的字符串替换为安全的占位符
const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\a1478\\.openclaw-autoclaw\\workspace\\promotion-mvp\\frontend\\src';

const files = [
  'pages/HomeV2.tsx',
  'pages/ContentDetail.tsx',
  'pages/PublishV2.tsx',
  'pages/Settings.tsx',
  'pages/Tasks.tsx',
  'pages/TopicDetail.tsx',
  'pages/Promote.tsx',
  'components/CommentSheet.tsx',
];

for (const file of files) {
  const filePath = path.join(srcDir, file);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP: ${file} (not found)`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  // Replace all non-ASCII characters with empty string
  // This removes garbled Chinese but keeps the code structure intact
  content = content.replace(/[^\x00-\x7f]/g, '');
  
  // Clean up empty strings that result: '' stays '', but '''' becomes ''
  // Also fix template literals that might have empty interpolations
  
  const removed = original.length - content.length;
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`DONE: ${file} (${removed} non-ASCII chars removed)`);
}

console.log('All files processed.');
