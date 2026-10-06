import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (existsSync('.env')) process.loadEnvFile('.env');
if (!process.env.OPENROUTER_API_KEY?.trim()) {
  console.error('Set OPENROUTER_API_KEY in .env before running Agent tests.');
  process.exit(2);
}

const options = new Set(process.argv.slice(2));
for (const option of options) {
  if (!['--decisions', '--journey', '--strict-cache'].includes(option)) {
    console.error(`Unknown option: ${option}`);
    process.exit(2);
  }
}
const decisions =
  options.has('--decisions') || process.env.E2E_DECISIONS === '1';
const strict = options.has('--strict-cache');
const journey = options.has('--journey');
const suite = journey ? 'tests/journey.e2e.ts' : 'tests/order-demo.e2e.ts';
const output = `results/${decisions ? 'decisions' : 'deepseek'}${journey ? '-journey' : ''}${strict ? '-cache' : ''}`;
const result = spawnSync(
  process.execPath,
  [
    'node_modules/e2e/dist/cli/bin.js',
    'run',
    suite,
    '--output',
    output,
    ...(strict ? ['--strict-cache'] : []),
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      E2E_DECISIONS: decisions ? '1' : '0',
      E2E_TELEMETRY_DISABLED: '1',
      NODE_OPTIONS: [process.env.NODE_OPTIONS, '--use-system-ca']
        .filter(Boolean)
        .join(' '),
    },
  },
);
process.exit(result.status ?? 1);
