const prisma = require('../prisma');

const getHistoryByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Validation: Check if userId is valid ObjectId format
    if (!userId || userId.length !== 24) {
      console.log("⚠️ Invalid or missing ID format:", userId);
      return res.status(400).json({ error: "Invalid User ID format" });
    }

    // 2. Database Fetch
    const history = await prisma.userHistory.findMany({
      where: { 
        userId: userId // Prisma handle karega conversion
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(history);
  } catch (error) {
    console.error("❌ PRISMA ERROR:", error.message);
    res.status(500).json({ error: "Server Database Error", details: error.message });
  }
};

const createHistoryLog = async (req, res) => {
  try {
    const { userId, action, details } = req.body;
    
    // Check for ID before creating
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ error: "Valid User ID required to log" });
    }

    const log = await prisma.userHistory.create({
      data: {
        userId,
        action,
        details: details || ""
      }
    });
    res.status(201).json(log);
  } catch (error) {
    console.error("❌ LOG CREATION ERROR:", error.message);
    res.status(500).json({ error: "Failed to create log" });
  }
};
const clearHistoryByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId.length !== 24) {
      return res.status(400).json({ error: "Invalid User ID format" });
    }

    await prisma.userHistory.deleteMany({
      where: { userId }
    });

    res.status(200).json({ message: "History cleared successfully" });
  } catch (error) {
    console.error("❌ HISTORY CLEAR ERROR:", error.message);
    res.status(500).json({ error: "Failed to clear history" });
  }
};

module.exports = { getHistoryByUser, createHistoryLog, clearHistoryByUser };