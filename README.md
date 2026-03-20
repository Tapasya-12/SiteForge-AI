# SiteForge AI

![SiteForge AI Logo](client/src/assets/logo.svg)

An AI-powered website builder that transforms your ideas into fully functional websites using advanced machine learning and intuitive design tools.

## Overview

SiteForge AI is a comprehensive platform that enables users to create professional websites through natural language prompts. Powered by OpenAI's advanced AI models, the platform generates complete, responsive websites with modern design patterns, optimized code, and seamless user experiences. Whether you're a business owner, freelancer, or developer, SiteForge AI democratizes web development by making it accessible to everyone.

## Tech Stack

### Frontend
- **React** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Lucide React** - Modern icon library
- **Sonner** - Toast notifications
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **Prisma** - Database ORM
- **PostgreSQL** - Relational database
- **OpenAI API** - AI-powered content generation
- **Better Auth** - Authentication system

### Other Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vite** - Build tooling

## Features Implemented ✅

- **AI-Powered Website Generation**: Create complete websites using natural language prompts
- **User Authentication**: Secure login and registration system
- **Project Management**: Create, view, edit, and organize website projects
- **Live Preview**: Real-time preview of generated websites across different devices (phone, tablet, desktop)
- **Code Download**: Export generated website code as HTML files
- **Publishing System**: Publish websites with unique URLs
- **Version Control**: Track and manage different versions of website projects
- **Responsive Design**: Automatically generated mobile-friendly layouts
- **Modern UI Components**: Clean, dark-themed interface with intuitive navigation
- **Pricing Plans**: Multiple subscription tiers with different credit allocations
- **Community Features**: Browse and explore community-created websites
- **Settings Management**: User profile and application settings

## Features In Progress 🚧

- **Real-time Collaboration**: Multi-user editing capabilities
- **Advanced Customization**: Fine-grained control over generated components
- **Template Library**: Pre-built templates for common website types
- **SEO Optimization**: Automatic meta tag and SEO configuration
- **Analytics Integration**: Built-in website analytics and tracking

## Planned Features 📌

- **E-commerce Integration**: Built-in shopping cart and payment processing
- **CMS Functionality**: Content management system for dynamic websites
- **API Integration**: Connect websites to external services and databases
- **Multi-language Support**: Internationalization and localization
- **White-label Solutions**: Custom branding options for agencies
- **Mobile App Export**: Generate mobile apps from website projects

## Project Structure

```
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── assets/       # Images, icons, and static data
│   │   ├── components/   # Reusable UI components
│   │   ├── configs/      # API and configuration files
│   │   ├── lib/          # Utility libraries and auth
│   │   ├── pages/        # Application pages/routes
│   │   └── types/        # TypeScript type definitions
├── server/                # Backend Node.js application
│   ├── configs/          # Server configurations
│   ├── controllers/      # Route controllers
│   ├── lib/              # Server utilities
│   ├── middlewares/      # Express middlewares
│   ├── prisma/           # Database schema and migrations
│   ├── routes/           # API route definitions
│   └── types/            # Server type definitions
└── README.md             # Project documentation
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd siteforge-ai
   ```

2. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Database Setup**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Environment Variables**

   Create `.env` files in both `client` and `server` directories:

   **Server (.env)**
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/siteforge_ai"
   OPENAI_API_KEY="your-openai-api-key"
   JWT_SECRET="your-jwt-secret"
   ```

   **Client (.env)**
   ```
   VITE_API_BASE_URL="http://localhost:3000/api"
   ```

5. **Start the development servers**
   ```bash
   # Start the backend server
   cd server
   npm run dev

   # Start the frontend (in a new terminal)
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## Known Issues / Bugs ⚠️

- **Project ID Handling**: Occasional undefined `projectId` in API responses causing navigation errors
- **Null API Responses**: Some API endpoints may return null data unexpectedly
- **Loading States**: Inconsistent loading indicators during AI generation
- **Error Boundaries**: Limited error handling for network failures
- **File Upload**: Image upload functionality not fully implemented
- **Version History**: Version tracking may lose data in some edge cases

## Future Improvements

- **Performance Optimization**: Implement code splitting and lazy loading
- **Security Enhancements**: Add rate limiting and input validation
- **Testing Suite**: Comprehensive unit and integration tests
- **Documentation**: API documentation and user guides
- **Monitoring**: Application performance monitoring and logging
- **Scalability**: Microservices architecture for better scalability

## Contributing

We welcome contributions to SiteForge AI! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Ensure code passes linting and formatting checks

---

Built with ❤️ using modern web technologies
