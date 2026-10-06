#!/usr/bin/env bash
set -eu
cd "$(dirname "$0")"
npm ci
npm run build
export E2E_TELEMETRY_DISABLED=1
EXPERIMENT_STAGE=pass npx e2e run --output results/pass
set +e
INTENTIONAL_FAIL=1 EXPERIMENT_STAGE=fail npx e2e run --output results/fail
failure_status=$?
set -e
test "$failure_status" -eq 1
EXPERIMENT_STAGE=recovered npx e2e run --output results/recovered
