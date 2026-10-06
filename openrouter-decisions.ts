export const openrouterDecisions = {
 specificationVersion: 'v4' as const,
 provider: 'openrouter-decisions',
 modelId: 'openai/gpt-6-luna-decisions',
 supportedQuestionTypes: ['choice'] as const,
 async doDecide({state,questions,abortSignal}: any) {
  const response=await fetch('https://openrouter.ai/api/alpha/decisions',{
   method:'POST',signal:abortSignal,
   headers:{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY}`,'Content-Type':'application/json'},
   body:JSON.stringify({model:this.modelId,state,questions}),
  });
  if(!response.ok){console.error(`OpenRouter Decisions HTTP ${response.status}`);throw new Error(`OpenRouter Decisions HTTP ${response.status}`);}
  const data=await response.json();
  return {answers:data.answers,warnings:[],usage:{inputTokens:data.usage?.input_tokens,outputTokens:data.usage?.output_tokens},
   providerMetadata:{openrouter:{cost:data.usage?.cost,confidence:Object.fromEntries(Object.entries(data.answers).map(([id,a]:any)=>[id,a.confidence]))}},
   response:{id:data.id,modelId:data.model,timestamp:new Date()}};
 },
};
