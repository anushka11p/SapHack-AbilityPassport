// The ONLY file that talks to an LLM. Swap what's inside; never call a model elsewhere.
const fs = require('fs');
const path = require('path');
const MODE = process.env.SCORING_MODE || 'fallback';

function loadRubric(rubricKey) {
  const p = path.join(__dirname, 'rubrics', `${rubricKey}.json`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function scoreWithGenAIHub({ answer, brief, rubric }) {
  const { OrchestrationClient } = require('@sap-ai-sdk/orchestration');
  const client = new OrchestrationClient({
    promptTemplating: {
      model: { name: 'gpt-4o' },
      prompt: [
        { role: 'system', content: 'You score work samples against a rubric. Never consider writing style, grammar, speed, confidence or personality. Quote the exact span of the answer that justifies each score. Respond with valid JSON only.' },
        { role: 'user', content: 'Rubric: {{?rubric}}\n\nTask: {{?brief}}\n\nSubmission: {{?answer}}\n\nReturn {"overallScore":0-10,"confidence":"high|medium|low","skills":[{"skill":"","score":0-10,"evidence":""}],"reasoning":""}' }
      ]
    }
  });
  const res = await client.chatCompletion({
    inputParams: { rubric: JSON.stringify(rubric), brief, answer }
  });
  return JSON.parse(res.getContent().replace(/```json|```/g, '').trim());
}

function quoteFor(answer, terms) {
  const sentences = (answer || '').split(/(?<=[.!?])\s+/);
  const hit = sentences.find(s => terms.some(t => s.toLowerCase().includes(t)));
  return (hit || sentences[0] || '').trim().slice(0, 140);
}

const SIGNALS = {
  'Problem identification': ['cause', 'because', 'bug is', 'issue is', 'mutat'],
  'Correctness of fix':     ['fix', 'instead', 'would build', 'change', 'replace'],
  'Reasoning clarity':      ['considered', 'rejected', 'trade-off', 'therefore', 'why'],
  'Edge-case awareness':    ['edge case', 'empty', 'null', 'large', 'duplicate', 'fail'],
  'Issue detection':        ['duplicate', 'missing', 'format', 'inconsistent'],
  'Method choice':          ['impute', 'drop', 'normalise', 'normalize', 'parse'],
  'Data-loss awareness':    ['lose', 'loss', 'destroy', 'signal', 'careful'],
  'Impact assessment':      ['impact', 'users affected', 'blocking', 'severity'],
  'Urgency reasoning':      ['urgent', 'wait', 'first', 'priority'],
  'Written communication':  ['because', 'so that', 'recommend'],
  'Escalation judgement':   ['escalate', 'human', 'manager', 'needs a decision']
};

async function scoreFallback({ answer, rubric }) {
  const words = (answer || '').trim().split(/\s+/).length;
  const skills = rubric.criteria.map(c => {
    const terms = SIGNALS[c.skill] || [];
    const present = terms.some(t => (answer || '').toLowerCase().includes(t));
    const depth = Math.min(2, Math.floor(words / 70));
    return {
      skill: c.skill,
      score: Math.min(9, (present ? 6 : 3) + depth),
      evidence: quoteFor(answer, terms)
    };
  });
  const overall = Math.round(skills.reduce((s, k) => s + k.score, 0) / skills.length * 10) / 10;
  return {
    overallScore: overall,
    confidence: words > 80 ? 'medium' : 'low',
    skills,
    reasoning: `Scored against ${rubric.name} ${rubric.version}, approved by ${rubric.approvedBy}. Local scorer: Generative AI Hub is not entitled on this trial account.`
  };
}

async function scoreSubmission({ answer, brief, rubricKey }) {
  const rubric = loadRubric(rubricKey);
  return MODE === 'genaihub'
    ? scoreWithGenAIHub({ answer, brief, rubric })
    : scoreFallback({ answer, rubric });
}

module.exports = { scoreSubmission };
