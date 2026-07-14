const fs = require('fs');

const path = 'apps/web/src/pages/AITutorPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Initial assignment of mindmapData & log attendance
content = content.replace(
  /const mapped = assignIds\(WELCOME_MINDMAP\);\s*setMindmapData\(mapped\);\s*\/\/\s*Auto-expand root and first level children\s*const initialExpanded = new Set\(\);\s*initialExpanded\.add\(mapped\.id\);\s*mapped\.children\?\.forEach\(ch => \{\s*initialExpanded\.add\(ch\.id\);\s*\}\);\s*setExpandedNodes\(initialExpanded\);/g,
  `setMindmapData(null);
      setExpandedNodes(new Set());
      if (currentUser) {
        api.logAttendance('MINDMAP')
          .then(res => {
            if (res && res.streakAwarded) {
              toast(\`🔥 Điểm danh ngày mới thành công! Chuỗi ngày: \${res.streakDays}\`, 'success');
            }
          })
          .catch(err => console.warn('[Attendance] Study mindmap log error:', err));
      }`
);

// 2. Remove "Không gian AI"
content = content.replace(
  /<div className="aitutor-badge-pro">[\s\S]*?<HiSparkles \/> Không gian AI[\s\S]*?<\/div>/g,
  ''
);

// 3. Replace text secondary colors
content = content.replace(/var\(--text-secondary\)/g, '#ffffff');
content = content.replace(/var\(--mm-text-secondary\)/g, '#ffffff');

// 4. Loading spinners
content = content.replace(/className="spinner-secondary"/g, 'className="unique-loader"');
content = content.replace(/className="spinner"/g, 'className="unique-loader"');

fs.writeFileSync(path, content, 'utf8');

// 5. Update CSS
const cssPath = 'apps/web/src/styles/aitutor.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Change dark background to slightly lighter
if (!cssContent.includes('--mm-bg-dark: #234932;')) {
  cssContent = cssContent.replace(/--mm-bg-dark: #173524;/g, '--mm-bg-dark: #234932;');
}
if (!cssContent.includes('--mm-card-dark: #2b593d;')) {
  cssContent = cssContent.replace(/--mm-card-dark: #1e4530;/g, '--mm-card-dark: #2b593d;');
}

// Fix font
cssContent = cssContent.replace(/font-family: 'Outfit', 'Inter', sans-serif;/g, "font-family: 'Inter', system-ui, sans-serif;");

// Add unique-loader CSS if not present
if (!cssContent.includes('.unique-loader')) {
  cssContent += `
/* Unique Loader Animation */
.unique-loader {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 3px solid var(--mm-gold);
  border-right-color: transparent;
  animation: spin 1s linear infinite, glow-loader 2s ease-in-out infinite alternate;
  display: inline-block;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes glow-loader {
  0% { box-shadow: 0 0 5px var(--mm-gold), inset 0 0 5px var(--mm-gold); }
  100% { box-shadow: 0 0 15px var(--mm-gold), inset 0 0 10px var(--mm-gold); }
}
`;
}

fs.writeFileSync(cssPath, cssContent, 'utf8');

console.log("Changes applied successfully.");
