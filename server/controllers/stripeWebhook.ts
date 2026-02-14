import { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../lib/prisma.js";

export const stripeWebhook = async (request: Request, response: Response) => {
    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!endpointSecret) {
            console.log('❌ Missing STRIPE_WEBHOOK_SECRET');
            return response.status(500).json({ received: false });
        }

        // Debug: log raw body info
        console.log('🔔 Webhook hit! Body type:', typeof request.body, 'Body length:', Buffer.isBuffer(request.body) ? request.body.length : JSON.stringify(request.body).length);

        // Get the signature sent by Stripe
        const signature = request.headers['stripe-signature'] as string;
        console.log('🔑 Stripe signature present:', !!signature);

        let event;
        try {
            event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                endpointSecret
            );
            console.log('✅ Webhook signature verified successfully');
        } catch (err: any) {
            console.log(`⚠️ Webhook signature verification failed.`, err.message);
            return response.sendStatus(400);
        }

        const grantCreditsFromTransaction = async (transactionId?: string, appId?: string) => {
            console.log('📋 grantCreditsFromTransaction called with:', { transactionId, appId });

            if (!transactionId) {
                console.log('❌ No transactionId provided, skipping');
                return;
            }
            if (appId !== 'ai-site-builder') {
                console.log('❌ appId mismatch, expected "ai-site-builder" got:', appId);
                return;
            }

            const existing = await prisma.transaction.findUnique({ where: { id: transactionId } });
            console.log('📦 Existing transaction:', existing);

            if (!existing) {
                console.log('❌ Transaction not found in DB');
                return;
            }
            if (existing.isPaid) {
                console.log('⚠️ Transaction already marked as paid, skipping');
                return;
            }

            const transaction = await prisma.transaction.update({
                where: { id: transactionId },
                data: { isPaid: true }
            });
            console.log('✅ Transaction marked as paid:', transaction.id);

            const updatedUser = await prisma.user.update({
                where: { id: transaction.userId },
                data: {
                    credits: {
                        increment: transaction.credits
                    }
                }
            });
            console.log('✅ User credits updated! User:', updatedUser.id, 'New credits:', updatedUser.credits);
        };

        // Handle the event
        console.log('📨 Stripe webhook event:', event.type);
        switch (event.type) {
            case 'checkout.session.completed':
                {
                    const session = event.data.object as Stripe.Checkout.Session;
                    console.log('🛒 Full session metadata:', JSON.stringify(session.metadata));
                    const { transactionId, appId } = (session.metadata || {}) as {
                        transactionId?: string;
                        appId?: string;
                    };
                    console.log('checkout.session.completed metadata', { transactionId, appId });
                    await grantCreditsFromTransaction(transactionId, appId);
                }
                break;
            case 'payment_intent.succeeded':
                {
                    const paymentIntent = event.data.object as Stripe.PaymentIntent;
                    console.log('💳 Payment intent ID:', paymentIntent.id);
                    const sessionList = await stripe.checkout.sessions.list({
                        payment_intent: paymentIntent.id,
                    });
                    console.log('📃 Sessions found:', sessionList.data.length);
                    const session = sessionList.data[0];
                    const { transactionId, appId } = (session?.metadata || {}) as {
                        transactionId?: string;
                        appId?: string;
                    };
                    console.log('payment_intent.succeeded metadata', { transactionId, appId });
                    await grantCreditsFromTransaction(transactionId, appId);
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
        response.json({ received: true });
    } catch (error: any) {
        console.log('❌ Webhook error:', error);
        return response.status(500).json({ received: false });
    }
}
