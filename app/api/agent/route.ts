import { NextRequest, NextResponse } from "next/server";
import { agentJsonSchema } from "@/lib/schema";
import { buildSystemPrompt } from "@/lib/prompt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      channel,
      request,
      internalNotes,
      history = [],
    } = body;

    if (!request?.trim()) {
      return NextResponse.json(
        { error: "request is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const model =
      process.env.OPENROUTER_MODEL ??
      "google/gemini-2.5-flash";

    const userContext = `
کانال:
${channel}

درخواست فعلی کارشناس:
${request}

اطلاعات داخلی یا مواردی که نباید در پیام گفته شوند:
${internalNotes || "موردی ثبت نشده"}

تاریخچه گفت‌وگو:
${JSON.stringify(history, null, 2)}
`;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.25,
max_tokens: 1200,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(),
            },
            {
              role: "user",
              content: userContext,
            },
          ],

          response_format: {
            type: "json_schema",
            json_schema: {
              name: "numberland_support_agent",
              strict: true,
              schema: agentJsonSchema,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();

      console.error("OpenRouter error:", detail);

      return NextResponse.json(
        { error: "AI provider error" },
        { status: 502 }
      );
    }

    const result = await response.json();

    const content =
      result?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 502 }
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Invalid AI response" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}