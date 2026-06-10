import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper: send via Resend with up to `maxRetries` attempts
async function sendViaResend(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
  maxRetries = 3
): Promise<{ ok: boolean; data?: unknown; error?: unknown }> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Resend] Attempt ${attempt}/${maxRetries} — sending to ${to}`);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to, subject, html }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log(`[Resend] Email sent successfully on attempt ${attempt}. ID: ${(data as any).id}`);
        return { ok: true, data };
      }

      console.error(`[Resend] Attempt ${attempt} failed:`, JSON.stringify(data));

      if (attempt < maxRetries) {
        const delay = attempt * 1000; // 1s, 2s back-off
        console.log(`[Resend] Retrying in ${delay}ms…`);
        await new Promise((r) => setTimeout(r, delay));
      }
    } catch (err: any) {
      console.error(`[Resend] Attempt ${attempt} threw:`, err.message || err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
      }
    }
  }

  return { ok: false, error: `Failed after ${maxRetries} attempts` };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, status, triggerType, sessionId } = body;

    console.log(`[send-summary] Received request — triggerType: ${triggerType}, status: ${status}, sessionId: ${sessionId}, messageCount: ${messages?.length}`);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("[send-summary] Missing GEMINI_API_KEY");
      return NextResponse.json({ error: "Configuration error: Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const toEmail = process.env.TO_EMAIL || "harith@hisako.eu";
    const fromEmail = process.env.FROM_EMAIL || "leads@notify.hisako.eu";
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("[send-summary] RESEND_API_KEY is not set — cannot send email");
      return NextResponse.json({ error: "Configuration error: RESEND_API_KEY is missing" }, { status: 500 });
    }

    console.log(`[send-summary] Config OK — from: ${fromEmail}, to: ${toEmail}`);

    // ── Extract lead info via Gemini ───────────────────────────────────────────
    let leadInfo = {
      visitorName: "Unknown",
      companyName: "Unknown",
      serviceNeed: "Unknown",
      currentSituation: "Unknown",
      budget: "Unknown",
      timeline: "Unknown",
      executiveSummary: "No summary could be generated.",
    };

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const extractionPrompt = `
You are an operations intelligence assistant for Hisako Digital, a premium performance marketing agency.
Analyze the following conversation between our growth intake chatbot (HD) and a website visitor.
Extract and compile the key lead information into the following JSON format:

{
  "visitorName": "The visitor's name if provided (or 'Unknown')",
  "companyName": "The company name or website if mentioned (or 'Unknown')",
  "serviceNeed": "The service they are looking for (e.g., SEO, Paid Search, Web Design, CRO, Strategy, or 'Unknown')",
  "currentSituation": "A brief summary of their current marketing setup, pain points, or traffic channels mentioned",
  "budget": "The marketing budget level they indicated (or 'Unknown')",
  "timeline": "When they are looking to start or get moving (or 'Unknown')",
  "executiveSummary": "A professional 2-3 sentence summary of the visitor's goal, context, and readiness."
}

Ensure the output is valid JSON.

Conversation transcript:
${messages
  .map(
    (m: { role: string; content: string }) =>
      `${m.role === "user" ? "Visitor" : "Assistant (HD)"}: ${m.content}`
  )
  .join("\n")}
