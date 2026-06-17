const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDirs = [
  path.join(__dirname, 'src', 'styles'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src', 'pages')
];

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  walkDir(dir, function(filePath) {
    if (filePath.endsWith('.css')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;

      // Replace hardcoded background whites with CSS variables
      content = content.replace(/background(-color)?\s*:\s*white\s*(!important)?;/gi, 'background$1: var(--bg-card) $2;');
      content = content.replace(/background(-color)?\s*:\s*#ffffff\s*(!important)?;/gi, 'background$1: var(--bg-card) $2;');
      content = content.replace(/background(-color)?\s*:\s*#fff\s*(!important)?;/gi, 'background$1: var(--bg-card) $2;');
      
      // Replace some black/dark gray text colors with var(--text-main)
      content = content.replace(/color\s*:\s*#333\s*;/gi, 'color: var(--text-main);');
      content = content.replace(/color\s*:\s*#000\s*;/gi, 'color: var(--text-main);');
      content = content.replace(/color\s*:\s*#222\s*;/gi, 'color: var(--text-main);');
      content = content.replace(/color\s*:\s*black\s*;/gi, 'color: var(--text-main);');
      
      // Replace hardcoded light gray backgrounds that might be main backgrounds
      content = content.replace(/background(-color)?\s*:\s*#f8f9fa\s*;/gi, 'background$1: var(--bg-main);');
      content = content.replace(/background(-color)?\s*:\s*#f9fafb\s*;/gi, 'background$1: var(--bg-main);');
      content = content.replace(/background(-color)?\s*:\s*#f3f4f6\s*;/gi, 'background$1: var(--bg-main);');
      content = content.replace(/background(-color)?\s*:\s*#f4f7f6\s*;/gi, 'background$1: var(--bg-main);');

      // Replace hardcoded borders with var(--border-color)
      content = content.replace(/border\s*:\s*1px\s+solid\s+#eee\s*;/gi, 'border: 1px solid var(--border-color);');
      content = content.replace(/border\s*:\s*1px\s+solid\s+#e5e7eb\s*;/gi, 'border: 1px solid var(--border-color);');
      content = content.replace(/border\s*:\s*1px\s+solid\s+#ddd\s*;/gi, 'border: 1px solid var(--border-color);');
      content = content.replace(/border-bottom\s*:\s*1px\s+solid\s+#eee\s*;/gi, 'border-bottom: 1px solid var(--border-color);');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  });
});
