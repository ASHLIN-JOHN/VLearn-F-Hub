import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    let prompt: string;

    try {
      const body = await req.json();
      prompt = body.prompt;
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 },
      );
    }

    if (!process.env.GROQ_API_KEY) {
      console.error(
        "GROQ_API_KEY is not configured. AI generation will not work.",
      );
      const fallbackCourse = {
        title: `Custom Learning Course: ${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}`,
        description:
          "GROQ_API_KEY is not configured. Please ensure your API key is set.",
        topics: ["API Key Missing", "Check Configuration", "Try Again"],
        icon: "⚠️",
      };
      return Response.json({ course: fallbackCourse });
    }

    let text: string;
    try {
      const result = await generateText({
        model: groq("llama-3.1-8b-instant"),
        prompt: `Create a comprehensive learning course based on this prompt: "${prompt}"

You must respond with a valid JSON object that has this exact structure:
{
  "title": "Course Title Here",
  "description": "Course description here (2-3 sentences explaining what students will learn)",
  "topics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5", "Topic 6"],
  "icon": "📚"
}

Requirements:
- Create 5-7 specific learning topics/modules
- Topics should be logically ordered from basic to advanced
- Each topic should be concise (2-5 words)
- Choose an appropriate emoji icon for the course subject
- Make the course title engaging and descriptive
- Write a compelling description that explains the learning outcomes

Course subject: ${prompt}

Respond ONLY with the JSON object, no other text.`,
        temperature: 0.7,
        maxTokens: 512,
        topP: 0.9,
      });
      text = result.text;
    } catch (groqError: any) {
      console.error("Error calling Groq API for course generation:", groqError);
      const fallbackCourse = {
        title: `Course: ${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}`,
        description: `A comprehensive course covering ${prompt}. This fallback course was created due to API issues.`,
        topics: [
          "Introduction & Basics",
          "Core Concepts",
          "Practical Applications",
          "Advanced Topics",
          "Real-world Projects",
          "Best Practices",
        ],
        icon: "📚",
      };
      return Response.json({ course: fallbackCourse });
    }

    // Clean and parse the AI response
    let cleanText = text.trim();

    // Remove any markdown code block markers
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Find JSON object boundaries
    const jsonStart = cleanText.indexOf("{");
    const jsonEnd = cleanText.lastIndexOf("}");

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }

    let courseData;
    try {
      courseData = JSON.parse(cleanText);

      // Validate the structure
      if (
        !courseData.title ||
        !courseData.description ||
        !Array.isArray(courseData.topics) ||
        !courseData.icon
      ) {
        throw new Error("Invalid course structure");
      }

      // Ensure we have at least some topics
      if (courseData.topics.length === 0) {
        courseData.topics = [
          "Introduction",
          "Core Concepts",
          "Applications",
          "Advanced Topics",
          "Summary",
        ];
      }
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError, "Raw text:", text);

      // Create a well-structured fallback course
      courseData = {
        title: `${prompt.charAt(0).toUpperCase() + prompt.slice(1)} Mastery Course`,
        description: `A comprehensive course designed to teach you everything about ${prompt}. From fundamentals to advanced concepts, you'll gain practical skills and knowledge.`,
        topics: [
          "Introduction & Overview",
          "Fundamental Concepts",
          "Core Principles",
          "Practical Applications",
          "Advanced Techniques",
          "Real-world Projects",
        ],
        icon: getIconForTopic(prompt),
      };
    }

    return Response.json({ course: courseData });
  } catch (error) {
    console.error("Unexpected error in course generation route:", error);

    let prompt = "Unknown Topic";
    try {
      const body = await req.json();
      prompt = body.prompt || "Unknown Topic";
    } catch (e) {
      // Use default prompt if parsing fails
    }

    const fallbackCourse = {
      title: `Learning Course: ${prompt}`,
      description: `An educational course covering ${prompt}. This course was created with a fallback structure due to technical issues.`,
      topics: [
        "Getting Started",
        "Basic Concepts",
        "Core Skills",
        "Practical Exercises",
        "Advanced Topics",
        "Final Project",
      ],
      icon: "🎓",
    };

    return Response.json({ course: fallbackCourse });
  }
}

// Helper function to suggest appropriate icons based on course topic
function getIconForTopic(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (
    lower.includes("programming") ||
    lower.includes("code") ||
    lower.includes("development")
  )
    return "💻";
  if (lower.includes("design") || lower.includes("art")) return "🎨";
  if (lower.includes("business") || lower.includes("management")) return "💼";
  if (
    lower.includes("science") ||
    lower.includes("physics") ||
    lower.includes("chemistry")
  )
    return "🔬";
  if (lower.includes("math") || lower.includes("mathematics")) return "📐";
  if (
    lower.includes("language") ||
    lower.includes("english") ||
    lower.includes("writing")
  )
    return "📝";
  if (lower.includes("music") || lower.includes("audio")) return "🎵";
  if (lower.includes("health") || lower.includes("fitness")) return "⚕️";
  if (lower.includes("cooking") || lower.includes("food")) return "👨‍🍳";
  if (lower.includes("photography") || lower.includes("video")) return "📸";

  return "📚"; // Default icon
}