`;

      const result = await model.generateContent(extractionPrompt);
      let raw = result.response.text().trim();

      // Strip markdown code fences if present
      raw = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

      try {
        const parsed = JSON.parse(raw);
        leadInfo = { ...leadInfo, ...parsed };
        console.log(`[send-summary] Gemini extraction succeeded — visitor: ${leadInfo.visitorName}`);
      } catch (parseErr) {
        console.error("[send-summary] JSON parse failed. Raw Gemini output:", raw);
      }
    } catch (geminiErr: any) {
      console.warn("[send-summary] Gemini extraction failed:", geminiErr.message || geminiErr);
    }

    // ── Status badge styling ───────────────────────────────────────────────────
    let statusText = "Neutral / In-Progress";
    let statusColor = "#888880";
    let statusBg = "rgba(136,136,128,0.1)";
    let statusBorder = "#444440";
    let subjectPrefix = "💬 Chat Session";

    if (status === "qualified") {
      statusText = "Qualified Lead";
      statusColor = "#00FFAA";
      statusBg = "rgba(0,255,170,0.1)";
      statusBorder = "#00E599";
      subjectPrefix = "🔥 Qualified Lead";
    } else if (status === "disqualified") {
      statusText = "Disqualified Lead";
      statusColor = "#FF4444";
      statusBg = "rgba(255,68,68,0.1)";
      statusBorder = "#FF4444";
      subjectPrefix = "❌ Disqualified Lead";
    }

    const companyStr =
      leadInfo.companyName && leadInfo.companyName !== "Unknown"
        ? ` - ${leadInfo.companyName}`
        : "";
    const nameStr =
      leadInfo.visitorName && leadInfo.visitorName !== "Unknown"
        ? leadInfo.visitorName
        : "Anonymous Visitor";
    const subject = `${subjectPrefix}: ${nameStr}${companyStr} (${
      triggerType === "exit" ? "Abandoned" : "Completed"
    })`;

    // ── Build HTML email ───────────────────────────────────────────────────────
    const messagesHtml = messages
      .map((m: { role: string; content: string }) => {
        const isUser = m.role === "user";
        return `
        <div style="margin-bottom:16px;padding:10px 14px;border-radius:8px;line-height:1.5;font-size:13px;
          background-color:${isUser ? "#1E1E1E" : "#141414"};
          border-left:2px solid ${isUser ? "#E8FF00" : "#444440"};
          ${isUser ? "margin-left:20px" : "margin-right:20px"}">
          <div style="font-size:10px;text-transform:uppercase;font-weight:bold;letter-spacing:0.05em;
            margin-bottom:4px;color:${isUser ? "#E8FF00" : "#888880"}">
            ${isUser ? "Prospect" : "HD Assistant"}
          </div>
          <div style="color:#E2E2D9;white-space:pre-wrap">${m.content}</div>
        </div>`;
      })
      .join("");

    const metaRows = [
      ["Visitor Name", leadInfo.visitorName],
      ["Company / Website", leadInfo.companyName],
      ["Service Intent", leadInfo.serviceNeed],
      ["Current Situation", leadInfo.currentSituation],
      ["Stated Budget", leadInfo.budget],
      ["Timeline to Start", leadInfo.timeline],
    ]
      .map(
        ([label, val]) => `
      <tr style="border-bottom:1px solid #1C1C1C">
        <td style="padding:12px 8px;font-size:12px;color:#888880;text-transform:uppercase;width:35%;
          vertical-align:top;font-weight:600;letter-spacing:0.05em">${label}</td>
        <td style="padding:12px 8px;font-size:14px;color:#F5F5F0;font-weight:500;vertical-align:top">${val}</td>
      </tr>`
      )
      .join("");

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="background-color:#0A0A0A;color:#F5F5F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;margin:0;padding:0">
  <div style="background-color:#0A0A0A;padding:40px 20px">
    <div style="max-width:600px;margin:0 auto;background-color:#111111;border:1px solid #222222;border-radius:12px;overflow:hidden">

      <!-- Header -->
      <div style="padding:32px 24px;border-bottom:1px solid #222222;text-align:center;background-color:#111111">
        <div style="font-size:22px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px">
          <span style="color:#F5F5F0">Hisako</span> <span style="color:#E8FF00">Digital</span>
        </div>
        <div style="display:inline-block;padding:6px 14px;font-size:11px;font-weight:bold;border-radius:20px;
          text-transform:uppercase;letter-spacing:0.06em;color:${statusColor};
          background-color:${statusBg};border:1px solid ${statusBorder};margin-top:8px">
          ${statusText} · ${triggerType}
        </div>
      </div>

      <!-- Content -->
      <div style="padding:32px 24px">
        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#888880;
          margin-top:0;margin-bottom:16px;font-weight:700;border-bottom:1px solid #222222;padding-bottom:6px">
          Lead Executive Summary
        </h3>
        <div style="background-color:#1A1A1A;border:1px solid #222222;border-left:3px solid #E8FF00;
          padding:16px 20px;border-radius:8px;margin-bottom:32px;line-height:1.6;font-size:14px;color:#F5F5F0">
          ${leadInfo.executiveSummary}
        </div>

        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#888880;
          margin-top:0;margin-bottom:16px;font-weight:700;border-bottom:1px solid #222222;padding-bottom:6px">
          Extracted Details
        </h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:32px">${metaRows}</table>

        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#888880;
          margin-top:0;margin-bottom:16px;font-weight:700;border-bottom:1px solid #222222;padding-bottom:6px">
          Conversation Transcript
        </h3>
        <div style="background-color:#0D0D0D;border:1px solid #222222;border-radius:8px;padding:16px">
          ${messagesHtml}
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:24px;text-align:center;font-size:11px;color:#444440;
        background-color:#0E0E0E;border-top:1px solid #222222">
        © ${new Date().getFullYear()} Hisako Digital Growth Intelligence · Automated Notification
      </div>
    </div>
  </div>
</body>
</html>`;

    // ── Send via Resend (3 retries) ────────────────────────────────────────────
    console.log(`[send-summary] Sending email — subject: "${subject}"`);
    const result = await sendViaResend(resendApiKey, fromEmail, toEmail, subject, htmlContent, 3);

    if (!result.ok) {
      console.error("[send-summary] All Resend attempts failed:", result.error);
      return NextResponse.json(
        { success: false, error: "Failed to deliver email after 3 attempts", details: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Summary email sent via Resend",
      emailId: (result.data as any)?.id,
    });
  } catch (error: any) {
    console.error("[send-summary] Unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process send-summary request" },
      { status: 500 }
    );
  }
}
