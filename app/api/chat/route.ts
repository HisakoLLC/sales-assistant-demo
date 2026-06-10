import { GoogleGenerativeAI } from "@google/generative-ai";
import { SYSTEM_PROMPT } from "@/lib/systemPrompt";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  retries = 3, 
  delayMs = 300
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) {
      throw error;
    }
    console.warn(`Action failed, retrying in ${delayMs}ms... (${retries - 1} retries left). Error:`, error);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return retryWithBackoff(fn, retries - 1, delayMs * 1.5);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const messageCount = parseInt(req.headers.get("X-Message-Count") || "0", 10);
    if (messageCount > 30) {
      return NextResponse.json({ error: "Session limit reached. Please refresh to start a new conversation." }, { status: 429 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const primaryModelName = "gemini-3.5-flash";
    const fallbackModelName = "gemini-1.5-flash";

    // Format history for Gemini (excluding the last message which will be sent)
    let history = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Gemini API strict requirement: History must start with a 'user' role
    if (history.length > 0 && history[0].role === "model") {
      history.unshift({
        role: "user",
        parts: [{ text: "Hi, I'm interested in your services." }],
      });
    }

    const lastMessage = messages[messages.length - 1].content;

    let result;
    try {
      const model = genAI.getGenerativeModel({ 
        model: primaryModelName, 
        systemInstruction: SYSTEM_PROMPT 
      });
      const chat = model.startChat({ history });
      result = await retryWithBackoff(() => chat.sendMessageStream(lastMessage), 3, 300);
    } catch (primaryError: any) {
      console.warn(`Primary model ${primaryModelName} failed after retries, attempting fallback. Error:`, primaryError);
      try {
        const model = genAI.getGenerativeModel({ 
          model: fallbackModelName, 
          systemInstruction: SYSTEM_PROMPT 
        });
        const chat = model.startChat({ history });
        result = await retryWithBackoff(() => chat.sendMessageStream(lastMessage), 3, 300);
      } catch (fallbackError: any) {
        console.error(`Fallback model ${fallbackModelName} also failed after retries. Error:`, fallbackError);
        const url = new URL(req.url);
        const debug = url.searchParams.get("debug") === "true";
        return NextResponse.json({ 
          error: debug 
            ? `Primary: ${primaryError.message || primaryError}. Fallback: ${fallbackError.message || fallbackError}`
            : "We are experiencing high traffic, try again." 
        }, { status: 500 });
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (error) {
          console.error("Mid-stream error captured:", error);
          controller.enqueue(new TextEncoder().encode("\n\n[We are experiencing high traffic, try again.]"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Chat API outer error:", error);
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "true";
    return NextResponse.json({ 
      error: debug 
        ? `Outer error: ${error.message || error}`
        : "We are experiencing high traffic, try again." 
    }, { status: 500 });
  }
}
