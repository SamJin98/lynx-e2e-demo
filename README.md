# e2e on Lynx

A [ReactLynx](https://lynxjs.org/react/) product page tested with
[tester-army/e2e](https://github.com/tester-army/e2e). Compare DeepSeek with a Luna
Decisions hybrid using the same drag-and-checkout flow.

Runs in **Lynx for Web**, compiled from ReactLynx components and main-thread carousel
hooks. Native iOS/Android hosts are not tested. Orders are simulated in page state.

## Run locally

Requires Node.js `^22.22.3 || >=24.8.0`. `nvm use` selects the pinned version.

```sh
npm ci
npm run browser:install
npm run dev
```

Open <http://127.0.0.1:4180>. The preview builds once; restart it after editing app code.
Stop the preview before tests, which start their own server on the same port.

## Test

```sh
npm test                     # Deterministic tests; no model or API key
cp .env.example .env         # Set OPENROUTER_API_KEY in this file
npm run test:agent           # DeepSeek
npm run test:decisions       # Luna Decisions hybrid
```

Both agent commands run `tests/order-demo.e2e.ts`: horizontally drag to image 2,
select Sand, add two chairs, increase the bag quantity to three, submit the $720
order, and check the confirmation, empty bag, and animated confetti.
`agent.act` performs interactions, exact `expect` assertions check each stage, and
`agent.assert` evaluates the final confirmation. The same approximately 1.2-second
drag pacing is used in both versions for readable recordings.

| Mode             | Model                                                 |
| ---------------- | ----------------------------------------------------- |
| DeepSeek         | `deepseek/deepseek-v4.1-flash`                        |
| Decisions hybrid | `openai/gpt-6-luna-decisions`, with DeepSeek for drag |

The pinned decision executor does not support drag or container-specific scrolling.
The hybrid routes those operations to DeepSeek. Unsupported-operation/provider
errors trigger an exact state check before continuing the remaining task with
DeepSeek; other errors fail the test. This is not a pure Decisions run.
The adapter uses OpenRouter's experimental `/api/alpha/decisions` endpoint.
Both modes use the same OpenRouter key, one worker, zero retries, and bounded
steps/model calls. API calls cost money; set a key budget in OpenRouter.

```sh
npm run test:journey                  # Also test details, nested scroll, Walnut, and removal
E2E_DECISIONS=1 npm run test:journey   # The same longer journey with the hybrid
npm run test:cache                    # Strict replay of the short order flow
```

Cache mode is `read-write`; a miss can still call the model. For an uncached comparison:

```sh
NODE_OPTIONS=--use-system-ca E2E_TELEMETRY_DISABLED=1 npx e2e run tests/order-demo.e2e.ts --no-cache --output results/deepseek-comparison
NODE_OPTIONS=--use-system-ca E2E_TELEMETRY_DISABLED=1 E2E_DECISIONS=1 npx e2e run tests/order-demo.e2e.ts --no-cache --output results/decisions-comparison
```

Reports, traces, and WebM recordings are in `results/local`, `results/deepseek`, or
`results/decisions`. Longer/cache runs append `-journey`/`-cache`. Gesture and routing
evidence is in `screenshots/`. Generated artifacts, caches, and `.env` are ignored.

## Source

- `src/`: ReactLynx page, cart, demo order, and main-thread carousel.
- `web/`: Web-only ARIA mapping and mouse/wheel-to-touch adapter.
- `server.mjs`: Loopback preview server, restricted to the host, bundle, and runtime.
- `e2e.config.ts`, `engine.ts`: Web engine, model configuration, budgets, and recordings.
- `openrouter-decisions.ts`: OpenRouter Decisions adapter.
- `tests/`: Deterministic gestures, short order demo, and longer agent journey.

The Web input/accessibility adapters belong to this demo. Agents use e2e's built-in
operations. No custom e2e tools or native mobile engine are involved.

Before contributing, run `npm run format`, `npm run check`, and `npm test`.
Keep keys and generated recordings out of Git.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Carousel hooks and product
images come from the [official Lynx swiper example](https://github.com/lynx-family/lynx-examples/tree/main/examples/swiper);
modifications are documented in [src/swiper/NOTICE.md](src/swiper/NOTICE.md).
