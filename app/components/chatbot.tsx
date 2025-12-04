
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, BookOpen, FileText, Trophy, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  topics: string[];
  completed: boolean;
  icon: string;
  user_id: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  actions?: {
    type: 'open_course' | 'open_tab';
    courseId?: string;
    tab?: string;
    label: string;
  }[];
}

interface ChatbotProps {
  courses: Course[];
  onOpenCourse: (course: Course, tab?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export function Chatbot({ courses, onOpenCourse, onNavigateTab }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(
        "Hi! I'm your VLearn assistant. I can help you:\n\n• Open your courses\n• Navigate to different sections\n• Show course progress\n• Access quizzes and certificates\n\nTry asking: 'Show my courses' or 'Open JavaScript course'"
      );
    }
  }, [isOpen]);

  const addBotMessage = (content: string, actions?: ChatMessage['actions']) => {
    const message: ChatMessage = {
      id: `bot-${Date.now()}`,
      content,
      isBot: true,
      timestamp: new Date(),
      actions
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: `user-${Date.now()}`,
      content,
      isBot: false,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const processUserInput = (input: string) => {
    const lowerInput = input.toLowerCase();
    
    // Show courses or search courses
    if ((lowerInput.includes('show') && (lowerInput.includes('course') || lowerInput.includes('my'))) || 
        lowerInput.includes('list courses') || lowerInput.includes('my courses')) {
      if (courses.length === 0) {
        addBotMessage("You don't have any courses yet. Would you like me to help you create one?", [
          { type: 'open_tab', tab: 'create-course', label: 'Create Course' }
        ]);
      } else {
        const courseActions = courses.map(course => ({
          type: 'open_course' as const,
          courseId: course.id,
          label: `Open ${course.title}`
        }));
        
        const courseList = courses.map(course => 
          `• ${course.icon} ${course.title} (${course.progress}% complete)`
        ).join('\n');
        
        addBotMessage(`Here are your courses:\n\n${courseList}\n\nClick below to open any course:`, courseActions);
      }
      return;
    }

    // Search courses by keyword
    if (lowerInput.includes('search') || lowerInput.includes('find course')) {
      const searchTerm = lowerInput.replace(/search|find course|course/g, '').trim();
      if (searchTerm) {
        const matchingCourses = courses.filter(course => 
          course.title.toLowerCase().includes(searchTerm) ||
          course.description.toLowerCase().includes(searchTerm) ||
          course.topics.some(topic => topic.toLowerCase().includes(searchTerm))
        );

        if (matchingCourses.length > 0) {
          const courseActions = matchingCourses.map(course => ({
            type: 'open_course' as const,
            courseId: course.id,
            label: `Open ${course.title}`
          }));
          
          const courseList = matchingCourses.map(course => 
            `• ${course.icon} ${course.title} (${course.progress}% complete)`
          ).join('\n');
          
          addBotMessage(`Found ${matchingCourses.length} course(s) matching "${searchTerm}":\n\n${courseList}`, courseActions);
        } else {
          addBotMessage(`No courses found matching "${searchTerm}". Try searching with different keywords or create a new course!`, [
            { type: 'open_tab', tab: 'create-course', label: 'Create Course' }
          ]);
        }
      } else {
        addBotMessage("What would you like to search for? Try: 'search javascript' or 'find course react'");
      }
      return;
    }

    // Open specific course with improved matching
    const courseMatch = courses.find(course => {
      const cleanInput = lowerInput.replace(/open|start|course/g, '').trim();
      return course.title.toLowerCase().includes(cleanInput) ||
             cleanInput.includes(course.title.toLowerCase()) ||
             course.topics.some(topic => topic.toLowerCase().includes(cleanInput)) ||
             cleanInput.includes(course.title.toLowerCase().split(' ')[0]); // Match first word
    });
    
    if (courseMatch && (lowerInput.includes('open') || lowerInput.includes('start') || lowerInput.includes('course'))) {
      const actions = [
        { type: 'open_course' as const, courseId: courseMatch.id, tab: 'learn', label: 'Learn' },
        { type: 'open_course' as const, courseId: courseMatch.id, tab: 'quiz', label: 'Take Quiz' }
      ];
      
      if (courseMatch.completed) {
        actions.push({ type: 'open_course' as const, courseId: courseMatch.id, tab: 'certificate', label: 'View Certificate' });
      }
      
      addBotMessage(
        `Opening ${courseMatch.title}! ${courseMatch.icon}\n\nProgress: ${courseMatch.progress}%\n${courseMatch.description}\n\nWhat would you like to do?`,
        actions
      );
      return;
    }

    // Navigation commands
    if (lowerInput.includes('dashboard') || lowerInput.includes('home')) {
      addBotMessage("Taking you to the dashboard!", [
        { type: 'open_tab', tab: 'dashboard', label: 'Go to Dashboard' }
      ]);
      return;
    }

    if (lowerInput.includes('create') && lowerInput.includes('course')) {
      addBotMessage("Let's create a new course!", [
        { type: 'open_tab', tab: 'create-course', label: 'Create Course' }
      ]);
      return;
    }

    if (lowerInput.includes('notes')) {
      addBotMessage("Opening your notes section!", [
        { type: 'open_tab', tab: 'notes', label: 'View Notes' }
      ]);
      return;
    }

    if (lowerInput.includes('profile')) {
      addBotMessage("Opening your profile!", [
        { type: 'open_tab', tab: 'profile', label: 'View Profile' }
      ]);
      return;
    }

    if (lowerInput.includes('certificate')) {
      const completedCourses = courses.filter(c => c.completed);
      if (completedCourses.length === 0) {
        addBotMessage("You haven't earned any certificates yet. Complete a course to earn your first certificate!");
      } else {
        addBotMessage("Opening your certificates section!", [
          { type: 'open_tab', tab: 'certificates', label: 'View Certificates' }
        ]);
      }
      return;
    }

    if (lowerInput.includes('analytics') || lowerInput.includes('progress') || lowerInput.includes('stats')) {
      addBotMessage("Opening your learning analytics!", [
        { type: 'open_tab', tab: 'analytics', label: 'View Analytics' }
      ]);
      return;
    }

    // Quiz related
    if (lowerInput.includes('quiz') || lowerInput.includes('test')) {
      if (courses.length === 0) {
        addBotMessage("You need to create a course first to take quizzes!");
      } else {
        const quizActions = courses.map(course => ({
          type: 'open_course' as const,
          courseId: course.id,
          tab: 'quiz',
          label: `Quiz: ${course.title}`
        }));
        addBotMessage("Which course quiz would you like to take?", quizActions);
      }
      return;
    }

    // Help
    if (lowerInput.includes('help') || lowerInput.includes('what can you do') || lowerInput.includes('commands')) {
      addBotMessage(
        "I can help you with:\n\n📚 Course Management:\n• 'Show my courses' - Display all courses\n• 'Search [keyword]' - Find courses by topic\n• 'Open [course name]' - Open specific course\n• 'Create course' - Start new course\n\n🎯 Navigation:\n• 'Dashboard' - Go to main dashboard\n• 'Notes' - Access your notes\n• 'Profile' - View your profile\n• 'Certificates' - See earned certificates\n• 'Analytics' - View learning progress\n\n🧪 Learning:\n• 'Quiz' - Take course quizzes\n• 'Progress' - Check your progress\n\nJust type naturally what you want to do!"
      );
      return;
    }

    // Default response with suggestions
    const suggestions = [
      "Show my courses",
      "Search javascript", 
      "Open course",
      "Create course",
      "Dashboard",
      "Help"
    ];
    
    addBotMessage(
      "I'm not sure how to help with that. Here are some things you can try:\n\n" + 
      suggestions.map(s => `• "${s}"`).join('\n') + 
      "\n\nOr just type 'help' to see all available commands!"
    );
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    addUserMessage(inputValue);
    processUserInput(inputValue);
    setInputValue("");
  };

  const handleAction = (action: ChatMessage['actions'][0]) => {
    if (action.type === 'open_course' && action.courseId) {
      const course = courses.find(c => c.id === action.courseId);
      if (course) {
        onOpenCourse(course, action.tab);
        setIsOpen(false);
      }
    } else if (action.type === 'open_tab' && action.tab) {
      onNavigateTab(action.tab);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-lg z-50 flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            VLearn Assistant
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction(action)}
                          className="text-xs"
                        >
                          {action.type === 'open_course' && <BookOpen className="h-3 w-3 mr-1" />}
                          {action.type === 'open_tab' && action.tab === 'notes' && <FileText className="h-3 w-3 mr-1" />}
                          {action.type === 'open_tab' && action.tab === 'certificates' && <Trophy className="h-3 w-3 mr-1" />}
                          {action.type === 'open_tab' && action.tab === 'analytics' && <BarChart3 className="h-3 w-3 mr-1" />}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Try: 'search react' or 'show courses'..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon" disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
