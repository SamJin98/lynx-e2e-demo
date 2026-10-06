import {existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
if (existsSync('.env')) process.loadEnvFile('.env');
if (!process.env.OPENROUTER_API_KEY?.trim()) {
  console.error('Set OPENROUTER_API_KEY in .env before running Agent tests.');
  process.exit(2);
}
const strict = process.argv.includes('--strict-cache');
const result = spawnSync(process.execPath, ['node_modules/e2e/dist/cli/bin.js', 'run', 'tests/agent.e2e.ts', '--output', strict ? 'results/cache' : 'results/agent', ...(strict ? ['--strict-cache'] : [])], {stdio:'inherit', env:{...process.env, NODE_OPTIONS: [process.env.NODE_OPTIONS, '--use-system-ca'].filter(Boolean).join(' '), E2E_TELEMETRY_DISABLED:'1'}});
process.exit(result.status ?? 1);
