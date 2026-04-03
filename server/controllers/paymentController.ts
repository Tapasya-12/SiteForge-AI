import { Request, Response } from 'express';
import stripe from '../configs/stripe';
import prisma from '../lib/prisma';
import Stripe from 'stripe';

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { planId, credits, amount, planName } = req.body;

    if (!planId || credits === undefined || amount === undefined) {
      return res.status(400).json({ error: 'planId, credits, and amount are required' });
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        planId,
        amount,
        credits,
        isPaid: false,
        userId: req.userId,
      },
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: planName || `${credits} Credits - SiteForge AI`,
              description: `${credits} credits to generate and revise websites on SiteForge AI`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        transactionId: transaction.id,
        userId: req.userId,
        credits: credits.toString(),
      },
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing?cancelled=true`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe signature' });
    }

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;

        const transactionId = session.metadata?.transactionId;
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || '0', 10);

        if (!transactionId || !userId || !credits) {
          console.error('Missing metadata in completed checkout session');
          return res.status(400).json({ error: 'Missing metadata' });
        }

        await prisma.transaction.update({
          where: { id: transactionId },
          data: { isPaid: true },
        });

        await prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: credits } },
        });

        console.log(`Payment successful: ${credits} credits added to user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
};
