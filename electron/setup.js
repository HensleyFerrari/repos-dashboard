import fs from 'fs';
import path from 'path';

const distElectronPath = path.resolve('dist-electron');

if (!fs.existsSync(distElectronPath)) {
  fs.mkdirSync(distElectronPath, { recursive: true });
}

fs.writeFileSync(
  path.join(distElectronPath, 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2)
);

console.log('✅ Electron build environment initialized (dist-electron/package.json created)');
