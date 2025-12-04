"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, XCircle, Brain, Trophy } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  topics: string[]
  progress: number
  completed: boolean
  icon: string
  user_id: string
  created_at: string
}

interface Question {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface QuizModuleProps {
  course: Course
}

export function QuizModule({ course }: QuizModuleProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  const generateQuiz = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseTitle: course.title,
          topics: course.topics,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate quiz")
      }

      const data = await response.json()
      setQuestions(data.questions)
    } catch (err) {
      console.error("Error generating quiz:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generateQuiz()
  }, [course])

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return

    const newAnswers = [...answers, selectedAnswer]
    setAnswers(newAnswers)

    if (selectedAnswer === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1)
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizCompleted(true)
    }
  }

  const handleShowResult = () => {
    setShowResult(true)
  }

  const restartQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnswers([])
    setQuizCompleted(false)
    generateQuiz()
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 70

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {passed ? <Trophy className="h-16 w-16 text-yellow-500" /> : <Brain className="h-16 w-16 text-blue-500" />}
          </div>
          <CardTitle className="text-2xl">{passed ? "Congratulations!" : "Keep Learning!"}</CardTitle>
          <CardDescription>
            You scored {score} out of {questions.length} questions ({percentage}%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Progress value={percentage} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              {passed
                ? "Great job! You've mastered this topic."
                : "You need 70% to pass. Review the material and try again."}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Quiz Review:</h3>
            {questions.map((question, index) => {
              const userAnswer = answers[index]
              const isCorrect = userAnswer === question.correctAnswer

              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{question.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">Your answer: {question.options[userAnswer]}</p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600 mt-1">
                          Correct answer: {question.options[question.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={restartQuiz} variant="outline">
              Retake Quiz
            </Button>
            {passed && (
              <Button onClick={() => {
                // Mark course as completed when quiz is passed
                if (typeof window !== 'undefined') {
                  // Update both local courses and the stored courses
                  const localCourses = localStorage.getItem('local-courses') || '[]'
                  const localCoursesData = JSON.parse(localCourses)
                  
                  // Update the course in local storage
                  const updatedLocalCourses = localCoursesData.map((c: any) => 
                    c.id === course.id ? { ...c, completed: true, progress: 100 } : c
                  )
                  localStorage.setItem('local-courses', JSON.stringify(updatedLocalCourses))
                  
                  // Also check if course exists in regular courses storage
                  const savedCourses = localStorage.getItem('courses')
                  if (savedCourses) {
                    const courses = JSON.parse(savedCourses)
                    const updatedCourses = courses.map((c: any) => 
                      c.id === course.id ? { ...c, completed: true, progress: 100 } : c
                    )
                    localStorage.setItem('courses', JSON.stringify(updatedCourses))
                  }

                  // Track course completion in analytics
                  const activity = {
                    userId: course.user_id,
                    type: "course_completed",
                    title: `Completed Course: ${course.title}`,
                    courseId: course.id,
                    date: new Date().toISOString()
                  }
                  const learningActivity = JSON.parse(localStorage.getItem("learning-activity") || "[]")
                  learningActivity.push(activity)
                  localStorage.setItem("learning-activity", JSON.stringify(learningActivity))
                  
                  // Reload the page to update the UI
                  window.location.reload()
                }
              }}>
                Complete Course & Get Certificate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>No questions available. Please try again.</p>
          <Button onClick={generateQuiz} className="mt-4">
            Generate Quiz
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardTitle>
              <CardDescription>{course.title} Quiz</CardDescription>
            </div>
            <Badge variant="outline">
              Score: {score}/{currentQuestionIndex}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full p-4 text-left border rounded-lg transition-colors ${
                  selectedAnswer === index
                    ? showResult
                      ? index === currentQuestion.correctAnswer
                        ? "bg-green-100 border-green-500 text-green-800"
                        : "bg-red-100 border-red-500 text-red-800"
                      : "bg-primary text-primary-foreground border-primary"
                    : showResult && index === currentQuestion.correctAnswer
                      ? "bg-green-100 border-green-500 text-green-800"
                      : "hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                  {showResult && index === currentQuestion.correctAnswer && (
                    <CheckCircle className="ml-auto h-5 w-5 text-green-600" />
                  )}
                  {showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                    <XCircle className="ml-auto h-5 w-5 text-red-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {showResult && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Explanation:</h4>
              <p className="text-sm">{currentQuestion.explanation}</p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <div></div>
            {!showResult ? (
              <Button onClick={handleShowResult} disabled={selectedAnswer === null}>
                Check Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {currentQuestionIndex === questions.length - 1 ? "Finish Quiz" : "Next Question"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
