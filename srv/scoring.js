// The ONLY file in this project that talks to an LLM.
// Swap what's inside; never call a model from anywhere else.
const MODE = process.env.SCORING_MODE || 'fallback';

async function scoreWithGenAIHub({ answer, brief, rubricKey }) {
  const { OrchestrationClient } = require('@sap-ai-sdk/orchestration');
  const client = new OrchestrationClient({
    promptTemplating: {
      model: { name: 'gpt-4o' },
      prompt: [
        { role: 'system', content: 'You score work samples against a rubric. Never consider writing style, personality or speed. Quote the exact span of the answer that justifies each score. Respond with valid JSON only.' },
        { role: 'user', content: 'Rubric key: {{?rubricKey}}\n\nTask: {{?brief}}\n\nSubmission: {{?answer}}\n\nReturn {"overallScore":0-10,"confidence":"high|medium|low","skills":[{"skill":"","score":0-10,"evidence":""}],"reasoning":""}' }
      ]
    }
  });
  const res = await client.chatCompletion({ inputParams: { rubricKey, brief, answer } });
  return JSON.parse(res.getContent().replace(/```json|```/g, '').trim());
}

async function scoreFallback({ answer }) {
  const words = (answer || '').trim().split(/\s+/).length;
  const explains = /because|therefore|considered|instead|trade-off|rejected/i.test(answer);
  const edge = /edge case|empty|null|large input|duplicate/i.test(answer);
  const base = Math.min(9, 4 + Math.floor(words / 60) + (explains ? 2 : 0) + (edge ? 1 : 0));
  return {
    overallScore: base,
    confidence: words > 80 ? 'high' : 'low',
    skills: [
      { skill: 'Reasoning clarity', score: explains ? base : base - 2,
        evidence: (answer || '').slice(0, 120) },
      { skill: 'Edge-case awareness', score: edge ? base : base - 3,
        evidence: (answer || '').slice(0, 120) }
    ],
    reasoning: 'Scored locally: Generative AI Hub is not entitled on this trial account.'
  };
}

async function scoreSubmission(input) {
  return MODE === 'genaihub' ? scoreWithGenAIHub(input) : scoreFallback(input);
}

module.exports = { scoreSubmission };
