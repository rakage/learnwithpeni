import Image from "next/image";
import Link from "next/link";
import { CheckCircle, Star, Users, Clock, BookOpen, Award } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-accent-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <div className="mb-8 lg:mb-0">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Master <span className="text-primary-600">Remote Work</span>{" "}
                Like a Pro
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Transform your career with our comprehensive Remote Work Mastery
                course. Learn the skills, tools, and mindset needed to thrive in
                the remote work era.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth/signup"
                  className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors text-center"
                >
                  Start Learning Now
                </Link>
                <button className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors">
                  Watch Preview
                </button>
              </div>
              <div className="flex items-center mt-6 text-sm text-gray-600">
                <Users className="h-5 w-5 mr-2" />
                <span>1,234+ students enrolled</span>
                <div className="flex items-center ml-6">
                  <Star className="h-5 w-5 text-yellow-400 mr-1" />
                  <span>4.9/5 rating</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <Image
                src="/api/placeholder/600/400"
                alt="Remote Work Mastery Course"
                width={600}
                height={400}
                className="rounded-lg shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course Highlights */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You'll Learn
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive curriculum designed to make you a remote work expert
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {highlight.title}
                  </h3>
                </div>
                <p className="text-gray-600">{highlight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Students Say
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full mr-3"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Instructor Profile */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
            <div className="mb-8 lg:mb-0">
              <Image
                src="/api/placeholder/400/400"
                alt="Instructor Peni"
                width={400}
                height={400}
                className="rounded-lg shadow-lg mx-auto"
              />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Meet Your Instructor
              </h2>
              <h3 className="text-2xl font-semibold text-primary-600 mb-4">
                Peni Johnson
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Remote Work Expert & Digital Nomad with 8+ years of experience
                helping professionals transition to successful remote careers.
                Featured in Forbes, TechCrunch, and Remote Year.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    5000+
                  </div>
                  <div className="text-gray-600">Students Taught</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">8+</div>
                  <div className="text-gray-600">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    4.9/5
                  </div>
                  <div className="text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">50+</div>
                  <div className="text-gray-600">Countries Visited</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-primary-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600">
              Invest in your remote work future today
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {courseOfferings.map((course, index) => (
              <div
                key={course.id}
                className={`bg-white p-8 rounded-lg shadow-sm ${
                  course.popular ? "border-2 border-primary-600 relative" : ""
                }`}
              >
                {course.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {course.title}
                </h3>
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(course.price)}
                </div>
                <div className="text-lg text-gray-600 font-normal mb-6">
                  /lifetime access
                </div>
                <ul className="space-y-3 mb-8">
                  {course.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/payment?courseId=${course.id}`}
                  className={`w-full px-6 py-3 rounded-lg text-center font-semibold transition-colors block ${
                    course.popular
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  Enroll Now - Pay with Indonesian Methods
                </Link>
                <div className="mt-3 text-center text-sm text-gray-600">
                  💳 BCA, Mandiri, ShopeePay, OVO, DANA & more
                </div>
              </div>
            ))}
          </div>

          {/* Payment Methods Preview */}
          <div className="mt-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Pay with your favorite Indonesian payment method
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-4 opacity-75">
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  BCA Virtual Account
                </span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  ShopeePay
                </span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">OVO</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">DANA</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">
                  Mandiri VA
                </span>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span className="text-sm font-medium text-gray-700">QRIS</span>
              </div>
              <div className="text-sm text-gray-600">+ 15 more methods</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-primary-400" />
              <span className="text-xl font-bold">Learn with Peni</span>
            </div>
            <p className="text-gray-400 mb-4">
              Empowering remote workers worldwide
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Contact
              </a>
            </div>
            <p className="text-gray-400 mt-8">
              © 2024 Learn with Peni. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const highlights = [
  {
    title: "Remote Work Fundamentals",
    description:
      "Master the basics of remote work including time management, communication, and productivity.",
  },
  {
    title: "Tools & Technology",
    description:
      "Learn essential remote work tools like Slack, Zoom, Asana, and more.",
  },
  {
    title: "Work-Life Balance",
    description:
      "Discover strategies to maintain healthy boundaries while working from home.",
  },
  {
    title: "Building Remote Teams",
    description:
      "Leadership skills for managing and building effective remote teams.",
  },
  {
    title: "Digital Nomad Lifestyle",
    description:
      "How to work remotely while traveling the world safely and efficiently.",
  },
  {
    title: "Career Advancement",
    description:
      "Strategies for growing your career and getting promoted in remote roles.",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Software Developer",
    content:
      "This course completely transformed how I work remotely. I'm now more productive than ever!",
    avatar: "/api/placeholder/40/40",
  },
  {
    name: "Mike Rodriguez",
    role: "Marketing Manager",
    content:
      "Peni's insights on remote team management have been invaluable for my leadership role.",
    avatar: "/api/placeholder/40/40",
  },
  {
    name: "Emily Watson",
    role: "UX Designer",
    content:
      "I landed my dream remote job just 2 months after completing this course. Highly recommended!",
    avatar: "/api/placeholder/40/40",
  },
];

// Course offerings that integrate with the Duitku payment system
const courseOfferings = [
  {
    id: "remote-work-basic", // This should match course IDs in your database
    title: "Remote Work Basics",
    price: 299000, // IDR 299,000
    popular: false,
    features: [
      "Complete course access",
      "8+ video modules",
      "Downloadable resources",
      "Mobile access",
      "Community forum access",
    ],
  },
  {
    id: "remote-work-premium", // This should match course IDs in your database
    title: "Remote Work Mastery",
    price: 599000, // IDR 599,000
    popular: true,
    features: [
      "Everything in Basic",
      "15+ advanced modules",
      "1-on-1 coaching session",
      "Certificate of completion",
      "Private community access",
      "Bonus templates & tools",
      "Lifetime updates",
    ],
  },
];

const faqs = [
  {
    question: "How long do I have access to the course?",
    answer:
      "You have lifetime access to all course materials. Learn at your own pace and revisit content anytime.",
  },
  {
    question: "Is this course suitable for beginners?",
    answer:
      "Absolutely! This course is designed for anyone looking to improve their remote work skills, regardless of experience level.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major Indonesian payment methods including BCA, Mandiri, BNI Virtual Accounts, ShopeePay, OVO, DANA, QRIS, and many more through our secure Duitku payment gateway.",
  },
  {
    question: "Can I access the course on mobile?",
    answer:
      "Yes, the course is fully optimized for mobile devices. Learn anywhere, anytime.",
  },
  {
    question: "Do I get a certificate?",
    answer:
      "Premium members receive a certificate of completion that can be shared on LinkedIn and other platforms.",
  },
  {
    question: "Is payment secure?",
    answer:
      "Yes, all payments are processed through Duitku, a trusted Indonesian payment gateway with bank-level security and encryption.",
  },
];
