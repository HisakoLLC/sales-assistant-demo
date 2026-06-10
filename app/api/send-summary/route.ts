import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, status, triggerType } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error("Missing GEMINI_API_KEY in environment");
      return NextResponse.json({ error: "Configuration error: Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const toEmail = process.env.TO_EMAIL || "harith@hisako.eu";
    const fromEmail = process.env.FROM_EMAIL || "leads@notify.hisako.eu";
    const resendApiKey = process.env.RESEND_API_KEY;

    let leadInfo = {
      visitorName: "Unknown",
      companyName: "Unknown",
      serviceNeed: "Unknown",
      currentSituation: "Unknown",
      budget: "Unknown",
      timeline: "Unknown",
      executiveSummary: "Summary generation bypassed or failed due to configuration.",
    };

    // Use Gemini to extract structured profile info from conversation (resilient)
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
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

Here is the conversation transcript:
${messages
  .map(
    (m: { role: string; content: string }) =>
      `${m.role === "user" ? "Visitor" : "Assistant (HD)"}: ${m.content}`
  )
  .join("\n")}
`;

      const result = await model.generateContent(extractionPrompt);
      let leadInfoText = result.response.text().trim();

      // Clean up markdown block if present
      if (leadInfoText.startsWith("```")) {
        leadInfoText = leadInfoText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      }

      try {
        const parsed = JSON.parse(leadInfoText);
        leadInfo = { ...leadInfo, ...parsed };
      } catch (parseError) {
        console.error("Failed to parse Gemini extracted lead info. Raw text:", leadInfoText, parseError);
      }
    } catch (geminiError: any) {
      console.warn("Gemini lead extraction failed. Falling back to default details. Error:", geminiError.message || geminiError);
    }

    // Determine status styling
    let statusText = "Neutral/In-Progress";
    let statusColor = "#888880";
    let statusBg = "rgba(136, 136, 128, 0.1)";
    let statusBorder = "#444440";
    let subjectPrefix = "💬 Chat Session";

    if (status === "qualified") {
      statusText = "Qualified Lead";
      statusColor = "#00FFAA";
      statusBg = "rgba(0, 255, 170, 0.1)";
      statusBorder = "#00E599";
      subjectPrefix = "🔥 Qualified Lead";
    } else if (status === "disqualified") {
      statusText = "Disqualified Lead";
      statusColor = "#FF4444";
      statusBg = "rgba(255, 68, 68, 0.1)";
      statusBorder = "#FF4444";
      subjectPrefix = "❌ Disqualified Lead";
    }

    const companyStr = leadInfo.companyName && leadInfo.companyName !== "Unknown" ? ` - ${leadInfo.companyName}` : "";
    const nameStr = leadInfo.visitorName && leadInfo.visitorName !== "Unknown" ? leadInfo.visitorName : "Anonymous Visitor";
    const subject = `${subjectPrefix}: ${nameStr}${companyStr} (${triggerType === "exit" ? "Abandoned" : "Completed"})`;

    // Generate beautiful HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      background-color: #0A0A0A;
      color: #F5F5F0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      background-color: #0A0A0A;
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #111111;
      border: 1px solid #222222;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      padding: 32px 24px;
      border-bottom: 1px solid #222222;
      text-align: center;
      background-color: #111111;
    }
    .logo {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .logo-hisako { color: #F5F5F0; }
    .logo-digital { color: #E8FF00; }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: bold;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: ${statusColor};
      background-color: ${statusBg};
      border: 1px solid ${statusBorder};
      margin-top: 8px;
    }
    .content {
      padding: 32px 24px;
    }
    .section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #888880;
      margin-top: 0;
      margin-bottom: 16px;
      font-weight: 700;
      border-bottom: 1px solid #222222;
      padding-bottom: 6px;
    }
    .summary-box {
      background-color: #1A1A1A;
      border: 1px solid #222222;
      border-left: 3px solid #E8FF00;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 32px;
      line-height: 1.6;
      font-size: 14px;
      color: #F5F5F0;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .meta-row {
      border-bottom: 1px solid #1C1C1C;
    }
    .meta-row:last-child {
      border-bottom: none;
    }
    .meta-label {
      padding: 12px 8px;
      font-size: 12px;
      color: #888880;
      text-transform: uppercase;
      width: 35%;
      vertical-align: top;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .meta-value {
      padding: 12px 8px;
      font-size: 14px;
      color: #F5F5F0;
      font-weight: 500;
      vertical-align: top;
    }
    .transcript {
      background-color: #0D0D0D;
      border: 1px solid #222222;
      border-radius: 8px;
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    }
    .message {
      margin-bottom: 16px;
      padding: 10px 14px;
      border-radius: 8px;
      line-height: 1.5;
      font-size: 13px;
    }
    .message:last-child {
      margin-bottom: 0;
    }
    .msg-user {
      background-color: #1E1E1E;
      border-left: 2px solid #E8FF00;
      margin-left: 20px;
    }
    .msg-bot {
      background-color: #141414;
      border-left: 2px solid #444440;
      margin-right: 20px;
    }
    .msg-header {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: bold;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .msg-header-user { color: #E8FF00; }
    .msg-header-bot { color: #888880; }
    .msg-content {
      color: #E2E2D9;
      white-space: pre-wrap;
    }
    .footer {
      padding: 24px;
      text-align: center;
      font-size: 11px;
      color: #444440;
      background-color: #0E0E0E;
      border-top: 1px solid #222222;
    }
    .footer a {
      color: #888880;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo">
          <span class="logo-hisako">Hisako</span> <span class="logo-digital">Digital</span>
        </div>
        <div class="status-badge">${statusText} (${triggerType})</div>
      </div>
      
      <div class="content">
        <h3 class="section-title">Lead Executive Summary</h3>
        <div class="summary-box">
          ${leadInfo.executiveSummary}
        </div>
        
        <h3 class="section-title">Extracted Details</h3>
        <table class="meta-table">
          <tr class="meta-row">
            <td class="meta-label">Visitor Name</td>
            <td class="meta-value">${leadInfo.visitorName}</td>
          </tr>
          <tr class="meta-row">
            <td class="meta-label">Company / Website</td>
            <td class="meta-value">${leadInfo.companyName}</td>
          </tr>
          <tr class="meta-row">
            <td class="meta-label">Service Intent</td>
            <td class="meta-value">${leadInfo.serviceNeed}</td>
          </tr>
          <tr class="meta-row">
            <td class="meta-label">Current Situation</td>
            <td class="meta-value">${leadInfo.currentSituation}</td>
          </tr>
          <tr class="meta-row">
            <td class="meta-label">Stated Budget</td>
            <td class="meta-value">${leadInfo.budget}</td>
          </tr>
          <tr class="meta-row">
            <td class="meta-label">Timeline to Start</td>
            <td class="meta-value">${leadInfo.timeline}</td>
          </tr>
        </table>
        
        <h3 class="section-title">Conversation Transcript</h3>
        <div class="transcript">
          ${messages
            .map((m: { role: string; content: string }) => {
              const isUser = m.role === "user";
              return `
                <div class="message ${isUser ? "msg-user" : "msg-bot"}">
                  <div class="msg-header ${isUser ? "msg-header-user" : "msg-header-bot"}">
                    ${isUser ? "Prospect" : "HD Assistant"}
                  </div>
                  <div class="msg-content">${m.content}</div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
      
      <div class="footer">
        © ${new Date().getFullYear()} Hisako Digital Growth Intelligence • Automated Notification
      </div>
    </div>
  </div>
</body>
</html>
`;

    // Local file preview logic for dev/mock mode
    const scratchEmailsDir = path.join(process.cwd(), "scratch", "emails");
    if (!fs.existsSync(scratchEmailsDir)) {
      fs.mkdirSync(scratchEmailsDir, { recursive: true });
    }
    const cleanName = nameStr.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const filename = `summary-${status}-${cleanName}-${Date.now()}.html`;
    const filepath = path.join(scratchEmailsDir, filename);
    fs.writeFileSync(filepath, htmlContent, "utf-8");
    console.log(`[Email Mock] Saved lead summary layout preview locally to: ${filepath}`);

    // Deliver via Resend if API key is provided
    if (resendApiKey) {
      console.log(`Delivering lead notification to ${toEmail} from ${fromEmail} using Resend...`);
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!resendResponse.ok) {
        const resendError = await resendResponse.json();
        console.error("Resend API error:", resendError);
        return NextResponse.json({
          success: false,
          error: "Resend email delivery failed",
          details: resendError,
          previewFile: filepath,
        });
      }

      const resendData = await resendResponse.json();
      return NextResponse.json({
        success: true,
        message: "Summary email successfully sent via Resend",
        emailId: resendData.id,
        previewFile: filepath,
      });
    }

    // Default response if Resend key is missing (local preview only)
    return NextResponse.json({
      success: true,
      message: "Summary generated successfully and saved locally (Resend API Key not configured)",
      previewFile: filepath,
    });

  } catch (error: any) {
    console.error("Send summary API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process send summary request" }, { status: 500 });
  }
}
