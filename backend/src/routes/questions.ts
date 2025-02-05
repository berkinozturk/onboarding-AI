import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate as auth, authorizeAdmin as adminAuth } from '../middleware/auth';
import { RequestHandler } from 'express';

const router = express.Router();
const prisma = new PrismaClient();

// Get all questions
router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('GET /questions - Fetching all questions');
    const questions = await prisma.question.findMany({
      orderBy: { order: 'asc' },
      include: { badge: true }
    });

    console.log('Raw questions from database:', questions);

    // Parse options for each question before sending response
    const questionsWithParsedOptions = questions.map(question => {
      console.log(`Processing question ${question.id}:`, {
        type: question.type,
        rawOptions: question.options,
        optionsType: typeof question.options
      });

      let parsedOptions = [];
      try {
        // Always try to parse options if it's a string
        if (typeof question.options === 'string') {
          parsedOptions = JSON.parse(question.options);
          console.log('Successfully parsed options:', parsedOptions);
        } else if (Array.isArray(question.options)) {
          parsedOptions = question.options;
          console.log('Options is already an array:', parsedOptions);
        }
      } catch (error) {
        console.error('Error parsing options for question:', question.id, error);
        parsedOptions = [];
      }

      const processedQuestion = {
        ...question,
        options: parsedOptions
      };

      console.log('Processed question:', {
        id: processedQuestion.id,
        type: processedQuestion.type,
        options: processedQuestion.options,
        optionsType: typeof processedQuestion.options
      });

      return processedQuestion;
    });

    console.log('Sending processed questions:', 
      questionsWithParsedOptions.map(q => ({
        id: q.id,
        type: q.type,
        options: q.options
      }))
    );

    res.json(questionsWithParsedOptions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Reorder questions
router.put('/reorder', auth, adminAuth, (async (req: Request, res: Response): Promise<void> => {
  try {
    const { questions } = req.body;
    console.log('PUT /questions/reorder - Reordering questions:', questions);

    if (!Array.isArray(questions)) {
      res.status(400).json({ error: 'Questions must be an array' });
      return;
    }

    // Update all questions in a single transaction
    await prisma.$transaction(async (tx) => {
      // First, set all orders to temporary negative values to avoid conflicts
      for (let i = 0; i < questions.length; i++) {
        await tx.question.update({
          where: { id: questions[i].id },
          data: { order: -1000 - i }
        });
      }

      // Then, set the final order values
      for (const question of questions) {
        await tx.question.update({
          where: { id: question.id },
          data: { order: question.order }
        });
      }
    });

    const updatedQuestions = await prisma.question.findMany({
      orderBy: { order: 'asc' },
      include: { badge: true }
    });

    // Safely parse options for each question
    const processedQuestions = updatedQuestions.map(q => {
      let parsedOptions = [];
      try {
        if (typeof q.options === 'string') {
          parsedOptions = JSON.parse(q.options);
        } else if (Array.isArray(q.options)) {
          parsedOptions = q.options;
        }
      } catch (error) {
        console.error('Error parsing options for question:', q.id, error);
      }
      return {
        ...q,
        options: parsedOptions
      };
    });

    res.json(processedQuestions);
  } catch (error) {
    console.error('Error reordering questions:', error);
    res.status(500).json({ 
      error: 'Failed to reorder questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler);

// Update a question
router.put('/:id', auth, adminAuth, (async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { options, ...otherData } = req.body;
    console.log(`PUT /questions/${id} - Updating question:`, req.body);

    // Ensure options is stringified
    const optionsString = Array.isArray(options) ? JSON.stringify(options) : JSON.stringify([]);

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...otherData,
        options: optionsString,
        xpReward: Number(otherData.xpReward) || undefined,
        badge: otherData.badge ? {
          connect: { id: otherData.badge.id }
        } : undefined
      },
      include: {
        badge: true
      }
    });

    // Parse options back to array before sending response
    const responseQuestion = {
      ...question,
      options: JSON.parse(question.options)
    };

    console.log('Question updated successfully:', responseQuestion);
    res.json(responseQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
}) as RequestHandler);

// Delete a question
router.delete('/:id', auth, adminAuth, (async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    console.log(`DELETE /questions/${id} - Deleting question`);

    // First check if the question exists
    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      console.log(`Question with id ${id} not found`);
      return res.status(404).json({ error: 'Question not found' });
    }

    // Delete any answers associated with this question first
    await prisma.answer.deleteMany({
      where: { questionId: id }
    });

    // Then delete the question
    await prisma.question.delete({
      where: { id }
    });

    console.log('Question and associated answers deleted successfully');
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to delete question',
        message: error.message,
        details: error
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to delete question',
        message: 'Unknown error occurred'
      });
    }
  }
}) as RequestHandler);

// Add a new question
router.post('/', auth, adminAuth, (async (req: Request, res: Response): Promise<any> => {
  try {
    console.log('POST /questions - Creating new question:', req.body);
    
    const { text, type, category, options, correctAnswer, xpReward, badge } = req.body;

    // Validate required fields
    if (!text || !type || !category) {
      console.log('Validation failed - Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: {
          text: !text,
          type: !type,
          category: !category
        }
      });
    }

    // Get the highest order number
    const highestOrder = await prisma.question.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true }
    });
    
    const nextOrder = (highestOrder?.order || 0) + 1;
    console.log('Next order number:', nextOrder);

    // Ensure options is properly stringified
    let optionsString = "[]";
    if (options) {
      if (Array.isArray(options)) {
        optionsString = JSON.stringify(options);
      } else if (typeof options === 'string') {
        try {
          const parsed = JSON.parse(options);
          if (Array.isArray(parsed)) {
            optionsString = options;
          }
        } catch (e) {
          console.warn('Invalid options string, using empty array');
        }
      }
    }
    console.log('Options to save:', optionsString);

    let badgeId = undefined;
    
    // Create badge first if provided
    if (badge) {
      try {
        const badgeData = {
          id: badge.id || `badge-${Date.now()}`,
          name: badge.name,
          description: badge.description,
          icon: badge.icon || 'star',
          image: badge.image || '',
          requiredXP: badge.requiredXP
        };

        const createdBadge = await prisma.badge.create({
          data: badgeData
        });
        
        console.log('Badge created successfully:', createdBadge);
        badgeId = createdBadge.id;
      } catch (error) {
        console.error('Error creating badge:', error);
        return res.status(500).json({ 
          error: 'Failed to create badge',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Create the question with badge relation
    const questionData = {
      text,
      type,
      category,
      options: optionsString,
      correctAnswer: correctAnswer || '',
      xpReward: Number(xpReward) || 10,
      order: nextOrder,
      ...(badgeId && { badge: { connect: { id: badgeId } } })
    };

    console.log('Creating question with data:', questionData);

    const question = await prisma.question.create({
      data: questionData,
      include: {
        badge: true
      }
    });

    // Parse options back to array before sending response
    const responseQuestion = {
      ...question,
      options: JSON.parse(question.options)
    };

    console.log('Question created successfully:', responseQuestion);
    res.status(201).json(responseQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ 
      error: 'Failed to create question',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as RequestHandler);

export default router; 