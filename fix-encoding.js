// fix-encoding.js - 用 Unicode 转义避免脚本自身的编码问题
const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\a1478\\.openclaw-autoclaw\\workspace\\promotion-mvp\\frontend\\src';

// 用 Buffer 来存储替换映射，避免 JS 文件本身的编码问题
// 这些是从构建错误日志中提取的乱码模式
const replacements = JSON.parse(fs.readFileSync(path.join(__dirname, 'replacements.json'), 'utf8'));

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
  let changes = 0;
  
  for (const [from, to] of replacements) {
    while (content.includes(from)) {
      content = content.replace(from, to);
      changes++;
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`DONE: ${file} (${changes} replacements)`);
}

console.log('All files processed.');
