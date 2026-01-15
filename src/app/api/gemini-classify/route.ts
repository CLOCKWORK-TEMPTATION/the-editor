import { NextResponse } from "next/server";
import logger from "@/utils/logger";

/**
 * @interface ClassifyRequestBody
 * @description هيكل طلب التصنيف
 */
interface ClassifyRequestBody {
  prompt: string;
  text: string;
}

/**
 * @interface ClassificationResponse
 * @description هيكل استجابة التصنيف
 */
interface ClassificationResponse {
  type: string;
  confidence: number;
  reasoning: string;
}

/**
 * ثوابت التكوين
 */
const MAX_TIMEOUT_MS = 30000; // 30 ثانية كحد أقصى
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // ثانية واحدة كتأخير أساسي

/**
 * دالة تأخير بسيطة لإعادة المحاولة
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * استخراج JSON من نص Gemini مع معالجة الأخطاء
 */
const extractJSONFromText = (text: string): ClassificationResponse | null => {
  try {
    // محاولة استخراج JSON من النص
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('No JSON found in response', { text });
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // التحقق من صحة الهيكل
    if (
      typeof parsed.type === 'string' &&
      typeof parsed.confidence === 'number' &&
      typeof parsed.reasoning === 'string'
    ) {
      return {
        type: parsed.type,
        confidence: Math.max(0, Math.min(100, parsed.confidence)), // التأكد من النطاق 0-100
        reasoning: parsed.reasoning
      };
    }

    logger.error('Invalid response structure', { parsed });
    return null;
  } catch (error) {
    logger.error('JSON parse error', { error, text });
    return null;
  }
};

/**
 * استخراج نص من استجابة Gemini
 */
const extractFirstText = (data: any): string => {
  const candidates = data?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return "";

  const parts = candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return "";

  for (const p of parts) {
    if (typeof p?.text === "string" && p.text.trim()) return p.text;
  }

  return "";
};

/**
 * دالة مساعدة لإجراء طلب Gemini مع إعادة المحاولة والانتظار
 */
const fetchGeminiWithRetry = async (
  url: string,
  body: any,
  retries = MAX_RETRIES
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), MAX_TIMEOUT_MS);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // معالجة حد المعدل (429)
      if (response.status === 429) {
        const waitTime = BASE_DELAY_MS * Math.pow(2, attempt); // تأخير أسى
        logger.warn(`Rate limit hit, retrying in ${waitTime}ms...`, { attempt: attempt + 1 });
        await delay(waitTime);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      // إذا لم يكن الخطأ بسبب abort (timeout)، أعد المحاولة
      if ((error as Error).name !== 'AbortError') {
        logger.warn(`Fetch attempt ${attempt + 1} failed, retrying...`, { error });
        await delay(BASE_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
};

/**
 * نقطة النهاية الرئيسية لتصنيف السيناريو
 */
export async function POST(req: Request) {
  const startTime = Date.now();
  let tokenCount = 0;

  try {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      logger.error('Missing GEMINI_API_KEY');
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ClassifyRequestBody;
    const { prompt, text } = body;

    // التحقق من المدخلات
    if (!prompt || typeof prompt !== 'string') {
      logger.error('Invalid or missing prompt');
      return NextResponse.json(
        { error: "Invalid or missing prompt" },
        { status: 400 }
      );
    }

    if (!text || typeof text !== 'string') {
      logger.error('Invalid or missing text');
      return NextResponse.json(
        { error: "Invalid or missing text" },
        { status: 400 }
      );
    }

    // تقدير عدد الرموز (تقدير تقريبي: 4 أحرف ≈ 1 رمز)
    tokenCount = Math.ceil((prompt.length + text.length) / 4);

    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const upstreamRes = await fetchGeminiWithRetry(url, {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => "");
      logger.error('Gemini API Error', {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        model,
        response: errText
      });
      return NextResponse.json(
        { error: "Gemini request failed", details: errText, status: upstreamRes.status },
        { status: 502 }
      );
    }

    const data = await upstreamRes.json();
    const content = extractFirstText(data);

    if (!content) {
      logger.error('Empty Gemini response', {
        candidates: data?.candidates,
        fullData: JSON.stringify(data)
      });
      return NextResponse.json(
        { error: "Empty Gemini response", raw: data },
        { status: 502 }
      );
    }

    // استخراج والتحقق من JSON
    const classification = extractJSONFromText(content);
    if (!classification) {
      logger.error('Failed to parse classification JSON', { content });
      return NextResponse.json(
        { error: "Invalid classification response", raw: content },
        { status: 502 }
      );
    }

    const duration = Date.now() - startTime;
    logger.info('✅ Classification successful', {
      type: classification.type,
      confidence: classification.confidence,
      duration,
      tokenCount,
      textLength: text.length
    });

    return NextResponse.json(classification);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Unhandled error in gemini-classify', {
      error: String(error),
      duration,
      tokenCount
    });
    return NextResponse.json(
      { error: "Unhandled error", details: String(error) },
      { status: 500 }
    );
  }
}
