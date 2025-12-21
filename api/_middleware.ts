import { VercelRequest, VercelResponse } from '@vercel/node';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  try {
    console.log('=== FIREBASE ADMIN INITIALIZATION ===');
    console.log('FIREBASE_SERVICE_ACCOUNT present:', !!process.env.FIREBASE_SERVICE_ACCOUNT);
    console.log('FIREBASE_SERVICE_ACCOUNT length:', process.env.FIREBASE_SERVICE_ACCOUNT?.length);

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
    }

    // Parse the full service account JSON from environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    console.log('Service account parsed successfully');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('Client Email present:', !!serviceAccount.client_email);
    console.log('Private Key present:', !!serviceAccount.private_key);

    if (!serviceAccount.project_id) {
      throw new Error('Service account JSON missing project_id');
    }
    if (!serviceAccount.client_email) {
      throw new Error('Service account JSON missing client_email');
    }
    if (!serviceAccount.private_key) {
      throw new Error('Service account JSON missing private_key');
    }

    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log('Firebase Admin initialized successfully');
    console.log('=== END FIREBASE INITIALIZATION ===');
  } catch (error: any) {
    console.error('=== FIREBASE INITIALIZATION FAILED ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END FIREBASE INITIALIZATION FAILURE ===');
    throw error; // Re-throw to crash the app with proper error
  }
}

const db = getFirestore();
const auth = getAuth();

// Rate limiting configurations
export const smsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 SMS requests per windowMs
  message: {
    error: 'Too many SMS requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 API requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.firebaseapp.com", "https://*.googleapis.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

// Authentication middleware
export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<{ user: any } | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header missing or invalid' });
      return null;
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);

    // Get user data from Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) {
      res.status(401).json({ error: 'User not found' });
      return null;
    }

    const userData = userDoc.data();
    return {
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userData?.role || 'user',
        fullName: userData?.fullName || 'User',
      }
    };
  } catch (error) {
    console.error('Auth verification failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

// Admin-only middleware
export async function requireAdmin(req: VercelRequest, res: VercelResponse): Promise<{ user: any } | null> {
  const authResult = await requireAuth(req, res);
  if (!authResult) return null;

  if (authResult.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }

  return authResult;
}

// Input validation middleware
export const validateSMSInput = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 160 })
    .withMessage('SMS text must be between 1 and 160 characters')
    .matches(/^[^<>&"']*$/)
    .withMessage('SMS text contains invalid characters'),

  body('sender')
    .optional()
    .trim()
    .isLength({ min: 1, max: 11 })
    .withMessage('Sender ID must be between 1 and 11 characters')
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage('Sender ID contains invalid characters'),

  body('destinations')
    .isArray({ min: 1, max: 100 })
    .withMessage('Destinations must be an array with 1-100 items'),

  body('destinations.*')
    .isMobilePhone('any')
    .withMessage('Each destination must be a valid phone number'),
];

export const validateBroadcastInput = [
  ...validateSMSInput,
  body('destinations')
    .isArray({ min: 1, max: 500 })
    .withMessage('Broadcast destinations must be an array with 1-500 items'),
];

export const validatePersonalizedSMSInput = [
  body('text')
    .trim()
    .isLength({ min: 1, max: 160 })
    .withMessage('SMS text must be between 1 and 160 characters'),

  body('sender')
    .optional()
    .trim()
    .isLength({ min: 1, max: 11 })
    .withMessage('Sender ID must be between 1 and 11 characters'),

  body('destinations')
    .isArray({ min: 1, max: 100 })
    .withMessage('Destinations must be an array with 1-100 items'),

  body('destinations.*.number')
    .isMobilePhone('any')
    .withMessage('Each destination number must be a valid phone number'),

  body('destinations.*.values')
    .optional()
    .isObject()
    .withMessage('Values must be an object'),
];

// Audit logging function
export async function logAuditEvent(
  operation: string,
  userId: string,
  details: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await db.collection('audit_logs').add({
      operation,
      userId,
      details,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

// Handle OPTIONS requests for CORS
export function handleOptions(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);
  res.status(200).end();
}

// Apply security headers to response
export function applySecurityHeaders(res: VercelResponse) {
  // Apply CORS headers
  res.setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
  res.setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials']);

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
}

// Validation error handler
export function handleValidationErrors(req: VercelRequest, res: VercelResponse): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
    return true;
  }
  return false;
}