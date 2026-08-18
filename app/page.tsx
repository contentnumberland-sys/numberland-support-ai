"use client";

import { useState } from "react";

type Channel =
  | "sms"
  | "chat"
  | "ticket"
  | "announcement"
  | "other";

type Question = {
  id: string;
  question: string;
  reason: string;
};

type AgentResponse = {
  status:
    | "needs_information"
    | "needs_confirmation"
    | "completed"
    | "error";

  understanding: {
    channel: Channel;
    audience: string | null;
    situation: string | null;
    goal: string | null;
    user_action: string | null;
  };

  questions: Question[];

  final_message: {
    text: string;
    channel: Channel;
  } | null;
};

export default function Home() {
  const [channel, setChannel] = useState<Channel>("sms");
  const [request, setRequest] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendRequest(currentRequest = request) {
    setLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          request: currentRequest,
          internalNotes,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        alert(data?.error || "در پردازش درخواست مشکلی پیش اومد.");
        return;
      }

      setResult(data);
    } catch (error) {
      console.error("Request Error:", error);
      alert("در ارتباط با سرور مشکلی پیش اومد.");
    } finally {
      setLoading(false);
    }
  }

  async function answerQuestions() {
    if (!answer.trim() || !result) return;

    const updatedHistory = [
      ...history,
      {
        role: "assistant",
        type: "questions",
        content: result.questions.map((q) => q.question),
      },
      {
        role: "user",
        content: answer,
      },
    ];

    setHistory(updatedHistory);
    setAnswer("");
    setLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          request,
          internalNotes,
          history: updatedHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error:", data);
        alert(data?.error || "در پردازش درخواست مشکلی پیش اومد.");
        return;
      }

      setResult(data);
    } catch (error) {
      console.error("Request Error:", error);
      alert("در ارتباط با سرور مشکلی پیش اومد.");
    } finally {
      setLoading(false);
    }
  }

  async function copyMessage() {
    if (!result?.final_message?.text) return;

    await navigator.clipboard.writeText(
      result.final_message.text
    );
  }

  function reset() {
    setRequest("");
    setInternalNotes("");
    setHistory([]);
    setResult(null);
    setAnswer("");
  }

  return (
    <main className="page">
      <section className="container">
        <header className="header">
          <div className="brand">نامبرلند</div>

          <h1>دستیار تولید پیام پشتیبانی</h1>

          <p>
            درخواستت رو همون‌طور که برای همکارت توضیح می‌دی بنویس.
            اگر اطلاعاتی کم باشه، چند سؤال کوتاه ازت می‌پرسم.
          </p>
        </header>

        {!result && (
          <section className="composer">
            <label>نوع پیام</label>

            <div className="channels">
              {[
                ["sms", "پیامک"],
                ["chat", "چت"],
                ["ticket", "تیکت"],
                ["announcement", "اطلاعیه"],
                ["other", "سایر"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={
                    channel === value
                      ? "channel active"
                      : "channel"
                  }
                  onClick={() =>
                    setChannel(value as Channel)
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <label>چه پیامی نیاز داری؟</label>

            <textarea
              rows={8}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="مثلاً یه پیامک می‌خوایم برای کاربرهایی که فعال‌سازیشون بیشتر از معمول طول کشیده..."
            />

            <details>
              <summary>
                اطلاعات داخلی یا مواردی که نباید به کاربر گفته بشه
              </summary>

              <textarea
                rows={4}
                value={internalNotes}
                onChange={(e) =>
                  setInternalNotes(e.target.value)
                }
                placeholder="مثلاً دلیل تأخیر اختلال سرویس‌دهنده است ولی داخل پیام گفته نشود."
              />
            </details>

            <button
              className="primary"
              disabled={loading || !request.trim()}
              onClick={() => sendRequest()}
            >
              {loading ? "در حال بررسی..." : "بررسی درخواست"}
            </button>
          </section>
        )}

        {result &&
          (result.status === "needs_information" ||
            result.status === "needs_confirmation") && (
            <section className="conversation">
              <div className="agent-card">
                <span className="agent-label">
                  چند مورد رو مشخص کن
                </span>

                {result.questions.map((question) => (
                  <p key={question.id}>
                    {question.question}
                  </p>
                ))}
              </div>

              <textarea
                rows={5}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="جوابت رو اینجا بنویس..."
              />

              <button
                className="primary"
                onClick={answerQuestions}
                disabled={loading || !answer.trim()}
              >
                {loading ? "در حال بررسی..." : "ادامه"}
              </button>
            </section>
          )}

        {result?.status === "completed" &&
          result.final_message && (
            <section className="output">
              <div className="understanding">
                <h3>برداشتی که از درخواست داشتم</h3>

                <p>
                  <strong>موضوع:</strong>{" "}
                  {result.understanding?.situation}
                </p>

                <p>
                  <strong>هدف:</strong>{" "}
                  {result.understanding?.goal}
                </p>

                <p>
                  <strong>اقدام کاربر:</strong>{" "}
                  {result.understanding?.user_action ||
                    "اقدام خاصی لازم نیست"}
                </p>
              </div>

              <div className="message-card">
                <div className="message-header">
                  <h2>متن پیشنهادی</h2>

                  {channel === "sms" && (
                    <span>
                      {result.final_message.text.length} کاراکتر
                    </span>
                  )}
                </div>

                <div className="final-text">
                  {result.final_message.text}
                </div>

                <div className="actions">
                  <button
                    className="primary"
                    onClick={copyMessage}
                  >
                    کپی متن
                  </button>

                  <button onClick={reset}>
                    درخواست جدید
                  </button>
                </div>
              </div>
            </section>
          )}
      </section>
    </main>
  );
}