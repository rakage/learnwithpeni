# Learn with Peni - LMS Platform

A comprehensive Learning Management System (LMS) built with Next.js, featuring course management, payment integration, and a beautiful user interface.

## 🌟 Features

### 🖥️ Front Page (Landing Page)

- Hero section for flagship course "Remote Work Mastery"
- Course highlights and features
- Student testimonials
- Instructor profile (Peni Johnson)
- Pricing tiers (Basic $97 / Premium $197)
- FAQ section
- Responsive design with modern UI

### 🔐 Authentication

- Email & Password authentication
- Google OAuth integration
- Secure user registration and login
- Protected routes and user sessions
- Automatic redirect to payment after signup

### 💳 Payment Integration

- Stripe payment gateway integration
- Multiple pricing plans
- Secure checkout process
- Payment success/cancel handling
- Webhook integration for enrollment automation

### 🎓 LMS Features

#### Student Dashboard

- Course progress tracking
- Module completion status
- Responsive course cards
- User profile management
- Lifetime access to purchased courses

#### Course Viewing

- Video streaming (YouTube/Vimeo support)
- Text-based lessons with rich content
- Downloadable files (PDF/DOC)
- Module navigation sidebar
- Progress tracking and completion marking
- Mobile-responsive video player

#### Admin Panel (Secured)

- Course creation and management
- Module management with different content types
- User management and enrollment tracking
- Revenue and analytics dashboard
- Course publishing controls

### 🧱 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **Payments**: Stripe
- **UI Components**: Lucide React icons, React Hot Toast
- **Video Player**: React Player
- **Styling**: TailwindCSS with custom design system

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Supabase project
- Stripe account
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd lms-learn-with-peni
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Copy `.env.local.example` to `.env.local` and fill in your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (Optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Database
DATABASE_URL=your_postgresql_database_url

# App Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

4. **Set up the database**

```bash
npx prisma generate
npx prisma db push
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Supabase Setup

1. **Create a new Supabase project**
2. **Enable Authentication providers**:
   - Go to Authentication > Settings
   - Enable Email and Google providers
   - Add your Google OAuth credentials
3. **Set up authentication settings**:
   - Site URL: `http://localhost:3000` (development)
   - Redirect URLs: `http://localhost:3000/auth/callback`

### Stripe Setup

1. **Create Stripe products and prices**:
   - Basic Plan: $97
   - Premium Plan: $197
2. **Set up webhook endpoint**:
   - URL: `https://yourdomain.com/api/webhook/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
3. **Test with Stripe test cards**:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## 📁 Project Structure

```
├── app/                      # Next.js App Router
│   ├── admin/               # Admin panel pages
│   ├── api/                 # API routes
│   ├── auth/                # Authentication pages
│   ├── course/              # Course viewing pages
│   ├── dashboard/           # User dashboard
│   ├── payment/             # Payment pages
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Landing page
├── lib/                     # Utility libraries
│   ├── prisma.ts           # Prisma client
│   ├── stripe.ts           # Stripe configuration
│   ├── supabase.ts         # Supabase client
│   └── utils.ts            # Helper functions
├── prisma/                  # Database schema
│   └── schema.prisma       # Prisma schema
├── public/                  # Static assets
└── components/             # Reusable components (future)
```

## 🔧 Configuration

### Database Schema

The application uses Prisma with the following main models:

- `User` - User accounts and profiles
- `Course` - Course information
- `Module` - Course modules/lessons
- `Enrollment` - User course enrollments
- `Progress` - Module completion tracking
- `Payment` - Payment records

### Authentication Flow

1. User signs up via email/password or Google OAuth
2. Redirect to payment page for course purchase
3. Stripe handles payment processing
4. Webhook creates enrollment and course access
5. User redirected to dashboard with course access

### Payment Flow

1. User selects pricing plan
2. Stripe Checkout session created
3. Secure payment processing
4. Webhook enrollment automation
5. Course access granted immediately

## 🎨 Customization

### Styling

- Built with TailwindCSS
- Custom color scheme using CSS variables
- Responsive design for all screen sizes
- Dark mode ready (variables included)

### Content Management

- Course content stored in database
- Support for video (YouTube/Vimeo), text, and file modules
- Rich text content with HTML support
- Progress tracking per module

### Branding

- Easy to customize colors in `tailwind.config.ts`
- Update logo and branding in navigation components
- Modify course content and instructor information

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

### Other Platforms

- **Netlify**: Configure build settings for Next.js
- **Railway**: Database and app hosting
- **Heroku**: Full-stack deployment with add-ons

### Production Checklist

- [ ] Set up production database
- [ ] Configure Stripe live keys
- [ ] Set up proper domain for Supabase redirects
- [ ] Configure webhook endpoints
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure analytics (Google Analytics)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♀️ Support

For support and questions:

- Email: support@learnwithpeni.com
- Documentation: [Project Wiki](link-to-wiki)
- Issues: [GitHub Issues](link-to-issues)

## 🎯 Future Enhancements

- [ ] Certificate generation for course completion
- [ ] Discussion forums and community features
- [ ] Mobile app development
- [ ] Advanced analytics and reporting
- [ ] Multiple course support
- [ ] Instructor onboarding system
- [ ] Live video streaming integration
- [ ] Gamification features (badges, points)
- [ ] Multi-language support

---

Built with ❤️ by the Learn with Peni team
