import { existsSync } from 'node:fs';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { engine } from './engine.ts';
if (existsSync('.env')) process.loadEnvFile('.env');
const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4.1-flash';
if (!['deepseek/deepseek-v4.1-flash', 'openai/gpt-6-luna'].includes(model)) {
  throw new Error('OPENROUTER_MODEL must be deepseek/deepseek-v4.1-flash or openai/gpt-6-luna');
}
const openrouter = createOpenAICompatible({
  name: 'openrouter', baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});
export default {
  targets: [{name: 'lynx-web', engine, app: {url: 'http://127.0.0.1:4180', command: {executable: 'node', args: ['server.mjs']}}}],
  workers: 1, retries: 0, timeout: 120000, trace: 'on', cache: 'read-write', assertionTimeout: 5000,
  agents: {default: {
    model: openrouter.chatModel(model),
    providerOptions: model === 'openai/gpt-6-luna' ? {openaiCompatible: {reasoningEffort: 'none'}} : {},
    maxSteps: 16, maxModelCalls: 16, maxInputTokens: 16000,
    context: 'This is a ReactLynx app. Controls use accessibility-label attributes. The scroll-view contains Item 1 to Item 80.',
  }},
};
