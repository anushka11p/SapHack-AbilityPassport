const cds = require('@sap/cds');
const { scoreSubmission } = require('./scoring');

module.exports = cds.service.impl(async function () {
  const { Submissions, Verifications, Tasks, Consents, Decisions } = this.entities;

  this.on('submitWork', async (req) => {
    const { taskID, candidateID, answer } = req.data;
    const task = await SELECT.one.from(Tasks).where({ ID: taskID });
    if (!task) return req.error(404, 'Task not found');

    const id = cds.utils.uuid();
    await INSERT.into(Submissions).entries({
      ID: id, candidate_ID: candidateID, task_ID: taskID,
      answer, submittedAt: new Date(), status: 'submitted'
    });

    try {
      const r = await scoreSubmission({ answer, brief: task.brief, rubricKey: task.rubricKey });
      await INSERT.into(Verifications).entries({
        ID: cds.utils.uuid(), submission_ID: id,
        overallScore: r.overallScore, skillScores: JSON.stringify(r.skills),
        reasoning: r.reasoning, confidence: r.confidence,
        modelUsed: process.env.SCORING_MODE || 'fallback', humanReviewed: false
      });
      await UPDATE(Submissions, id).with({ status: 'scored' });
      return id;
    } catch (e) {
      await UPDATE(Submissions, id).with({ status: 'failed' });
      return req.error(500, 'Scoring failed: ' + e.message);
    }
  });

  this.on('grantConsent', async (req) => {
    const { candidateID, employerName } = req.data;
    await INSERT.into(Consents).entries({
      ID: cds.utils.uuid(), candidate_ID: candidateID,
      employerName, granted: true, grantedAt: new Date()
    });
    return true;
  });

  this.on('passportFor', async (req) => {
    const { candidateID, employerName } = req.data;
    const consent = await SELECT.one.from(Consents)
      .where({ candidate_ID: candidateID, employerName, granted: true });
    if (!consent) return JSON.stringify({ error: 'NO_CONSENT' });

    const subs = await SELECT.from(Submissions).where({ candidate_ID: candidateID });
    const out = [];
    for (const s of subs) {
      const v = await SELECT.one.from(Verifications).where({ submission_ID: s.ID });
      if (v) out.push({ score: v.overallScore, confidence: v.confidence, skills: JSON.parse(v.skillScores) });
    }
    return JSON.stringify({ candidateID, employerName, verifications: out });
  });
});
