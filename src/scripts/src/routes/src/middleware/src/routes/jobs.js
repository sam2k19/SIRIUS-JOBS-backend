const express = require('express');
const router = express.Router();
const { Job, Application, User } = require('../models');
const authenticate = require('../middleware/authenticate');

// public: list jobs
router.get('/', async (req, res) => {
  const jobs = await Job.findAll({ where: { status: 'open' }});
  res.json(jobs);
});

// employer: create job
router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'employer') return res.status(403).json({ error: 'Only employers can post jobs' });
  const { title, description, category, location, positionsAvailable } = req.body;
  const job = await Job.create({
    employerId: req.user.id,
    title, description, category, location, positionsAvailable: positionsAvailable || 1
  });
  res.json(job);
});

// worker: apply to job (must be verified AND subscription active)
router.post('/:id/apply', authenticate, async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  if (!job || job.status !== 'open') return res.status(400).json({ error: 'Job not available' });
  if (req.user.role !== 'worker') return res.status(403).json({ error: 'Only workers can apply' });
  if (!req.user.verified || !req.user.subscriptionActive) return res.status(403).json({ error: 'You must be verified and have an active subscription to apply' });

  const existing = await Application.findOne({ where: { jobId: job.id, userId: req.user.id }});
  if (existing) return res.status(400).json({ error: 'Already applied' });

  const app = await Application.create({ jobId: job.id, userId: req.user.id, coverLetter: req.body.coverLetter || '' });
  // increment stat
  req.user.increment('statsApplied');
  res.json(app);
});

// employer: view applicants
router.get('/:id/applicants', authenticate, async (req, res) => {
  const job = await Job.findByPk(req.params.id);
  if (!job) return res.status(404).json({ error: 'job not found' });
  if (req.user.role !== 'employer' || req.user.id !== job.employerId) return res.status(403).json({ error: 'not allowed' });
  const applications = await Application.findAll({ where: { jobId: job.id }});
  res.json(applications);
});

// employer: accept or reject an applicant
router.post('/:jobId/applications/:appId/:action', authenticate, async (req, res) => {
  const { action } = req.params; // accept or reject
  const job = await Job.findByPk(req.params.jobId);
  const app = await Application.findByPk(req.params.appId);
  if (!job || !app) return res.status(404).json({ error: 'not found' });
  if (req.user.role !== 'employer' || req.user.id !== job.employerId) return res.status(403).json({ error: 'not allowed' });

  if (action === 'accept') {
    if (job.positionsAvailable <= 0) return res.status(400).json({ error: 'No positions left' });
    app.status = 'accepted';
    await app.save();
    await job.decrement('positionsAvailable', { by: 1 });
    // if none left mark filled
    if (job.positionsAvailable - 1 <= 0) {
      job.status = 'filled';
      await job.save();
      // notify other applicants (this is a stub — implement email/notifications)
      await Application.update({ status: 'rejected' }, { where: { jobId: job.id, id: { [require('sequelize').Op.ne]: app.id } }});
    }
    // increment worker accepted stat
    const worker = await User.findByPk(app.userId);
    if (worker) await worker.increment('statsAccepted');
    res.json({ ok: true, app });
  } else if (action === 'reject') {
    app.status = 'rejected';
    await app.save();
    res.json({ ok: true, app });
  } else {
    res.status(400).json({ error: 'invalid action' });
  }
});

module.exports = router;

