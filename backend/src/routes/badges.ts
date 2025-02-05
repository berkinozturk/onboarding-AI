import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as auth, authorizeAdmin as adminAuth } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all badges
router.get('/', auth, async (req, res) => {
  try {
    const badges = await prisma.badge.findMany();
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create badge (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { name, description, image, icon, requiredXP } = req.body;

    const badge = await prisma.badge.create({
      data: {
        name,
        description,
        image,
        icon,
        requiredXP: requiredXP || 0
      }
    });

    res.status(201).json(badge);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update badge (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, icon, requiredXP } = req.body;

    const badge = await prisma.badge.update({
      where: { id },
      data: {
        name,
        description,
        image,
        icon,
        requiredXP: requiredXP || 0
      }
    });

    res.json(badge);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete badge (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.badge.delete({
      where: { id }
    });

    res.json({ message: 'Badge deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router; 