# SiteForge AI

![SiteForge AI Logo](client/src/assets/logo.svg)

**AI-Powered Website Builder** 🚀

Transform your ideas into stunning, fully-functional websites using natural language prompts. SiteForge AI combines advanced AI technology with modern web development practices to create professional websites in minutes, not months.

## 🌟 Project Overview

SiteForge AI democratizes web development by enabling anyone to create professional websites through conversational AI. Simply describe your vision in plain English, and our AI generates complete, responsive websites with modern design patterns, optimized code, and seamless user experiences.

**Problem Solved:** Traditional web development requires technical expertise, expensive agencies, or time-consuming DIY platforms. SiteForge AI eliminates these barriers by using AI to understand your needs and generate production-ready websites instantly.

**Key Benefits:**
- ⚡ **Instant Creation**: Generate websites in minutes instead of weeks
- 🎨 **Professional Design**: AI-crafted designs that rival top agencies
- 📱 **Fully Responsive**: Mobile-first websites that work on all devices
- 🔧 **No Coding Required**: Natural language interface for everyone
- 💰 **Cost Effective**: Credit-based system with flexible pricing

## ✅ Features

### Completed Features
- **🤖 AI-Powered Generation**: Create complete websites using natural language prompts with Groq AI (Llama 3.3)
- **🔐 User Authentication**: Secure login/registration system with Better Auth
- **📁 Project Management**: Create, organize, and manage multiple website projects
- **👁️ Live Preview**: Real-time preview across phone, tablet, and desktop viewports
- **🔄 Version Control**: Track changes with full rollback functionality
- **🌐 Publishing System**: Publish websites with unique URLs for sharing
- **🎨 Style Presets**: 6 professional design themes (Dark & Luxe, Bold Agency, Clean SaaS, Minimalist, Neon Future, Warm & Earthy)
- **💬 Conversation History**: Complete chat history for each project with AI interactions
- **👥 Community Gallery**: Browse and explore publicly published websites
- **💳 Credit System**: Usage tracking with 20 free credits for new users
- **⚙️ User Settings**: Profile management and application preferences
- **📊 Responsive Design**: Automatically generated mobile-friendly layouts
- **🎯 Modern UI**: Clean, dark-themed interface with intuitive navigation

### 🚧 In Progress / Upcoming Features
- **💰 Credit Purchasing**: Stripe/PayPal integration for buying additional credits
- **🔧 Advanced Customization**: Fine-grained control over generated components
- **📚 Template Library**: Pre-built templates for common website types
- **🔍 SEO Optimization**: Automatic meta tags and search engine optimization
- **📈 Analytics Integration**: Built-in website analytics and tracking
- **🛒 E-commerce Integration**: Shopping cart and payment processing
- **📝 CMS Functionality**: Content management system for dynamic websites
- **🔗 API Integration**: Connect websites to external services and databases
- **🌍 Multi-language Support**: Internationalization and localization
- **🏷️ White-label Solutions**: Custom branding options for agencies
- **📱 Mobile App Export**: Generate mobile apps from website projects

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend** | React 19 | Component-based UI framework |
| | TypeScript | Type-safe JavaScript development |
| | Vite | Fast build tool and development server |
| | Tailwind CSS 4 | Utility-first CSS framework |
| | React Router | Client-side routing and navigation |
| | Axios | HTTP client for API communication |
| | Better Auth UI | Authentication components |
| | Lucide React | Modern icon library |
| | Sonner | Toast notification system |
| **Backend** | Node.js | JavaScript runtime environment |
| | Express | Web application framework |
| | TypeScript | Server-side type safety |
| | Prisma | Database ORM and migration tool |
| | PostgreSQL | Relational database |
| | Groq SDK | AI-powered content generation |
| | Better Auth | Authentication and session management |
| **Development** | ESLint | Code linting and quality |
| | Prettier | Code formatting |
| | tsx | TypeScript execution for development |

## 🏗️ Architecture & Flow

### System Architecture
```mermaid
graph TB
    A[User Browser] --> B[Vite Dev Server]
    B --> C[React Frontend]
    C --> D[Express API Server]
    D --> E[Prisma ORM]
    E --> F[PostgreSQL Database]
    D --> G[Groq AI API]
    D --> H[Better Auth]

    subgraph "Client Layer"
        B
        C
    end

    subgraph "Server Layer"
        D
        E
        G
        H
    end

    subgraph "Data Layer"
        F
    end
```

### User Flow
```mermaid
flowchart TD
    A[User Visits Site] --> B{Authenticated?}
    B -->|No| C[Sign Up/Login]
    B -->|Yes| D[Dashboard]

    C --> D
    D --> E[Create Project]
    E --> F[Enter Description + Style]
    F --> G[AI Processing]
    G --> H[Website Generated]
    H --> I[Live Preview]
    I --> J{Make Changes?}
    J -->|Yes| K[Request Revisions]
    K --> G
    J -->|No| L[Publish Website]
    L --> M[Get Public URL]
```

