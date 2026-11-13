
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    // Read Gemini API key from environment
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key is missing. Check your .env.local file." },
        { status: 500 }
      );
    }

    // Read user input
    const body = await request.json();

    const text =
      typeof body.text === "string" ? body.text.trim() : "";

    const length = body.length || "medium";

    // Validate input
    if (!text) {
      return Response.json(
        { error: "Please enter some text to summarize." },
        { status: 400 }
      );
    }

    if (text.length > 20000) {
      return Response.json(
        { error: "Text must be less than 20,000 characters." },
        { status: 400 }
      );
    }

    // Summary length instructions
    const lengthInstructions: Record<string, string> = {
      short: "Write a very short summary in 2-3 sentences.",
      medium: "Write a clear summary in one short paragraph.",
      detailed: "Write a detailed summary with all important points."
    };

    const instruction =
      lengthInstructions[length] || lengthInstructions.medium;

    // Initialize Gemini
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    // Generate summary using the correct model
    const result = await ai.models.generateContentStream({
      model: "gemini-3.5-flash-lite",
      contents: `Summarize the following text.

${instruction}

Use simple and clear English.

TEXT:
${text}`
    });

    // Stream the summary to the frontend
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          for await (const chunk of result) {
            if (chunk.text) {
              controller.enqueue(
                encoder.encode(chunk.text)
              );
            }
          }

          controller.close();

        } catch (error) {
          console.error("Gemini streaming error:", error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform"
      }
    });

  } catch (error) {
    console.error("Gemini API error:", error);

    return Response.json(
      {
        error: "Unable to generate summary. Please try again."
      },
      { status: 500 }
    );
  }
}
