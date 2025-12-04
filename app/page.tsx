"use client"
import { BookOpen, Trophy, Users, BarChart3, Home, Settings } from "lucide-react"
import { AuthProvider, useAuth } from "./components/auth-provider"
import { AuthForm } from "./components/auth-form"
import { Dashboard } from "./components/dashboard"

const courses = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    description: "Learn the basics of JavaScript programming",
    progress: 75,
    topics: ["Variables", "Functions", "Objects", "Arrays", "DOM Manipulation"],
    completed: false,
    icon: "💻",
  },
  {
    id: 2,
    title: "React Development",
    description: "Build modern web applications with React",
    progress: 45,
    topics: ["Components", "Props", "State", "Hooks", "Context API"],
    completed: false,
    icon: "⚛️",
  },
  {
    id: 3,
    title: "Data Structures",
    description: "Understanding fundamental data structures",
    progress: 100,
    topics: ["Arrays", "Linked Lists", "Stacks", "Queues", "Trees"],
    completed: true,
    icon: "🏗️",
  },
  {
    id: 4,
    title: "Machine Learning Basics",
    description: "Introduction to machine learning concepts",
    progress: 20,
    topics: ["Supervised Learning", "Unsupervised Learning", "Neural Networks", "Deep Learning", "Model Evaluation"],
    completed: false,
    icon: "🤖",
  },
]

const sidebarItems = [
  { title: "Dashboard", icon: Home, id: "dashboard" },
  { title: "My Courses", icon: BookOpen, id: "courses" },
  { title: "Certificates", icon: Trophy, id: "certificates" },
  { title: "Analytics", icon: BarChart3, id: "analytics" },
  { title: "Community", icon: Users, id: "community" },
  { title: "Settings", icon: Settings, id: "settings" },
]

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
