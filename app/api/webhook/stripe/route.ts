import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  let event;

  try {
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: any) {
  const { userId, planId, planName } = session.metadata;

  try {
    // Create user if doesn't exist
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        stripeCustomerId: session.customer,
      },
      create: {
        id: userId,
        email: session.customer_details?.email || "",
        name: session.customer_details?.name || "",
        stripeCustomerId: session.customer,
      },
    });

    // Create or get the course (Remote Work Mastery)
    const course = await prisma.course.upsert({
      where: { id: "remote-work-mastery" },
      update: {},
      create: {
        id: "remote-work-mastery",
        title: "Remote Work Mastery",
        description:
          "Complete guide to mastering remote work skills and productivity.",
        price: planId === "premium" ? 197 : 97,
        image: "/api/placeholder/600/400",
        published: true,
        featured: true,
      },
    });

    // Create course modules if they don't exist
    const modules = [
      {
        id: "intro-remote-work",
        title: "Introduction to Remote Work",
        description: "Learn the fundamentals of remote work",
        type: "VIDEO",
        order: 1,
        videoUrl: "https://www.youtube.com/watch?v=example1",
        duration: 15,
      },
      {
        id: "home-office-setup",
        title: "Setting Up Your Home Office",
        description: "Create an optimal workspace at home",
        type: "VIDEO",
        order: 2,
        videoUrl: "https://www.youtube.com/watch?v=example2",
        duration: 20,
      },
      {
        id: "time-management",
        title: "Time Management Strategies",
        description: "Master time management for remote work",
        type: "TEXT",
        order: 3,
        content: "Time management content goes here...",
        duration: 25,
      },
      {
        id: "communication-tools",
        title: "Communication Tools Deep Dive",
        description: "Learn essential communication tools",
        type: "VIDEO",
        order: 4,
        videoUrl: "https://www.youtube.com/watch?v=example3",
        duration: 30,
      },
      {
        id: "team-leadership",
        title: "Remote Team Leadership",
        description: "Lead remote teams effectively",
        type: "FILE",
        order: 5,
        fileUrl: "/docs/remote-leadership.pdf",
        duration: 35,
      },
      {
        id: "work-life-balance",
        title: "Work-Life Balance",
        description: "Maintain healthy work-life balance",
        type: "VIDEO",
        order: 6,
        videoUrl: "https://www.youtube.com/watch?v=example4",
        duration: 25,
      },
      {
        id: "digital-nomad",
        title: "Digital Nomad Lifestyle",
        description: "Work remotely while traveling",
        type: "TEXT",
        order: 7,
        content: "Digital nomad lifestyle content...",
        duration: 30,
      },
      {
        id: "productivity-techniques",
        title: "Advanced Productivity Techniques",
        description: "Boost your remote work productivity",
        type: "VIDEO",
        order: 8,
        videoUrl: "https://www.youtube.com/watch?v=example5",
        duration: 40,
      },
      {
        id: "career-advancement",
        title: "Career Advancement Remotely",
        description: "Grow your career in remote work",
        type: "FILE",
        order: 9,
        fileUrl: "/docs/career-advancement.pdf",
        duration: 30,
      },
      {
        id: "final-project",
        title: "Final Project",
        description: "Apply everything you've learned",
        type: "TEXT",
        order: 10,
        content: "Final project instructions...",
        duration: 60,
      },
    ];

    for (const moduleData of modules) {
      await prisma.module.upsert({
        where: { id: moduleData.id },
        update: {},
        create: {
          ...moduleData,
          courseId: course.id,
        },
      });
    }

    // Enroll user in course
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        courseId: course.id,
      },
    });

    // Record payment
    await prisma.payment.create({
      data: {
        userId: user.id,
        courseId: course.id,
        stripePaymentId: session.payment_intent,
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency,
        status: "COMPLETED",
      },
    });

    console.log(`User ${userId} enrolled in course ${course.id}`);
  } catch (error) {
    console.error("Error handling checkout completion:", error);
    throw error;
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  try {
    // Update payment status if needed
    await prisma.payment.updateMany({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        status: "COMPLETED",
      },
    });

    console.log(`Payment ${paymentIntent.id} succeeded`);
  } catch (error) {
    console.error("Error handling payment success:", error);
    throw error;
  }
}
