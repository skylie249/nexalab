"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { INDUSTRY_OPTIONS, type Industry } from "@/lib/quotePresets";
import styles from "./page.module.css";

const ACCEPTED_FILE_TYPES = ".pdf,.docx";
const MAX_FILE_SIZE_MB = 8;
const SERVICE_TYPE_OPTIONS = ["신규 제작", "리뉴얼", "기능 추가"];

interface QuoteItem {
  name: string;
  category?: string;
  days: number;
  amount: number;
  reason: string;
}

interface Quote {
  summary?: string;
  items: QuoteItem[];
  total_min: number;
  total_max: number;
  risks?: string[];
}

function formatWon(amount: number) {
  return `${Math.round(amount).toLocaleString("ko-KR")}원`;
}

type Step = "landing" | "wizard" | "form";
type InputMode = "text" | "file";
type BudgetKnown = "yes" | "no" | null;

export default function QuoteGeneratorClient() {
  const [step, setStep] = useState<Step>("landing");

  // 공통(견적 분석) 상태
  const [industry, setIndustry] = useState(INDUSTRY_OPTIONS[0]?.value ?? "web_dev");
  const [hourlyRate, setHourlyRate] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fromWizard, setFromWizard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 요청서 작성 도우미(위저드) 상태
  const [wizardStep, setWizardStep] = useState(0);
  const [serviceType, setServiceType] = useState("");
  const [features, setFeatures] = useState("");
  const [featuresUnknown, setFeaturesUnknown] = useState(false);
  const [budgetHas, setBudgetHas] = useState<BudgetKnown>(null);
  const [budgetRange, setBudgetRange] = useState("");
  const [deadline, setDeadline] = useState("");
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardError, setWizardError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`파일 용량은 ${MAX_FILE_SIZE_MB}MB 이하만 업로드할 수 있습니다.`);
      e.target.value = "";
      setFile(null);
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setError(null);
  };

  const resetToLanding = () => {
    setStep("landing");
    setFromWizard(false);
    setWizardStep(0);
    setServiceType("");
    setFeatures("");
    setFeaturesUnknown(false);
    setBudgetHas(null);
    setBudgetRange("");
    setDeadline("");
    setWizardError(null);
    setText("");
    setFile(null);
    setInputMode("text");
    setError(null);
  };

  const startWizard = () => {
    setWizardStep(0);
    setWizardError(null);
    setStep("wizard");
  };

  const handleWizardBack = () => {
    setWizardError(null);
    if (wizardStep === 0) {
      setStep("landing");
      return;
    }
    setWizardStep((s) => s - 1);
  };

  const handleWizardNext = () => {
    if (wizardStep === 0 && !serviceType) {
      setWizardError("서비스 종류를 선택해주세요.");
      return;
    }
    setWizardError(null);
    setWizardStep((s) => s + 1);
  };

  const handleGenerateRequest = async () => {
    if (wizardLoading) return;
    setWizardLoading(true);
    setWizardError(null);

    try {
      const budget =
        budgetHas === "yes" ? budgetRange.trim() : budgetHas === "no" ? "없음" : "";

      const res = await fetch("/api/wizard-to-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType,
          features: featuresUnknown ? "" : features,
          budget,
          deadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "요청서 생성 중 오류가 발생했습니다.");
      }

      setText(data.requestText as string);
      setInputMode("text");
      setFromWizard(true);
      setStep("form");
    } catch (err) {
      setWizardError(err instanceof Error ? err.message : "요청 중 오류가 발생했습니다.");
    } finally {
      setWizardLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (inputMode === "file" && !file) {
      setError("분석할 파일을 업로드해주세요.");
      return;
    }
    if (inputMode === "text" && text.trim().length < 20) {
      setError("요청서 내용을 20자 이상 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const formData = new FormData();
      formData.append("industry", industry);
      if (hourlyRate) formData.append("hourlyRate", hourlyRate);
      if (inputMode === "file" && file) {
        formData.append("file", file);
      } else {
        formData.append("text", text);
      }

      const res = await fetch("/api/quote", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "알 수 없는 오류가 발생했습니다.");
      }
      setQuote(data.quote as Quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetResult = () => {
    setQuote(null);
    setError(null);
  };

  if (quote) {
    return (
      <section className={styles.resultWrap}>
        <div className={`${styles.card} glass`}>
          {quote.summary && <p className={styles.summary}>{quote.summary}</p>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>작업 항목</th>
                  <th>분류</th>
                  <th>예상 공수</th>
                  <th>소계</th>
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemReason}>{item.reason}</div>
                    </td>
                    <td>{item.category || "-"}</td>
                    <td>{item.days}일</td>
                    <td>{formatWon(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.totalBox}>
            <span className={styles.totalLabel}>총 견적 범위</span>
            <span className={styles.totalAmount}>
              {formatWon(quote.total_min)} ~ {formatWon(quote.total_max)}
            </span>
          </div>

          {quote.risks && quote.risks.length > 0 && (
            <div className={styles.risks}>
              <h3>⚠️ 참고할 리스크 요소</h3>
              <ul>
                {quote.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.disclaimer}>
            본 견적은 AI가 입력된 내용을 바탕으로 산출한 참고용 추정치이며, 실제 계약 금액과 다를 수 있습니다.
            실제 계약 전 반드시 전문가 검토를 거치시기 바랍니다.
          </p>
        </div>

        <div className={styles.resultActions}>
          <Link
            href={`/tools/profit-calculator?income=${Math.round((quote.total_min + quote.total_max) / 2)}&industry=${industry}`}
            className={styles.primaryButton}
          >
            📊 이 견적으로 손익 계산해보기
          </Link>
          <button type="button" className={styles.secondaryButton} onClick={handleResetResult}>
            ← 다시 작성하기
          </button>
        </div>
      </section>
    );
  }

  if (step === "landing") {
    return (
      <div className={`${styles.card} glass`}>
        <h2 className={styles.stepTitle}>서비스 요청서(RFP)가 있으신가요?</h2>
        <p className={styles.stepDesc}>
          있으시면 바로 업로드하거나 붙여넣어 주세요. 없으시면 몇 가지 질문에 답하는 것만으로
          AI가 요청서 초안을 대신 작성해 드려요.
        </p>
        <div className={styles.choiceGrid}>
          <button type="button" className={styles.choiceCard} onClick={() => setStep("form")}>
            <span className={styles.choiceTitle}>네, 있어요</span>
            <span className={styles.choiceDesc}>파일을 업로드하거나 내용을 붙여넣을게요</span>
          </button>
          <button type="button" className={styles.choiceCard} onClick={startWizard}>
            <span className={styles.choiceTitle}>아니요, 대충만 알고 있어요</span>
            <span className={styles.choiceDesc}>몇 가지만 답하면 AI가 요청서를 만들어드려요</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === "wizard") {
    return (
      <div className={`${styles.card} glass`}>
        <div className={styles.wizardHeader}>
          <button type="button" className={styles.backLink} onClick={handleWizardBack}>
            ← {wizardStep === 0 ? "처음으로" : "이전"}
          </button>
          <span className={styles.wizardProgress}>질문 {wizardStep + 1} / 4</span>
        </div>

        {wizardStep === 0 && (
          <div className={styles.field}>
            <label>어떤 종류의 서비스가 필요하세요?</label>
            <div className={styles.choiceGrid}>
              {SERVICE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`${styles.choiceCard} ${styles.choiceCardCompact} ${
                    serviceType === opt ? styles.choiceCardActive : ""
                  }`}
                  onClick={() => setServiceType(opt)}
                >
                  <span className={styles.choiceTitle}>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {wizardStep === 1 && (
          <div className={styles.field}>
            <label htmlFor="wizardFeatures">대략 어떤 페이지/기능이 필요하세요?</label>
            <textarea
              id="wizardFeatures"
              rows={6}
              placeholder="예: 회사 소개 페이지, 상품 목록, 온라인 결제 기능이 필요해요."
              value={features}
              disabled={featuresUnknown}
              onChange={(e) => setFeatures(e.target.value)}
            />
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={featuresUnknown}
                onChange={(e) => {
                  setFeaturesUnknown(e.target.checked);
                  if (e.target.checked) setFeatures("");
                }}
              />
              아직 구체적으로 잘 모르겠어요
            </label>
          </div>
        )}

        {wizardStep === 2 && (
          <div className={styles.field}>
            <label>예산 감이 있으신가요?</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="budgetHas"
                  checked={budgetHas === "yes"}
                  onChange={() => setBudgetHas("yes")}
                />
                네, 대략 있어요
              </label>
              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="budgetHas"
                  checked={budgetHas === "no"}
                  onChange={() => setBudgetHas("no")}
                />
                아직 없어요
              </label>
            </div>
            {budgetHas === "yes" && (
              <input
                type="text"
                placeholder="예: 300~500만원"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
              />
            )}
          </div>
        )}

        {wizardStep === 3 && (
          <div className={styles.field}>
            <label htmlFor="wizardDeadline">언제까지 필요하세요?</label>
            <input
              id="wizardDeadline"
              type="text"
              placeholder="예: 한 달 내, 특별히 정해진 시점은 없어요"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        )}

        {wizardError && <p className={styles.error}>{wizardError}</p>}

        <div className={styles.wizardNav}>
          {wizardStep < 3 ? (
            <button type="button" className={styles.primaryButton} onClick={handleWizardNext}>
              다음
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleGenerateRequest}
              disabled={wizardLoading}
            >
              {wizardLoading ? "AI가 요청서를 작성 중입니다..." : "AI로 요청서 만들기"}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className={`${styles.card} glass ${styles.form}`} onSubmit={handleSubmit}>
      <button type="button" className={styles.backLink} onClick={resetToLanding}>
        ← 처음으로
      </button>

      <div className={styles.field}>
        <label htmlFor="industry">업종</label>
        <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value as Industry)}>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="hourlyRate">희망 시간당 단가 (선택, 원)</label>
        <input
          id="hourlyRate"
          type="number"
          min={0}
          placeholder="입력하지 않으면 업계 평균 단가로 계산합니다"
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label>서비스 요청서 (RFP)</label>
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${inputMode === "text" ? styles.modeTabActive : ""}`}
            onClick={() => handleModeChange("text")}
          >
            텍스트 붙여넣기
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${inputMode === "file" ? styles.modeTabActive : ""}`}
            onClick={() => handleModeChange("file")}
          >
            파일 업로드 (PDF·DOCX)
          </button>
        </div>

        {inputMode === "text" ? (
          <>
            {fromWizard && (
              <p className={styles.noteBox}>
                AI가 답변을 바탕으로 작성한 요청서 초안입니다. 필요하면 자유롭게 수정하세요.
              </p>
            )}
            <textarea
              id="rfpText"
              rows={10}
              placeholder="클라이언트가 보낸 요청서 내용, 이메일, 미팅 메모 등을 붙여넣어 주세요."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setFromWizard(false);
              }}
            />
          </>
        ) : (
          <div className={styles.fileDropzone}>
            {file ? (
              <div className={styles.fileSelected}>
                <span className={styles.fileName}>📄 {file.name}</span>
                <button type="button" className={styles.fileRemove} onClick={handleRemoveFile}>
                  제거
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  id="rfpFile"
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                <label htmlFor="rfpFile" className={styles.fileLabel}>
                  <span>파일을 선택하거나 이곳에 끌어다 놓으세요</span>
                  <span className={styles.fileHint}>PDF, DOCX · 최대 {MAX_FILE_SIZE_MB}MB</span>
                </label>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.primaryButton} disabled={loading}>
        {loading ? "AI가 분석 중입니다..." : "AI 견적 분석하기"}
      </button>

      <p className={styles.formNote}>
        업로드된 내용은 견적 산출에만 사용됩니다. 결과는 참고용 추정치이며 실제 계약은 전문가 검토가 필요합니다.
      </p>
    </form>
  );
}
