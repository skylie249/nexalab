import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuoteSchema } from "@/lib/quoteSchema";
import { INDUSTRY_PRESETS, isIndustry } from "@/lib/quotePresets";
import { QuotePdfDocument } from "@/lib/QuotePdfDocument";

const RequestSchema = z.object({
  industry: z.string(),
  quote: QuoteSchema,
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const { industry, quote } = parsed.data;
  const industryLabel = isIndustry(industry) ? INDUSTRY_PRESETS[industry].label : industry;
  const generatedAt = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    const buffer = await renderToBuffer(
      <QuotePdfDocument quote={quote} industryLabel={industryLabel} generatedAt={generatedAt} />
    );

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nexalab-quote-${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[quote/pdf] PDF 생성 실패:", err);
    return NextResponse.json({ error: "PDF 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
