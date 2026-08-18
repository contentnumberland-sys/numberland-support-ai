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
        {
          error: "request is required",
        },
        {
          status: 400,
        }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "OPENROUTER_API_KEY is not configured",
        },
        {
          status: 500,
        }
      );
    }

    const model =
      process.env.OPENROUTER_MODEL ||
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

    const openRouterResponse = await fetch(
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

    if (!openRouterResponse.ok) {
      const detail = await openRouterResponse.text();

      console.error(
        "OpenRouter error:",
        openRouterResponse.status,
        detail
      );

      let readableDetail = detail;

      try {
        const parsedDetail = JSON.parse(detail);

        readableDetail =
          parsedDetail?.error?.message ||
          parsedDetail?.message ||
          detail;
      } catch {
        // detail همان متن خام باقی می‌ماند
      }

      return NextResponse.json(
        {
          error: "AI provider error",
          detail: readableDetail,
          providerStatus: openRouterResponse.status,
        },
        {
          status: 502,
        }
      );
    }

    const result = await openRouterResponse.json();

    const content =
      result?.choices?.[0]?.message?.content;

    if (!content) {
      console.error(
        "OpenRouter returned empty content:",
        result
      );

      return NextResponse.json(
        {
          error: "Empty AI response",
          detail:
            "مدل پاسخی برای پردازش برنگرداند.",
        },
        {
          status: 502,
        }
      );
    }

    let parsed;

    try {
      parsed =
        typeof content === "string"
          ? JSON.parse(content)
          : content;
    } catch (error) {
      console.error(
        "Invalid AI JSON response:",
        content,
        error
      );

      return NextResponse.json(
        {
          error: "Invalid AI response",
          detail:
            "پاسخ مدل JSON معتبر نبود.",
        },
        {
          status: 502,
        }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(
      "Agent route unexpected error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    return NextResponse.json(
      {
        error: "Unexpected server error",
        detail: message,
      },
      {
        status: 500,
      }
    );
  }
}