import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as auth } from '../middleware/auth';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const router = express.Router();
const prisma = new PrismaClient();

// Get user's answers
router.get('/user/:userId', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    console.log('GET /answers/user/:userId - Fetching answers for user:', userId);

    const answers = await prisma.answer.findMany({
      where: { userId },
      include: {
        question: {
          include: { badge: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('Found answers:', answers);
    res.json(answers);
  } catch (error) {
    console.error('Error fetching answers:', error);
    next(error);
  }
});

// Submit an answer
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { questionId, answer } = req.body;
    const userId = req.user?.id;

    console.log('POST /answers - Submitting answer:', { userId, questionId, answer });

    if (!userId || !questionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // First check if the question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        badge: true
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Then check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or update answer
    const userAnswer = await prisma.answer.upsert({
      where: {
        userId_questionId: {
          userId,
          questionId
        }
      },
      create: {
        answer: String(answer),
        userId,
        questionId
      },
      update: {
        answer: String(answer)
      }
    });

    console.log('Answer saved:', userAnswer);

    // Parse completed questions
    let completedQuestions = user.completedQuestions ? JSON.parse(user.completedQuestions) : [];

    // Add to completed questions if not already there
    if (!completedQuestions.includes(questionId)) {
      completedQuestions.push(questionId);

      // Calculate new progress
      const totalQuestions = await prisma.question.count();
      const newProgress = Math.round((completedQuestions.length / totalQuestions) * 100);
      console.log('Calculated new progress:', { completedQuestions: completedQuestions.length, totalQuestions, newProgress });

      // Update user with badge if available and new progress
      const updateData: any = {
        completedQuestions: JSON.stringify(completedQuestions),
        xp: { increment: question.xpReward },
        progress: newProgress // Save progress to database
      };

      if (question.badge && !user.badges.some(b => b.id === question.badge?.id)) {
        updateData.badges = {
          connect: { id: question.badge.id }
        };
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          badges: true
        }
      });

      console.log('User updated with new progress:', updatedUser);

      return res.json({
        answer: {
          ...userAnswer,
          answer: userAnswer.answer === 'true' ? true : userAnswer.answer === 'false' ? false : userAnswer.answer
        },
        user: {
          ...updatedUser,
          completedQuestions
        }
      });
    }

    return res.json({
      answer: {
        ...userAnswer,
        answer: userAnswer.answer === 'true' ? true : userAnswer.answer === 'false' ? false : userAnswer.answer
      },
      user: {
        ...user,
        completedQuestions
      }
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    next(error);
  }
});

export default router; 