const fs = require('fs');
const path = require('path');

console.log('🔧 Унификация контекста авторизации...\n');

// ============================================================
// === 1. Удаляем старый AuthContext.jsx ===
// ============================================================
const oldAuthContextPath = path.join(__dirname, 'src', 'context', 'AuthContext.jsx');
if (fs.existsSync(oldAuthContextPath)) {
  fs.unlinkSync(oldAuthContextPath);
  console.log('🗑 Удалён старый: src/context/AuthContext.jsx');
}

// Пытаемся удалить папку context, если она пустая
const contextDir = path.join(__dirname, 'src', 'context');
if (fs.existsSync(contextDir)) {
  const files = fs.readdirSync(contextDir);
  if (files.length === 0) {
    fs.rmdirSync(contextDir);
    console.log('🗑 Удалена пустая папка: src/context/');
  }
}

// ============================================================
// === 2. Обновляем импорты в Simulator.jsx ===
// ============================================================
const simulatorPath = path.join(__dirname, 'src', 'components', 'Simulator', 'Simulator.jsx');
if (fs.existsSync(simulatorPath)) {
  let content = fs.readFileSync(simulatorPath, 'utf8');
  
  // Заменяем старый импорт на правильный
  content = content.replace(
    /import\s*\{\s*useAuth\s*\}\s*from\s*['"]\.\.\/\.\.\/context\/AuthContext['"]\s*;?/g,
    `import { useAuth } from '../../store/auth';`
  );
  content = content.replace(
    /import\s*\{\s*useAuth\s*\}\s*from\s*['"]\.\.\/\.\.\/\.\.\/context\/AuthContext['"]\s*;?/g,
    `import { useAuth } from '../../store/auth';`
  );
  
  fs.writeFileSync(simulatorPath, content, 'utf8');
  console.log('✅ Simulator.jsx: импорт useAuth обновлён');
}

// ============================================================
// === 3. Обновляем импорты в TeacherDashboard.jsx ===
// ============================================================
const teacherPath = path.join(__dirname, 'src', 'components', 'Teacher', 'TeacherDashboard.jsx');
if (fs.existsSync(teacherPath)) {
  let content = fs.readFileSync(teacherPath, 'utf8');
  
  content = content.replace(
    /import\s*\{\s*useAuth\s*\}\s*from\s*['"][^'"]*context\/AuthContext['"]\s*;?/g,
    `import { useAuth } from '../../store/auth';`
  );
  
  fs.writeFileSync(teacherPath, content, 'utf8');
  console.log('✅ TeacherDashboard.jsx: импорт useAuth обновлён');
}

// ============================================================
// === 4. Обновляем импорты в Auth.jsx ===
// ============================================================
const authComponentPath = path.join(__dirname, 'src', 'components', 'Auth', 'Auth.jsx');
if (fs.existsSync(authComponentPath)) {
  let content = fs.readFileSync(authComponentPath, 'utf8');
  
  content = content.replace(
    /import\s*\{\s*useAuth\s*\}\s*from\s*['"][^'"]*context\/AuthContext['"]\s*;?/g,
    `import { useAuth } from '../../store/auth';`
  );
  
  fs.writeFileSync(authComponentPath, content, 'utf8');
  console.log('✅ Auth.jsx: импорт useAuth обновлён');
}

// ============================================================
// === 5. Проверяем main.jsx ===
// ============================================================
const mainPath = path.join(__dirname, 'src', 'main.jsx');
if (fs.existsSync(mainPath)) {
  let content = fs.readFileSync(mainPath, 'utf8');
  
  // Убеждаемся, что используется правильный провайдер
  if (content.includes('./context/AuthContext')) {
    content = content.replace(
      /import\s*\{\s*AuthProvider\s*\}\s*from\s*['"]\.\/context\/AuthContext['"]\s*;?/g,
      `import { AuthProvider } from './store/auth';`
    );
    fs.writeFileSync(mainPath, content, 'utf8');
    console.log('✅ main.jsx: импорт AuthProvider обновлён');
  } else {
    console.log('✓ main.jsx: уже использует правильный провайдер');
  }
}

// ============================================================
// === 6. Поиск оставшихся старых импортов ===
// ============================================================
console.log('\n🔍 Поиск оставшихся старых импортов...');

function searchInDir(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.git') {
      results.push(...searchInDir(fullPath, pattern));
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (pattern.test(content)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const oldImports = searchInDir(
  path.join(__dirname, 'src'),
  /context\/AuthContext/
);

if (oldImports.length === 0) {
  console.log('✅ Старые импорты не найдены');
} else {
  console.log('⚠️  Найдены файлы со старыми импортами:');
  for (const file of oldImports) {
    console.log('   -', file.replace(__dirname, ''));
    
    // Автоматически исправляем
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /import\s*\{\s*(useAuth|AuthProvider)[^}]*\}\s*from\s*['"][^'"]*context\/AuthContext['"]\s*;?/g,
      (match, p1) => `import { ${p1} } from '../../store/auth';`
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log('     → Исправлено');
  }
}

// ============================================================
// === ФИНАЛЬНАЯ ПРОВЕРКА ===
// ============================================================
console.log('\n=== Финальная проверка ===');

const checks = [
  ['src/context/AuthContext.jsx удалён', !fs.existsSync(oldAuthContextPath)],
  ['Simulator.jsx использует store/auth', 
    fs.existsSync(simulatorPath) && 
    fs.readFileSync(simulatorPath, 'utf8').includes("from '../../store/auth'")],
  ['TeacherDashboard.jsx использует store/auth',
    fs.existsSync(teacherPath) && 
    fs.readFileSync(teacherPath, 'utf8').includes("from '../../store/auth'")],
  ['main.jsx использует store/auth',
    fs.existsSync(mainPath) && 
    fs.readFileSync(mainPath, 'utf8').includes("from './store/auth'")]
];

let allOk = true;
for (const [name, ok] of checks) {
  console.log(ok ? '✅' : '❌', name);
  if (!ok) allOk = false;
}

if (allOk) {
  console.log('\n🎉 Все проверки пройдены!');
}

console.log('\n📋 Следующие шаги:');
console.log('   1. Перезапустите Vite: Ctrl+C, затем npm run dev');
console.log('   2. Обновите страницу: Ctrl+F5');
console.log('   3. Войдите как ученик или учитель');
console.log('   4. Все вкладки должны работать');