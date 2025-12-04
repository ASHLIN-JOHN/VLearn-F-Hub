
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, BookOpen, Clock, Trophy, Target } from "lucide-react"
import { useAuth } from "./auth-provider"

interface AnalyticsData {
  totalCourses: number
  completedCourses: number
  totalTopics: number
  completedTopics: number
  studyTime: number
  certificates: number
  weeklyProgress: number[]
  topicCompletionRate: { [courseId: string]: number }
  recentActivity: Array<{
    type: 'course_completed' | 'topic_completed' | 'quiz_passed'
    title: string
    date: string
  }>
  averageQuizScore: number
  totalQuizzesTaken: number
}

export function AnalyticsModule() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadRealAnalytics()
    }
  }, [user])

  const loadRealAnalytics = () => {
    if (!user) return

    // Load real courses data
    const localCourses = JSON.parse(localStorage.getItem("local-courses") || "[]")
    const savedCourses = JSON.parse(localStorage.getItem("courses") || "[]")
    const allCourses = [...localCourses, ...savedCourses].filter((c: any) => c.user_id === user.id)

    // Load real topic progress data
    const topicProgress = JSON.parse(localStorage.getItem("topic-progress") || "{}")
    
    // Load real learning activity
    const learningActivity = JSON.parse(localStorage.getItem("learning-activity") || "[]")
      .filter((activity: any) => activity.userId === user.id)

    // Load quiz results
    const quizResults = JSON.parse(localStorage.getItem("quiz-results") || "[]")
      .filter((result: any) => result.userId === user.id)

    // Load certificates
    const certificates = JSON.parse(localStorage.getItem("certificates") || "[]")
      .filter((cert: any) => cert.userId === user.id)

    // Calculate real analytics
    const totalCourses = allCourses.length
    const completedCourses = allCourses.filter((c: any) => c.completed).length
    
    let totalTopics = 0
    let completedTopics = 0
    const topicCompletionRate: { [courseId: string]: number } = {}

    allCourses.forEach((course: any) => {
      totalTopics += course.topics.length
      const courseProgress = topicProgress[course.id] || {}
      const courseCompletedTopics = Object.values(courseProgress).filter(Boolean).length
      completedTopics += courseCompletedTopics
      topicCompletionRate[course.id] = course.topics.length > 0 ? 
        (courseCompletedTopics / course.topics.length) * 100 : 0
    })

    // Calculate real study time based on actual activity
    const studyTime = learningActivity.length * 12 // Assume 12 minutes per topic

    // Calculate quiz performance
    const totalQuizzesTaken = quizResults.length
    const averageQuizScore = totalQuizzesTaken > 0 ? 
      quizResults.reduce((sum: number, result: any) => sum + result.score, 0) / totalQuizzesTaken : 0

    // Calculate weekly progress based on actual activity
    const weeklyProgress = calculateWeeklyProgress(learningActivity)

    // Get recent activity (sorted by date)
    const recentActivity = learningActivity
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    const analyticsData: AnalyticsData = {
      totalCourses,
      completedCourses,
      totalTopics,
      completedTopics,
      studyTime,
      certificates: certificates.length,
      weeklyProgress,
      topicCompletionRate,
      recentActivity,
      averageQuizScore,
      totalQuizzesTaken
    }

    setAnalytics(analyticsData)
  }

  const calculateWeeklyProgress = (activities: any[]) => {
    const now = new Date()
    const weeklyData = []
    
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() - i)
      targetDate.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(targetDate)
      nextDay.setDate(targetDate.getDate() + 1)
      
      const dayActivities = activities.filter((activity: any) => {
        const activityDate = new Date(activity.date)
        return activityDate >= targetDate && activityDate < nextDay
      })
      
      // Calculate progress percentage based on activities (0-100)
      const progressPercent = Math.min(dayActivities.length * 20, 100)
      weeklyData.push(progressPercent)
    }
    
    return weeklyData
  }

  if (!analytics) {
    return <div>Loading analytics...</div>
  }

  const completionRate = analytics.totalCourses > 0 ? 
    (analytics.completedCourses / analytics.totalCourses) * 100 : 0
  
  const topicCompletionRate = analytics.totalTopics > 0 ? 
    (analytics.completedTopics / analytics.totalTopics) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Analytics</h1>
        <p className="text-muted-foreground">Track your real progress and learning insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedCourses}/{analytics.totalCourses}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={completionRate} className="flex-1" />
              <span className="text-sm font-medium">{Math.round(completionRate)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics Mastered</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedTopics}/{analytics.totalTopics}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={topicCompletionRate} className="flex-1" />
              <span className="text-sm font-medium">{Math.round(topicCompletionRate)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(analytics.studyTime / 60)}h {analytics.studyTime % 60}m</div>
            <p className="text-xs text-muted-foreground">Real learning time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.certificates}</div>
            <p className="text-xs text-muted-foreground">Earned certificates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Weekly Progress
            </CardTitle>
            <CardDescription>Your real learning activity over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.weeklyProgress.map((progress, index) => {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const today = new Date()
                const dayOfWeek = (today.getDay() - 6 + index) % 7
                const dayName = dayNames[dayOfWeek < 0 ? dayOfWeek + 7 : dayOfWeek]
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-12">{dayName}</span>
                    <Progress value={progress} className="flex-1" />
                    <span className="text-sm font-medium w-12">{progress}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quiz Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Performance</CardTitle>
            <CardDescription>Your quiz results and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quizzes Taken</span>
                <Badge variant="outline">{analytics.totalQuizzesTaken}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Score</span>
                  <span className="text-sm font-bold">{Math.round(analytics.averageQuizScore)}%</span>
                </div>
                <Progress value={analytics.averageQuizScore} />
              </div>
              {analytics.totalQuizzesTaken === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No quizzes taken yet. Complete some courses to take quizzes!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Course Progress Breakdown</CardTitle>
          <CardDescription>Topic completion by course</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(analytics.topicCompletionRate).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No courses created yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(analytics.topicCompletionRate).map(([courseId, rate]) => {
                const course = [...JSON.parse(localStorage.getItem("local-courses") || "[]"), 
                              ...JSON.parse(localStorage.getItem("courses") || "[]")]
                              .find((c: any) => c.id === courseId)
                if (!course) return null
                
                return (
                  <div key={courseId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <span>{course.icon}</span>
                        {course.title}
                      </span>
                      <Badge variant={rate === 100 ? "default" : "secondary"}>
                        {Math.round(rate)}%
                      </Badge>
                    </div>
                    <Progress value={rate} />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest learning achievements</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No activity yet. Start learning to see your progress here!
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {activity.type === 'course_completed' && <BookOpen className="h-4 w-4" />}
                    {activity.type === 'topic_completed' && <Target className="h-4 w-4" />}
                    {activity.type === 'quiz_passed' && <Trophy className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.type.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(activity.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
