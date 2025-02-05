import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as auth, authorizeAdmin as adminAuth } from '../middleware/auth';
import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const router = express.Router();
const prisma = new PrismaClient();

// Create user (admin only)
const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, department, position, startDate } = req.body;

    // Validate required fields
    if (!email || !password || !name || !department || !position) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse startDate to DateTime
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    
    // Validate date
    if (isNaN(parsedStartDate.getTime())) {
      res.status(400).json({ error: 'Invalid start date format' });
      return;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        department,
        position,
        startDate: parsedStartDate,
        role: 'employee',
        level: 1,
        xp: 0,
        progress: 0,
        completedQuestions: '[]'
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Error creating user' });
  }
};

// Get all users (admin only)
const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        position: true,
        department: true,
        startDate: true,
        xp: true,
        level: true,
        badges: true,
        progress: true,
        completedQuestions: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching users' });
  }
};

// Get user profile
const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        position: true,
        startDate: true,
        xp: true,
        level: true,
        badges: true,
        completedQuestions: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching user profile' });
  }
};

// Update user
const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const requestingUserId = req.user?.id;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Only allow users to update their own profile unless they're an admin
    if (requestingUserId !== id && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Not authorized to update this user' });
      return;
    }

    // Remove sensitive fields from updates unless user is admin
    if (req.user?.role !== 'admin') {
      delete updates.role;
      delete updates.xp;
      delete updates.level;
      delete updates.badges;
      delete updates.completedQuestions;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        position: true,
        startDate: true,
        xp: true,
        level: true,
        badges: true,
        completedQuestions: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: 'Error updating user' });
  }
};

// Delete user (admin only)
const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    console.log(`DELETE /users/${id} - Deleting user and related data`);

    await prisma.$transaction(async (tx) => {
      // Delete user's answers
      await tx.answer.deleteMany({
        where: { userId: id }
      });

      // Delete user's completed questions and badge connections
      await tx.user.update({
        where: { id },
        data: {
          completedQuestions: '[]',
          badges: {
            set: [] // Remove badge connections
          }
        }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id }
      });
    });

    console.log(`User ${id} and related data deleted successfully`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Error deleting user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Routes
router.post('/', auth, adminAuth, createUser as RequestHandler);
router.get('/', auth, adminAuth, getAllUsers as RequestHandler);
router.get('/profile', auth, getUserProfile as RequestHandler);
router.put('/:id', auth, updateUser as RequestHandler);
router.delete('/:id', auth, adminAuth, deleteUser as RequestHandler);

export default router; 