import type {
  Experimental_DecisionModelV4,
  Experimental_DecisionModelV4Answer,
} from '@ai-sdk/provider';

interface DecisionResponse {
  id?: string;
  model?: string;
  answers: Record<
    string,
    Experimental_DecisionModelV4Answer & { confidence?: number }
  >;
  usage?: { input_tokens?: number; output_tokens?: number; cost?: number };
}

export const openrouterDecisions: Experimental_DecisionModelV4 = {
  specificationVersion: 'v4',
  provider: 'openrouter-decisions',
  modelId: 'openai/gpt-6-luna-decisions',
  supportedQuestionTypes: ['choice'],
  async doDecide({ state, questions, abortSignal }) {
    const response = await fetch('https://openrouter.ai/api/alpha/decisions', {
      method: 'POST',
      signal: abortSignal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: this.modelId, state, questions }),
    });
    if (!response.ok) {
      throw new Error(`OpenRouter Decisions HTTP ${response.status}`);
    }
    const data: DecisionResponse = await response.json();
    if (!data.answers || typeof data.answers !== 'object') {
      throw new Error('OpenRouter Decisions returned no answers');
    }
    return {
      answers: data.answers,
      warnings: [],
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
      providerMetadata: {
        openrouter: {
          ...(data.usage?.cost !== undefined ? { cost: data.usage.cost } : {}),
          confidence: Object.fromEntries(
            Object.entries(data.answers)
              .filter(([, answer]) => answer.confidence !== undefined)
              .map(([id, answer]) => [id, answer.confidence!]),
          ),
        },
      },
      response: { id: data.id, modelId: data.model, timestamp: new Date() },
    };
  },
};
