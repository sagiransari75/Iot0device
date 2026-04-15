// ─── Circuit Routes ─────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const prisma  = require('../prisma');
const { requireAuth } = require('./authRoutes');

// ── GET /api/circuits → get all saved circuits for the user
router.get('/', requireAuth, async (req, res) => {
  try {
    const circuits = await prisma.circuit.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, updatedAt: true } // Don't fetch giant JSON until selected
    });
    res.json(circuits);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load circuits' });
  }
});

// ── GET /api/circuits/:id → load specific circuit
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const circuit = await prisma.circuit.findUnique({
      where: { id: req.params.id }
    });
    if (!circuit || circuit.userId !== req.userId) {
      return res.status(404).json({ error: 'Circuit not found' });
    }
    res.json(circuit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load circuit' });
  }
});

// ── POST /api/circuits → save new or update circuit
router.post('/', requireAuth, async (req, res) => {
  const { id, name, nodes, edges, code } = req.body;
  if (!name || !nodes || !edges) {
    return res.status(400).json({ error: 'Missing circuit data' });
  }
  
  try {
    let circuit;
    if (id) {
      // Update existing
      const existing = await prisma.circuit.findUnique({ where: { id } });
      if (!existing || existing.userId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });
      circuit = await prisma.circuit.update({
        where: { id },
        data: { name, data: { nodes, edges, code } }
      });
    } else {
      // Create new
      circuit = await prisma.circuit.create({
        data: {
          name,
          data: { nodes, edges, code },
          userId: req.userId
        }
      });
    }
    res.json({ success: true, id: circuit.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save circuit' });
  }
});

// ── DELETE /api/circuits/:id → delete circuit
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.circuit.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) return res.status(403).json({ error: 'Unauthorized' });
    await prisma.circuit.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

module.exports = router;
