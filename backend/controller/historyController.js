// ─── History Controller (IotSimX — Native MongoDB) ───────────────────────────
const { connect, toObjectId } = require('../db');

const getHistoryByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const db      = await connect();
    const history = await db.collection('history')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.status(200).json(history.map(h => ({ ...h, id: h._id.toString() })));
  } catch (err) {
    console.error('❌ HISTORY_GET ERROR:', err.message);
    res.status(500).json({ error: 'Server Database Error', details: err.message });
  }
};

const createHistoryLog = async (req, res) => {
  try {
    const { userId, action, details } = req.body;
    if (!userId || !action) return res.status(400).json({ error: 'userId and action required' });

    const db     = await connect();
    const result = await db.collection('history').insertOne({
      userId,
      action,
      details: details || '',
      createdAt: new Date(),
    });

    res.status(201).json({ id: result.insertedId.toString(), userId, action });
  } catch (err) {
    console.error('❌ LOG_CREATE ERROR:', err.message);
    res.status(500).json({ error: 'Failed to create log' });
  }
};

const clearHistoryByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'User ID required' });

    const db = await connect();
    await db.collection('history').deleteMany({ userId });
    res.status(200).json({ message: 'History cleared successfully' });
  } catch (err) {
    console.error('❌ HISTORY_CLEAR ERROR:', err.message);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};

module.exports = { getHistoryByUser, createHistoryLog, clearHistoryByUser };