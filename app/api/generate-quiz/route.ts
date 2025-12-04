import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { courseTitle, topics } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      console.error(
        "GROQ_API_KEY is not configured. AI generation will not work.",
      );
      const fallbackQuiz = {
        questions: [
          {
            question: "GROQ_API_KEY is not configured. Using fallback quiz.",
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: "Please ensure your API key is set.",
          },
        ],
      };
      return Response.json(fallbackQuiz);
    }

    let text: string;
    try {
      const result = await generateText({
        model: groq("llama-3.1-8b-instant"),
        prompt: `Create a quiz for the course "${courseTitle}" covering these topics: ${topics.join(", ")}.

Generate exactly 5 multiple-choice questions. For each question, provide:
1. A clear question
2. 4 answer options (A, B, C, D)
3. The correct answer (as a number 0-3)
4. A brief explanation of why the answer is correct

Format the response as a JSON object with this structure:
{
  "questions": [
    {
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of the correct answer"
    }
  ]
}

Make sure the questions test understanding of key concepts from the topics: ${topics.join(", ")}.
Questions should be challenging but fair, testing both knowledge and application.`,
        temperature: 1,
        maxTokens: 1024, // Corresponds to max_completion_tokens
        topP: 1,
      });
      text = result.text;
    } catch (groqError: any) {
      console.error("Error calling Groq API for quiz generation:", groqError);
      const fallbackQuiz = {
        questions: [
          {
            question: `Groq API call failed for quiz generation: ${groqError.message || "Unknown error"}. Using fallback quiz.`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: 0,
            explanation: `Error: ${groqError.message || "Unknown error"}. Please check your API key and Groq status.`,
          },
        ],
      };
      return Response.json(fallbackQuiz);
    }

    // Clean the response text to extract valid JSON
    let cleanText = text.trim();

    // Remove code block markers if present
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    }
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Try to find JSON object in the response
    const jsonStart = cleanText.indexOf("{");
    const jsonEnd = cleanText.lastIndexOf("}");

    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
    }

    const quizData = JSON.parse(cleanText);

    return Response.json(quizData);
  } catch (error) {
    console.error("Unexpected error in quiz generation route:", error);
    const fallbackQuiz = {
      questions: [
        {
          question:
            "An unexpected error occurred during quiz generation. Using fallback quiz.",
          options: [
            "To learn basic concepts",
            "To master advanced techniques",
            "To understand practical applications",
            "All of the above",
          ],
          correctAnswer: 3,
          explanation:
            "This course covers basic concepts, advanced techniques, and practical applications.",
        },
      ],
    };

    return Response.json(fallbackQuiz);
  }
}
