import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import packageJson from '../package.json';

const PROJECT_NAME = packageJson.name;
const VERSION = packageJson.version;
const BUILD_DIR = 'build';
const OUTPUT_DIR = 'package';

const zipDirectory = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const output = fs.createWriteStream(
    path.join(OUTPUT_DIR, `${PROJECT_NAME}-v${VERSION}.zip`)
  );
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  output.on('close', () => {
    console.log(`Archive created: ${archive.pointer()} total bytes`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(BUILD_DIR, false);
  archive.finalize();
};

zipDirectory(); 