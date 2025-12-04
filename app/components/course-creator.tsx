"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Sparkles, BookOpen, X } from "lucide-react";
import { useAuth } from "./auth-provider";

interface CourseCreatorProps {
  onCourseCreated: () => void;
}

export function CourseCreator({ onCourseCreated }: CourseCreatorProps) {
  const [prompt, setPrompt] = useState("");
  const [generatedCourse, setGeneratedCourse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth(); // isSupabaseConfigured is removed from useAuth

  const generateCourse = async () => {
    if (!prompt.trim()) {
      setError("Please enter a course prompt.");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedCourse(null);

    try {
      const response = await fetch("/api/generate-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        setError(data.error || "Failed to generate course. Please try again.");
        return;
      }

      if (data.course) {
        console.log("Generated course:", data.course);
        setGeneratedCourse(data.course);
        setError(""); // Clear any previous errors
      } else {
        throw new Error("No course data received from API");
      }
    } catch (err) {
      console.error("Error generating course:", err);
      setError(
        "Failed to generate course. Please check your internet connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async () => {
    if (!generatedCourse || !user) {
      setError(
        "Cannot save course: User not logged in or course not generated.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate saving delay

      const existingCourses = JSON.parse(
        localStorage.getItem("local-courses") || "[]",
      );
      const newCourse = {
        id: `course-${Date.now()}`, // Unique ID for local course
        title: generatedCourse.title,
        description: generatedCourse.description,
        topics: generatedCourse.topics,
        icon: generatedCourse.icon,
        progress: 0,
        completed: false,
        user_id: user.id, // Associate with the current local user
        created_at: new Date().toISOString(),
      };

      existingCourses.push(newCourse);
      localStorage.setItem("local-courses", JSON.stringify(existingCourses));

      onCourseCreated(); // Trigger course list refresh in Dashboard
      setGeneratedCourse(null);
      setPrompt("");
    } catch (err) {
      setError("Failed to save course to local storage. Please try again.");
      console.error("Error saving course:", err);
    } finally {
      setSaving(false);
    }
  };

  const editTopic = (index: number, newTopic: string) => {
    const updatedTopics = [...generatedCourse.topics];
    updatedTopics[index] = newTopic;
    setGeneratedCourse({ ...generatedCourse, topics: updatedTopics });
  };

  const removeTopic = (index: number) => {
    const updatedTopics = generatedCourse.topics.filter(
      (_: any, i: number) => i !== index,
    );
    setGeneratedCourse({ ...generatedCourse, topics: updatedTopics });
  };

  const addTopic = () => {
    setGeneratedCourse({
      ...generatedCourse,
      topics: [...generatedCourse.topics, "New Topic"],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Course</h1>
        <p className="text-muted-foreground">
          Create a course structure from your prompt
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Course Generator
          </CardTitle>
          <CardDescription>
            Describe what you want to learn and we'll create a structured course
            for you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Course Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="e.g., 'I want to learn React development from basics to advanced concepts including hooks, state management, and building real projects'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <Button
            onClick={generateCourse}
            disabled={loading || !prompt.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Course...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Course
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {loading && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {generatedCourse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{generatedCourse.icon}</span>
                <div>
                  <CardTitle>
                    <Input
                      value={generatedCourse.title}
                      onChange={(e) =>
                        setGeneratedCourse({
                          ...generatedCourse,
                          title: e.target.value,
                        })
                      }
                      className="text-lg font-semibold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                    />
                  </CardTitle>
                  <CardDescription>
                    <Textarea
                      value={generatedCourse.description}
                      onChange={(e) =>
                        setGeneratedCourse({
                          ...generatedCourse,
                          description: e.target.value,
                        })
                      }
                      className="text-sm border-none shadow-none p-0 resize-none focus-visible:ring-0"
                      rows={2}
                    />
                  </CardDescription>
                </div>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Course Topics ({generatedCourse.topics.length})
                </h3>
                <Button variant="outline" size="sm" onClick={addTopic}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topic
                </Button>
              </div>
              <div className="space-y-2">
                {generatedCourse.topics.map((topic: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 border rounded-lg"
                  >
                    <span className="text-sm font-medium text-muted-foreground w-8">
                      {index + 1}.
                    </span>
                    <Input
                      value={topic}
                      onChange={(e) => editTopic(index, e.target.value)}
                      className="flex-1 border-none shadow-none focus-visible:ring-0"
                    />
                    {generatedCourse.topics.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTopic(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={saveCourse} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving Course...
                  </>
                ) : (
                  "Save Course"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setGeneratedCourse(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Example Prompts</CardTitle>
          <CardDescription>
            Get inspired with these course ideas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Learn Python programming from basics to web development",
              "Master digital marketing including SEO, social media, and analytics",
              "Complete guide to machine learning and AI fundamentals",
              "Web design course covering HTML, CSS, JavaScript, and responsive design",
              "Photography masterclass from composition to post-processing",
              "Business strategy and entrepreneurship essentials",
            ].map((example, index) => (
              <button
                key={index}
                onClick={() => setPrompt(example)}
                className="text-left p-3 border rounded-lg hover:bg-muted transition-colors"
              >
                <p className="text-sm">{example}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
