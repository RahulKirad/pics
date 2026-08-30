import { config } from 'dotenv';
import { existsSync } from 'fs';
import path from 'path';

let loaded = false;

function findEnvFile(): string | undefined {
  let current = process.cwd();

  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = path.join(current, '.env');
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return undefined;
}

export function ensureDotenvLoaded(): void {
  if (loaded) {
    return;
  }

  const envFile = findEnvFile();
  if (envFile) {
    config({ path: envFile });
  }

  loaded = true;
}

export function resetDotenvLoaded(): void {
  loaded = false;
}
