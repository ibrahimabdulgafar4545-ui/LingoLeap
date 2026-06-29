const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.jsx')) {
      callback(path.join(dir, f));
    }
  });
}

const targetDir = 'C:/Users/HP/OneDrive/Desktop/LingoLeap1/client/src/pages';
const files = [];
walkDir(targetDir, (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('<button') || content.includes('loading') || content.includes('setLoading') || content.includes('Loader2')) {
    files.push(filePath);
  }
});
console.log(files.map(f => path.basename(f)).join('\n'));
