# VLearn - AI-Powered Learning Platform

## Overview

VLearn is an AI-powered learning platform built with Next.js that enables users to create custom courses, take quizzes, earn certificates, and collaborate with friends. The platform leverages Groq's AI models for content generation and Firebase for backend services including authentication, real-time messaging, and data storage.

The application features a comprehensive dashboard with multiple modules for course management, analytics tracking, social features, and personalized learning experiences. Built with modern React patterns and shadcn/ui components, it provides a polished, responsive interface for interactive learning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Rendering**
- Next.js 14 with App Router (React Server Components)
- Client-side rendering for interactive components ("use client" directive)
- TypeScript for type safety across the application
- Geist font family for consistent typography

**Component Library**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with CSS variables for theming
- Custom component variants using class-variance-authority
- Comprehensive UI component system including forms, dialogs, cards, navigation menus

**State Management**
- React Context API for authentication state (AuthContext)
- Local component state with useState/useEffect hooks
- localStorage for client-side data persistence (courses, notes, settings)
- Real-time listeners for Firestore data synchronization

**Key Features & Modules**
- **Course Creator**: AI-powered course generation with topic breakdown
- **Learning Module**: AI-generated educational content with structured formatting, including:
  - Unique titles and section headers
  - Code blocks with syntax highlighting and copy-to-clipboard functionality
  - Highlighted important keywords
  - Bullet points and proper text alignment
  - Introduction and summary sections with special styling
- **ContentRenderer Component**: Parses and renders structured content with:
  - Code syntax highlighting for JavaScript/TypeScript
  - Line numbers in code blocks
  - Copy button for code snippets
  - Bold keyword highlighting with special styling
  - Proper visual hierarchy for sections, paragraphs, and lists
- **Quiz Module**: Dynamic quiz generation and scoring system
- **Certificate Module**: Printable/downloadable certificates for completed courses
- **Messenger Module**: Real-time chat with friends and study groups
- **Notes Module**: Personal note-taking with search functionality
- **Analytics Module**: Progress tracking and learning statistics
- **Profile Module**: User profile management and customization
- **Settings Module**: Application preferences and data management
- **Chatbot**: Conversational AI assistant for navigation and course recommendations

### Backend Architecture

**Authentication**
- Firebase Authentication with email/password sign-in
- User session management via onAuthStateChanged
- User profile data stored in Firestore with extended metadata
- Custom User interface extending Firebase user data

**Database Design**
- Firestore for NoSQL document storage
- Collections: users, messages, conversations, notes
- Real-time subscriptions using onSnapshot listeners
- Hybrid storage: Firestore for shared data, localStorage for local-only data
- Course data stored both locally (localStorage) and in Firestore for persistence

**Data Models**
- **User**: id, email, name, avatar_url, profile (bio, joinDate, coursesCompleted, certificates, friends, skillLevel, preferredSubjects)
- **Course**: id, title, description, topics[], progress, completed, icon, user_id, created_at
- **Message**: message content, sender info, timestamp, conversation_id
- **Note**: id, title, content, created_at, updated_at, user_id

**AI Content Generation**
- Groq AI SDK for text generation (llama-3.1-8b-instant model)
- API routes for course generation (/api/generate-course)
- API routes for educational content (/api/generate-content)
- API routes for quiz generation (/api/generate-quiz)
- Structured prompt engineering for consistent output formatting

### External Dependencies

**AI Services**
- **Groq AI**: Large language model API for content generation
  - Used for: Course creation, learning content, quiz questions
  - Model: llama-3.1-8b-instant
  - Requires: GROQ_API_KEY environment variable

**Firebase Services**
- **Firebase Authentication**: User sign-up, sign-in, session management
- **Firestore Database**: Real-time NoSQL database for user data, messages, notes
- **Firebase Storage**: File storage (configured but not actively used in current implementation)
- **Configuration**: Credentials stored in lib/firebase.ts

**UI & Styling**
- **Radix UI**: Unstyled, accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **next-themes**: Theme management system
- **date-fns**: Date formatting utilities
- **embla-carousel-react**: Carousel component
- **vaul**: Drawer component library
- **sonner**: Toast notification system

**Form & Validation**
- **react-hook-form**: Form state management
- **@hookform/resolvers**: Validation resolvers
- **zod**: Schema validation (implied by resolver usage)

**Development Tools**
- **v0.dev**: Visual development platform (deployment source)
- **Vercel**: Hosting and deployment platform
- **TypeScript**: Static type checking
- **ESLint**: Code linting

**Key Architectural Decisions**

1. **Hybrid Data Storage**: Courses and user preferences stored in both localStorage and Firestore to balance offline capability with cloud persistence
2. **AI-First Content**: All educational content dynamically generated via Groq AI rather than pre-written content
3. **Modular Component Design**: Each major feature (courses, quizzes, notes, etc.) isolated in separate component modules
4. **Real-time Collaboration**: Firestore real-time listeners enable live messaging and data sync
5. **Progressive Enhancement**: Core functionality works with localStorage fallback when Firebase unavailable