import { groq } from "@ai-sdk/groq";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { topic, courseTitle } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      console.error(
        "GROQ_API_KEY is not configured. AI generation will not work.",
      );
      return Response.json(
        {
          error:
            "GROQ_API_KEY is not configured. Please add your GROQ API key in the Secrets tab.",
        },
        { status: 500 },
      );
    }

    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);

    try {
      const result = await generateText({
        model: groq("llama-3.1-8b-instant"),
        prompt: `Create comprehensive educational content about "${topic}" for the course "${courseTitle}".

IMPORTANT: Generate UNIQUE and ORIGINAL content. Do NOT repeat the same explanations. Use variety in examples and explanations.

Format your response using this EXACT structure with these markers:

##TITLE## [Create a unique, engaging title specific to ${topic} - NOT just the topic name]

##INTRO##
Write a unique introduction paragraph (3-4 sentences) explaining what ${topic} is and why it matters in ${courseTitle}. Make it engaging and specific.

##SECTION## Understanding the Core Concepts
##PARAGRAPH##
Write a detailed paragraph explaining the fundamental concepts. Use **bold** for important terms.

##POINTS##
- **Key Point 1**: Explanation of the first important concept
- **Key Point 2**: Explanation of the second important concept  
- **Key Point 3**: Explanation of the third important concept
- **Key Point 4**: Explanation of the fourth important concept

##SECTION## Practical Implementation
##PARAGRAPH##
Explain how this concept is applied in practice with **highlighted** important terms.

##CODE##
\`\`\`javascript
// Provide a relevant, practical code example
// The code should demonstrate ${topic} concepts
// Include helpful comments
const example = "practical demonstration";
console.log(example);
\`\`\`

##SECTION## Syntax and Usage
##PARAGRAPH##
Explain the syntax rules and common usage patterns with **important keywords** highlighted.

##CODE##
\`\`\`javascript
// Show another code example with different syntax
// This demonstrates a variation or advanced usage
function demonstration() {
  return "example code for ${topic}";
}
\`\`\`

##SECTION## Best Practices
##POINTS##
- **Practice 1**: First best practice tip
- **Practice 2**: Second best practice tip
- **Practice 3**: Third best practice tip

##SECTION## Common Pitfalls to Avoid
##POINTS##
- **Mistake 1**: Common error and how to avoid it
- **Mistake 2**: Another frequent issue with solution

##SUMMARY##
Provide a concise summary (2-3 sentences) of the key takeaways about ${topic}.

RULES:
1. Use **double asterisks** around important keywords and terms
2. Include practical, runnable code examples relevant to ${topic}
3. Make each section unique with specific, valuable content
4. Keep bullet points concise but informative
5. Ensure all content is educational and accurate
6. Use the exact markers: ##TITLE##, ##INTRO##, ##SECTION##, ##PARAGRAPH##, ##POINTS##, ##CODE##, ##SUMMARY##

Generate content now for: ${topic} in ${courseTitle}
Unique session: ${uniqueId}`,
        temperature: 0.9,
        maxTokens: 1500,
      });

      return Response.json({ content: result.text });
    } catch (groqError: any) {
      console.error(
        "Error calling Groq API for content generation:",
        groqError,
      );

      const fallbackContent = `##TITLE## Understanding ${topic}: A Complete Guide

##INTRO##
Welcome to this comprehensive guide on ${topic}! This is a crucial concept in ${courseTitle} that forms the foundation for building robust applications. Understanding ${topic} will help you write cleaner, more efficient code.

##SECTION## Core Fundamentals
##PARAGRAPH##
${topic} represents one of the **fundamental building blocks** in modern development. It provides the structure and logic needed to create **scalable solutions**. By mastering these concepts, you'll be able to tackle more complex challenges with confidence.

##POINTS##
- **Foundation**: ${topic} serves as the base for advanced concepts
- **Modularity**: Helps organize code into **reusable components**
- **Efficiency**: Improves **performance** and maintainability
- **Best Practices**: Follows industry **standard patterns**

##SECTION## Practical Example
##PARAGRAPH##
Let's look at how ${topic} works in practice. The following example demonstrates the **basic implementation** pattern.

##CODE##
\`\`\`javascript
// Basic example of ${topic}
const example = {
  name: "${topic}",
  course: "${courseTitle}",
  learn: function() {
    console.log("Learning " + this.name);
    return true;
  }
};

example.learn();
\`\`\`

##SECTION## Key Takeaways
##POINTS##
- Always start with the **basics** before moving to advanced topics
- Practice regularly to reinforce your **understanding**
- Apply concepts in **real projects** for better retention

##SUMMARY##
${topic} is essential for success in ${courseTitle}. Focus on understanding the core principles, practice with real examples, and gradually build your expertise.`;

      return Response.json({ content: fallbackContent });
    }
  } catch (error) {
    console.error("Unexpected error in content generation route:", error);
    return Response.json(
      { error: "An unexpected error occurred during content generation." },
      { status: 500 },
    );
  }
}
