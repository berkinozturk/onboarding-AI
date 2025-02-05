import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { Request, Response } from 'express';

dotenv.config();

const router = express.Router();
let chatbotProcess: any = null;
let isInitialized = false;
let initializationPromise: Promise<any> | null = null;

// Initialize chatbot service
router.post('/init', async (req: Request, res: Response) => {
  try {
    // If already initializing, wait for it
    if (initializationPromise) {
      try {
        await initializationPromise;
        return res.json({ success: true, message: 'Chatbot already initialized' });
      } catch (error) {
        // If previous initialization failed, allow retry
        initializationPromise = null;
      }
    }

    // If chatbot is already running and initialized, return success
    if (chatbotProcess && isInitialized) {
      return res.json({ success: true, message: 'Chatbot already initialized' });
    }

    // If chatbot process exists but not initialized, kill it
    if (chatbotProcess) {
      chatbotProcess.kill();
      chatbotProcess = null;
      isInitialized = false;
    }

    console.log('Initializing chatbot...');
    const scriptPath = path.join(__dirname, '../../chatbot_service/chatbot.py');
    console.log('Script path:', scriptPath);

    // Check if Python script exists
    if (!require('fs').existsSync(scriptPath)) {
      throw new Error(`Python script not found at: ${scriptPath}`);
    }

    initializationPromise = new Promise((resolve, reject) => {
      try {
        // Start Python process
        chatbotProcess = spawn('python3', [scriptPath], { 
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let error = '';
        let initializationTimeout: NodeJS.Timeout;

        // Set up event handlers
        chatbotProcess.stdout.on('data', (data: Buffer) => {
          const text = data.toString();
          console.log('Python output:', text);
          output += text;
          
          // Check for successful initialization
          if (text.includes('Chatbot initialized successfully')) {
            isInitialized = true;
            clearTimeout(initializationTimeout);
            resolve({ success: true, message: 'Chatbot initialized successfully' });
          }
        });

        chatbotProcess.stderr.on('data', (data: Buffer) => {
          const text = data.toString();
          console.error('Python error:', text);
          error += text;
        });

        chatbotProcess.on('close', (code: number) => {
          console.log('Python process closed with code:', code);
          if (!isInitialized) {
            isInitialized = false;
            chatbotProcess = null;
            clearTimeout(initializationTimeout);
            reject(new Error(error || 'Failed to initialize chatbot'));
          }
        });

        chatbotProcess.on('error', (err: Error) => {
          console.error('Process error:', err);
          chatbotProcess = null;
          isInitialized = false;
          clearTimeout(initializationTimeout);
          reject(err);
        });

        // Set timeout for initialization
        initializationTimeout = setTimeout(() => {
          if (!isInitialized) {
            chatbotProcess?.kill();
            chatbotProcess = null;
            isInitialized = false;
            reject(new Error('Initialization timeout'));
          }
        }, 30000);

        // Send initialization command
        chatbotProcess.stdin.write('initialize\n');

      } catch (error) {
        reject(error);
      }
    });

    const result = await initializationPromise;
    initializationPromise = null;
    res.json(result);

  } catch (error: any) {
    console.error('Route error:', error);
    chatbotProcess = null;
    isInitialized = false;
    initializationPromise = null;
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat endpoint
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    if (!isInitialized || !chatbotProcess) {
      // Try to initialize if not initialized
      try {
        await router.post('/init', req, res as any);
      } catch (error) {
        return res.status(400).json({ success: false, error: 'Chatbot initialization failed' });
      }
    }

    console.log('Sending message to chatbot:', message);
    
    const response = await new Promise((resolve, reject) => {
      let responseText = '';
      let errorText = '';
      let responseReceived = false;
      
      const messageHandler = (data: Buffer) => {
        const text = data.toString();
        console.log('Python output:', text);
        responseText += text;
        
        if (text.includes('Error getting response:')) {
          responseReceived = true;
          cleanup();
          reject(new Error(text.split('Error getting response:')[1].trim()));
        } else if (text.trim()) {
          responseReceived = true;
          cleanup();
          resolve(text.trim());
        }
      };
      
      const errorHandler = (data: Buffer) => {
        const text = data.toString();
        console.error('Python error:', text);
        errorText += text;
      };
      
      const cleanup = () => {
        clearTimeout(timeout);
        chatbotProcess.stdout.removeListener('data', messageHandler);
        chatbotProcess.stderr.removeListener('data', errorHandler);
      };
      
      chatbotProcess.stdout.on('data', messageHandler);
      chatbotProcess.stderr.on('data', errorHandler);
      
      const timeout = setTimeout(() => {
        if (!responseReceived) {
          cleanup();
          reject(new Error('Response timeout'));
        }
      }, 30000);
      
      chatbotProcess.stdin.write(`${message}\n`);
    });

    res.json({ success: true, response });
    
  } catch (error: any) {
    console.error('Chat error:', error);
    
    if (error.message.includes('quota exceeded')) {
      res.status(429).json({ 
        success: false, 
        error: 'OpenAI API quota exceeded. Please check your billing details.'
      });
    } else {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

export default router; 