### API Architecture
```mermaid
flowchart LR
    subgraph "User Routes"
        UR1[/GET /api/user/credits] --> UC[Get Credits]
        UR2[/POST /api/user/project] --> CP[Create Project]
        UR3[/GET /api/user/projects] --> GP[Get Projects]
        UR4[/GET /api/user/project/:id] --> GSP[Get Single Project]
        UR5[/GET /api/user/publish-toggle/:id] --> PT[Toggle Publish]
        UR6[/POST /api/user/purchase-credits] --> PC[Purchase Credits]
    end

    subgraph "Project Routes"
        PR1[/POST /api/project/revision/:id] --> MR[Make Revision]
        PR2[/PUT /api/project/save/:id] --> SP[Save Project]
        PR3[/GET /api/project/rollback/:id/:vid] --> RB[Rollback Version]
        PR4[/DELETE /api/project/:id] --> DP[Delete Project]
        PR5[/GET /api/project/preview/:id] --> PP[Get Preview]
        PR6[/GET /api/project/published] --> GPUB[Get Published]
        PR7[/GET /api/project/published/:id] --> GPID[Get Published by ID]
    end

    subgraph "Controllers"
        UC --> DB[(Database)]
        CP --> DB
        GP --> DB
        GSP --> DB
        PT --> DB
        PC --> DB
        MR --> AI[Groq AI]
        SP --> DB
        RB --> DB
        DP --> DB
        PP --> DB
        GPUB --> DB
        GPID --> DB
    end
```

## 📁 Project Structure

```
├── client/                          # React Frontend Application
│   ├── public/                     # Static assets served directly
│   ├── src/
│   │   ├── assets/                # Images, icons, and static data
│   │   │   ├── logo.svg           # SiteForge AI logo
│   │   │   └── assets.ts          # Asset exports
│   │   ├── components/            # Reusable UI components
│   │   │   ├── Navbar.tsx         # Main navigation bar
│   │   │   ├── Sidebar.tsx        # Project sidebar
│   │   │   ├── EditorPanel.tsx    # Code editor interface
│   │   │   ├── ProjectPreview.tsx # Website preview component
│   │   │   ├── Footer.tsx         # Site footer
│   │   │   ├── LoaderSteps.tsx    # Loading animation
│   │   │   └── SiteForgeLogo.tsx  # Logo component
│   │   ├── configs/               # Configuration files
│   │   │   └── axios.ts           # API client configuration
│   │   ├── lib/                   # Utility libraries
│   │   │   ├── auth-client.ts     # Authentication client
│   │   │   └── utils.ts           # Helper functions
│   │   ├── pages/                 # Application routes/pages
│   │   │   ├── Home.tsx           # Landing page with AI prompt input
│   │   │   ├── Projects.tsx       # Individual project editor
│   │   │   ├── MyProjects.tsx     # Project dashboard
│   │   │   ├── Preview.tsx        # Website preview page
│   │   │   ├── View.tsx           # Public website viewer
│   │   │   ├── Community.tsx      # Public projects gallery
│   │   │   ├── Pricing.tsx        # Pricing plans page
│   │   │   ├── Settings.tsx       # User settings
│   │   │   └── auth/              # Authentication pages
│   │   │       └── AuthPage.tsx   # Login/register forms
│   │   └── types/                 # TypeScript definitions
│   │       └── index.ts           # Global type exports
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.ts             # Vite configuration
│   ├── tsconfig.json              # TypeScript configuration
│   └── tailwind.config.js         # Tailwind CSS configuration
│
├── server/                         # Node.js Backend Application
│   ├── configs/                   # Server configurations
│   │   └── groq.ts               # Groq AI API configuration
│   ├── controllers/              # Route controllers
│   │   ├── userController.ts     # User-related operations
│   │   ├── projectController.ts  # Project management operations
│   │   └── aiHelper.ts           # AI interaction utilities
│   ├── lib/                      # Server utilities
│   │   ├── auth.ts               # Authentication setup
│   │   └── prisma.ts             # Database client
│   ├── middlewares/              # Express middlewares
│   │   └── auth.ts               # Authentication middleware
│   ├── prisma/                   # Database schema and migrations
│   │   ├── schema.prisma         # Database schema definition
│   │   └── migrations/           # Database migration files
│   ├── routes/                   # API route definitions
│   │   ├── userRoutes.ts         # User API endpoints
│   │   └── projectRoutes.ts      # Project API endpoints
│   ├── types/                    # Server type definitions
│   │   └── express.d.ts          # Express type extensions
│   ├── package.json              # Backend dependencies
│   ├── server.ts                 # Main server entry point
│   └── tsconfig.json             # TypeScript configuration
│
└── README.md                      # Project documentation
```

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher) - JavaScript runtime
- **PostgreSQL** (v12 or higher) - Relational database
- **Git** - Version control system
- **npm** or **yarn** - Package manager

### Step-by-Step Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd siteforge-ai
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```

3. **Database Setup**
   ```bash
   cd server

   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma migrate dev
   ```

4. **Environment Configuration**

   Create `.env` files in both `client` and `server` directories:

   **Server Environment (`server/.env`)**
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/siteforge_ai"

   # AI Service
   GROQ_API_KEY="your-groq-api-key-here"

   # Authentication
   JWT_SECRET="your-secure-jwt-secret-here"

   # CORS (optional - defaults to localhost)
   TRUSTED_ORIGINS="http://localhost:5173,http://localhost:3000"
   ```

   **Client Environment (`client/.env`)**
   ```env
   # API Configuration
   VITE_API_BASE_URL="http://localhost:3000/api"
   ```

