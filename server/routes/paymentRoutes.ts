import { Router } from 'express';
import express from 'express';
import { createCheckoutSession, handleWebhook } from '../controllers/paymentController';
import { protect } from '../middlewares/auth';

const router = Router();

// Webhook must use raw body - define BEFORE any JSON middleware
// Note: the raw body middleware is applied in server.ts for this route
router.post('/webhook', handleWebhook);

// Protected checkout route
router.post('/checkout', protect, createCheckoutSession);

export default router;
