// ─── Circuit Routes (IotSimX — Native MongoDB) ────────────────────────────────
const express = require('express');
const router  = express.Router();
const { connect, toObjectId } = require('../db');
const { requireAuth } = require('./authRoutes');

// ── GET /api/circuits → all circuits for logged-in user
router.get('/', requireAuth, async (req, res) => {
  try {
    const db       = await connect();
    const circuits = await db.collection('circuits')
      .find({ userId: req.userId })
      .sort({ updatedAt: -1 })
      .project({ data: 0 }) // don't send giant JSON in listing
      .toArray();

    res.json(circuits.map(c => ({ id: c._id.toString(), name: c.name, updatedAt: c.updatedAt })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load circuits' });
  }
});

// ── GET /api/circuits/:id → load one circuit
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const db      = await connect();
    const oid     = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid circuit ID' });

    const circuit = await db.collection('circuits').findOne({ _id: oid });
    if (!circuit || circuit.userId !== req.userId)
      return res.status(404).json({ error: 'Circuit not found' });

    res.json({ id: circuit._id.toString(), name: circuit.name, data: circuit.data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load circuit' });
  }
});

// ── POST /api/circuits → create or update circuit
router.post('/', requireAuth, async (req, res) => {
  const { id, name, nodes, edges, code } = req.body;
  if (!name || !nodes || !edges)
    return res.status(400).json({ error: 'Missing circuit data' });

  try {
    const db         = await connect();
    const collection = db.collection('circuits');
    const now        = new Date();

    if (id) {
      // Update existing
      const oid      = toObjectId(id);
      if (!oid) return res.status(400).json({ error: 'Invalid circuit ID' });
      const existing = await collection.findOne({ _id: oid });
      if (!existing || existing.userId !== req.userId)
        return res.status(403).json({ error: 'Unauthorized' });

      await collection.updateOne({ _id: oid }, { $set: { name, data: { nodes, edges, code }, updatedAt: now } });
      res.json({ success: true, id });
    } else {
      // Create new
      const result = await collection.insertOne({
        name,
        data:      { nodes, edges, code },
        userId:    req.userId,
        createdAt: now,
        updatedAt: now,
      });
      res.json({ success: true, id: result.insertedId.toString() });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save circuit' });
  }
});

// ── DELETE /api/circuits/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db  = await connect();
    const oid = toObjectId(req.params.id);
    if (!oid) return res.status(400).json({ error: 'Invalid circuit ID' });

    const existing = await db.collection('circuits').findOne({ _id: oid });
    if (!existing || existing.userId !== req.userId)
      return res.status(403).json({ error: 'Unauthorized' });

    await db.collection('circuits').deleteOne({ _id: oid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;
