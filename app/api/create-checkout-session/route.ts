import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { priceId, userId, plan } = await request.json();

    if (!priceId || !userId || !plan) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Create or retrieve customer
    const { data: user } = await supabase.auth.admin.getUserById(userId);

    if (!user.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let customerId = user.user.user_metadata?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.user.email,
        metadata: {
          userId: userId,
        },
      });
      customerId = customer.id;

      // Update user metadata with Stripe customer ID
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user.user.user_metadata,
          stripe_customer_id: customerId,
        },
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.nextUrl.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/payment/cancel`,
      metadata: {
        userId: userId,
        planId: plan.id,
        planName: plan.name,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
