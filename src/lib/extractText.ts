// Vercel 등 서버리스 환경에서 pdf-parse의 워커를 먼저 등록해야 DOMMatrix 관련
// FUNCTION_INVOCATION_FAILED 오류 없이 동작함 (pdf-parse 공식 Vercel 가이드)
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * 업로드된 PDF/DOCX 파일에서 텍스트를 추출합니다.
 * 파일은 메모리에서만 처리되며 디스크/Storage에 쓰지 않습니다.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (file.type === DOCX_MIME || name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(
    "지원하지 않는 파일 형식입니다. PDF 또는 DOCX 파일만 업로드할 수 있습니다."
  );
}
