import express, { Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const router = express.Router();
const prisma = new PrismaClient();

// Register a new user
const register: RequestHandler = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log

    const { email, password, name, position, department, startDate } = req.body;

    // Validate required fields
    if (!email || !password || !name || !position || !department) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'name', 'position', 'department'],
        received: Object.keys(req.body)
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Parse startDate
    let parsedStartDate: Date;
    try {
      parsedStartDate = new Date(startDate || new Date());
      if (isNaN(parsedStartDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (err) {
      return res.status(400).json({ 
        error: 'Invalid start date format',
        received: startDate,
        expected: 'YYYY-MM-DD'
      });
    }

    console.log('Creating user with data:', {
      email,
      name,
      position,
      department,
      startDate: parsedStartDate,
      role: 'employee'
    });

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        position,
        department,
        startDate: parsedStartDate,
        role: 'employee',
        xp: 0,
        level: 1,
        progress: 0,
        completedQuestions: '[]'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        position: true,
        startDate: true,
        xp: true,
        level: true,
        progress: true,
        completedQuestions: true,
        badges: true
      }
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

    // Parse completedQuestions from JSON string to array
    const userWithParsedData = {
      ...user,
      completedQuestions: JSON.parse(user.completedQuestions || '[]'),
      badges: user.badges || []
    };

    res.status(201).json({ user: userWithParsedData, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      error: 'Error creating user',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Login user
const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        xp: true,
        level: true,
        position: true,
        badges: true,
        completedQuestions: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(400).json({ error: 'Error logging in' });
  }
};

// Get current user
const getCurrentUser: RequestHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        xp: true,
        level: true,
        position: true,
        department: true,
        startDate: true,
        progress: true,
        badges: true,
        completedQuestions: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Parse completedQuestions from JSON string to array
    const userWithParsedData = {
      ...user,
      completedQuestions: JSON.parse(user.completedQuestions || '[]')
    };

    res.json(userWithParsedData);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
};

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);

export default router; 