5. **Start Development Servers**
   ```bash
   # Start backend server (from server directory)
   cd server
   npm run dev

   # Start frontend server (from client directory in new terminal)
   cd client
   npm run dev
   ```

6. **Access the Application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3000

### Additional Setup Notes
- **Groq API Key**: Get your API key from [Groq Console](https://console.groq.com/)
- **PostgreSQL**: Ensure PostgreSQL is running and accessible
- **Database URL**: Update with your actual PostgreSQL credentials
- **Ports**: Ensure ports 3000 (backend) and 5173 (frontend) are available

## 📖 Usage

### Creating Your First Website

1. **Sign Up/Login**: Create an account or sign in to access the platform
2. **Navigate to Home**: Use the main dashboard to start creating
3. **Enter Description**: Describe your website in natural language
   ```
   Example: "Create a modern landing page for a coffee shop called 'Brew Haven' with sections for menu, about us, and contact information"
   ```
4. **Choose Style** (Optional): Select from 6 professional design presets
5. **Generate**: Click "Create with AI" to generate your website
6. **Preview**: View your website across different devices
7. **Make Changes**: Use the chat interface to request modifications
8. **Publish**: Share your website with a unique public URL

### Managing Projects

- **My Projects**: View all your created websites
- **Version History**: Rollback to previous versions
- **Community**: Browse publicly published websites for inspiration
- **Settings**: Manage your account and preferences

### API Usage Examples

**Create a Project**
```bash
POST /api/user/project
Content-Type: application/json

{
  "initial_prompt": "Create a portfolio website for a photographer"
}
```

**Make a Revision**
```bash
POST /api/project/revision/{projectId}
Content-Type: application/json

{
  "message": "Add a contact form to the website"
}
```

**Get User Credits**
```bash
GET /api/user/credits
Authorization: Bearer {token}
```

## 📊 API Documentation

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/user/project` | Create new website project | ✅ |
| `GET` | `/api/user/projects` | Get user's projects | ✅ |
| `GET` | `/api/user/project/:id` | Get specific project details | ✅ |
| `GET` | `/api/user/credits` | Get user's credit balance | ✅ |
| `GET` | `/api/user/publish-toggle/:id` | Toggle project publishing | ✅ |
| `POST` | `/api/user/purchase-credits` | Purchase additional credits | ✅ |
| `POST` | `/api/project/revision/:id` | Request website changes | ✅ |
| `PUT` | `/api/project/save/:id` | Save project code | ✅ |
| `GET` | `/api/project/rollback/:id/:vid` | Rollback to version | ✅ |
| `DELETE` | `/api/project/:id` | Delete project | ✅ |
| `GET` | `/api/project/preview/:id` | Get project preview | ✅ |
| `GET` | `/api/project/published` | Get all published projects | ❌ |
| `GET` | `/api/project/published/:id` | Get published project | ❌ |

## 📈 Project Status

### ✅ Completed & Working
- Core AI website generation functionality
- User authentication and session management
- Project creation, editing, and management
- Live preview system with responsive design
- Version control with rollback capability
- Publishing system for public websites
- Community gallery for inspiration
- Credit-based usage system
- Multiple professional design presets
- Conversation history tracking
- Modern, responsive UI/UX

### 🚧 In Development
- **Credit Purchase System**: Payment integration for buying credits
- **Advanced Customization**: Granular control over design elements
- **SEO Tools**: Automatic optimization features
- **Analytics Dashboard**: Website performance tracking

### 🎯 Known Limitations
- Credit purchase functionality is placeholder ("coming soon")
- Limited error handling for edge cases in AI generation
- No template library (currently generates from scratch)
- Basic SEO features (meta tags only)
- No analytics integration yet
- Single language support (English only)

## 🤝 Contributing

We welcome contributions to SiteForge AI! Here's how you can help:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the installation steps above
4. Make your changes with proper TypeScript types
5. Test thoroughly across different scenarios
6. Commit with clear messages: `git commit -m 'Add amazing feature'`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Guidelines
- **Code Quality**: Use TypeScript strictly, follow ESLint rules
- **Testing**: Test AI generation with various prompts
- **Documentation**: Update README for new features
- **Commits**: Write clear, descriptive commit messages
- **PRs**: Provide detailed descriptions of changes
- **Security**: Never commit API keys or sensitive data

### Areas for Contribution
- **AI Prompt Engineering**: Improve website generation quality
- **UI/UX Enhancements**: Better user interface and experience
- **Performance Optimization**: Faster loading and generation
- **Testing Suite**: Unit and integration tests
- **Documentation**: API docs, user guides, tutorials
- **Internationalization**: Multi-language support

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

**Built with ❤️ using modern web technologies and AI**

*Empowering everyone to create beautiful websites with the power of artificial intelligence*
