import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '../../..');
const sourceDirectory = path.join(repositoryRoot, 'apps/web/src/i18n/locales');
const destinationDirectory = path.join(repositoryRoot, 'apps/mobile/src/i18n/locales');

await mkdir(destinationDirectory, { recursive: true });

for (const locale of ['en', 'de']) {
  await copyFile(
    path.join(sourceDirectory, `${locale}.json`),
    path.join(destinationDirectory, `${locale}.json`),
  );
}

console.log('Synced BillManager web translations for mobile.');
