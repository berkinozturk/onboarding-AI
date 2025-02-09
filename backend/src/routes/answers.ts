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

    // Then check if the user exists and get their current state
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find existing answer
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        questionId,
        userId
      }
    });

    // Calculate XP change based on answer change
    let xpChange = 0;
    let shouldAddBadge = false;
    let shouldRemoveBadge = false;

    if (question.type === 'boolean') {
      const boolAnswer = answer === 'true' || answer === true;
      const prevBoolAnswer = existingAnswer ? 
        existingAnswer.answer === 'true' : 
        false;
      
      if (!prevBoolAnswer && boolAnswer) {
        // Changed from No/null to Yes
        xpChange = question.xpReward;
        shouldAddBadge = true;
      } else if (prevBoolAnswer && !boolAnswer) {
        // Changed from Yes to No
        xpChange = -question.xpReward;
        shouldRemoveBadge = true;
      }
    } else if (question.type === 'multiple_choice') {
      const isCorrect = answer === question.correctAnswer;
      const wasCorrect = existingAnswer?.answer === question.correctAnswer;

      if (!wasCorrect && isCorrect) {
        xpChange = question.xpReward;
        shouldAddBadge = true;
      } else if (wasCorrect && !isCorrect) {
        xpChange = -question.xpReward;
        shouldRemoveBadge = true;
      }
    }

    // Save or update the answer
    const savedAnswer = existingAnswer ?
      await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          answer: answer.toString(),
          updatedAt: new Date()
        }
      }) :
      await prisma.answer.create({
        data: {
          questionId,
          userId,
          answer: answer.toString(),
          updatedAt: new Date()
        }
      });

    // Calculate new XP and progress
    const newXP = Math.max(0, user.xp + xpChange);
    const newLevel = Math.floor(newXP / 1000) + 1;

    // Get all answers for progress calculation
    const allAnswers = await prisma.answer.findMany({
      where: { userId },
      include: { question: true }
    });

    // Calculate progress based on correct answers
    const totalQuestions = await prisma.question.count();
    let correctAnswers = allAnswers.filter(ans => {
      if (ans.question.type === 'boolean') {
        return ans.answer === 'true';
      } else if (ans.question.type === 'multiple_choice') {
        return true; // Count all multiple choice answers
      } else if (ans.question.type === 'text') {
        return true; // Count all text answers
      }
      return false;
    }).length;

    const newProgress = Math.round((correctAnswers / totalQuestions) * 100);

    // Update user data
    let updateData: any = {
      xp: newXP,
      level: newLevel,
      progress: newProgress
    };

    // Handle badge updates
    if (shouldAddBadge && question.badge && !user.badges.some(b => b.id === question.badge?.id)) {
      updateData.badges = {
        connect: { id: question.badge.id }
      };
    } else if (shouldRemoveBadge && question.badge) {
      updateData.badges = {
        disconnect: { id: question.badge.id }
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

    console.log('User updated successfully:', {
      xpChange,
      newXP,
      newLevel,
      newProgress,
      badges: updatedUser.badges.map(b => b.id)
    });

    // Send response with updated data
    res.json({
      answer: {
        ...savedAnswer,
        answer: savedAnswer.answer === 'true' ? true : 
                savedAnswer.answer === 'false' ? false : 
                savedAnswer.answer,
        updatedAt: savedAnswer.updatedAt.toISOString()
      },
      user: updatedUser
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    next(error);
  }
});

export default router; 