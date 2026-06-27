const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'routes');
const files = fs.readdirSync(routesDir);

files.forEach(file => {
  if (file.endsWith('.js')) {
    const fullPath = path.join(routesDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (['brandRoutes.js', 'categoryRoutes.js', 'subCategoryRoutes.js'].includes(file)) {
      content = content.replace(/authService\.allowedTo\([^)]+\)/g, 'authService.allowedTo("superAdmin")');
    } else {
      content = content.replace(/authService\.allowedTo\(([^)]+)\)/g, (match, p1) => {
        if (!p1.includes('superAdmin')) {
            return `authService.allowedTo("superAdmin", ${p1})`;
        }
        return match;
      });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
  }
});
console.log('Routes updated successfully');
