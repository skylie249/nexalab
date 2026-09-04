"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { INDUSTRY_OPTIONS, type Industry } from "@/lib/quotePresets";
import { formatWon } from "@/lib/formatCurrency";
import { saveQuoteHistory } from "@/lib/dashboardHistory";
import styles from "./page.module.css";

const ACCEPTED_FILE_TYPES = ".pdf,.docx";
const MAX_FILE_SIZE_MB = 8;

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

type Step = "landing" | "wizard" | "form";
type InputMode = "text" | "file";
type BudgetKnown = "yes" | "no" | null;

// 기능 항목 생성기(`/tools/feature-item-generator`)의 "이 항목으로 견적서 만들기" 딥링크가
// 넘기는 `features` 쿼리 파라미터(JSON 문자열 배열)를 파싱한다. 값이 없거나 형식이
// 잘못된 경우 null을 반환해 일반 진입(랜딩 화면)으로 자연스럽게 폴백한다.
function parseFeaturesParam(raw: string | null): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const names = parsed.filter((f): f is string => typeof f === "string" && f.trim().length > 0);
    return names.length > 0 ? names : null;
  } catch {
    return null;
  }
}

// 기능 목록은 항상 한국어로 생성되므로(기능 항목 생성기가 로케일과 무관하게 한국어로
// AI 응답을 생성하는 기존 컨벤션과 동일), 여기서 조립하는 요청서 초안 문구도 로케일과
// 무관하게 한국어로 고정한다 — /api/quote의 분석 프롬프트 자체도 한국어 고정이라 일관됨.
function buildTextFromFeatures(features: string[]): string {
  const bulletList = features.map((name) => `- ${name}`).join("\n");
  return `다음 기능들을 포함하는 서비스를 개발하고 싶습니다.\n\n${bulletList}`;
}

export default function QuoteGeneratorClient() {
  const t = useTranslations("quoteGenerator");
  const tIndustries = useTranslations("industries");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const initialFeatures = parseFeaturesParam(searchParams.get("features"));

  const SERVICE_TYPE_OPTIONS = [
    t("serviceTypeNew"),
    t("serviceTypeRenewal"),
    t("serviceTypeAddFeature"),
  ];

  const [step, setStep] = useState<Step>(initialFeatures ? "form" : "landing");

  // 공통(견적 분석) 상태
  const [industry, setIndustry] = useState(INDUSTRY_OPTIONS[0]?.value ?? "web_dev");
  const [hourlyRate, setHourlyRate] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState(initialFeatures ? buildTextFromFeatures(initialFeatures) : "");
  const [file, setFile] = useState<File | null>(null);
  const [fromWizard, setFromWizard] = useState(false);
  const [fromFeatureGenerator, setFromFeatureGenerator] = useState(Boolean(initialFeatures));
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
      setError(t("errorFileTooLarge", { maxMb: MAX_FILE_SIZE_MB }));
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
    setFromFeatureGenerator(false);
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
      setWizardError(t("errorServiceTypeRequired"));
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
        throw new Error(data.error || t("errorWizardGeneric"));
      }

      setText(data.requestText as string);
      setInputMode("text");
      setFromWizard(true);
      setStep("form");
    } catch (err) {
      setWizardError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setWizardLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (inputMode === "file" && !file) {
      setError(t("errorFileRequired"));
      return;
    }
    if (inputMode === "text" && text.trim().length < 20) {
      setError(t("errorTextTooShort"));
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
        throw new Error(data.error || t("errorUnknown"));
      }
      const receivedQuote = data.quote as Quote;
      setQuote(receivedQuote);
      saveQuoteHistory({
        industry,
        summary: receivedQuote.summary || receivedQuote.items?.[0]?.name || "",
        totalMin: receivedQuote.total_min,
        totalMax: receivedQuote.total_max,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
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
                  <th>{t("resultTableHeaderItem")}</th>
                  <th>{t("resultTableHeaderCategory")}</th>
                  <th>{t("resultTableHeaderDays")}</th>
                  <th>{t("resultTableHeaderSubtotal")}</th>
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
                    <td>{t("resultDaysUnit", { days: item.days })}</td>
                    <td>{formatWon(item.amount, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.totalBox}>
            <span className={styles.totalLabel}>{t("resultTotalLabel")}</span>
            <span className={styles.totalAmount}>
              {formatWon(quote.total_min, locale)} ~ {formatWon(quote.total_max, locale)}
            </span>
          </div>

          {quote.risks && quote.risks.length > 0 && (
            <div className={styles.risks}>
              <h3>{t("resultRisksTitle")}</h3>
              <ul>
                {quote.risks.map((risk, idx) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.disclaimer}>{t("resultDisclaimer")}</p>
        </div>

        <div className={styles.resultActions}>
          <Link
            href={`/tools/profit-calculator?income=${Math.round((quote.total_min + quote.total_max) / 2)}&industry=${industry}`}
            className={styles.primaryButton}
          >
            {t("resultProfitCalcCta")}
          </Link>
          <button type="button" className={styles.secondaryButton} onClick={handleResetResult}>
            {t("resultRestartCta")}
          </button>
        </div>
      </section>
    );
  }

  if (step === "landing") {
    return (
      <div className={`${styles.card} glass`}>
        <h2 className={styles.stepTitle}>{t("landingStepTitle")}</h2>
        <p className={styles.stepDesc}>{t("landingStepDesc")}</p>
        <div className={styles.choiceGrid}>
          <button type="button" className={styles.choiceCard} onClick={() => setStep("form")}>
            <span className={styles.choiceTitle}>{t("landingHasRfpTitle")}</span>
            <span className={styles.choiceDesc}>{t("landingHasRfpDesc")}</span>
          </button>
          <button type="button" className={styles.choiceCard} onClick={startWizard}>
            <span className={styles.choiceTitle}>{t("landingNoRfpTitle")}</span>
            <span className={styles.choiceDesc}>{t("landingNoRfpDesc")}</span>
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
            ← {wizardStep === 0 ? t("wizardBackHome") : t("wizardBackPrev")}
          </button>
          <span className={styles.wizardProgress}>{t("wizardProgress", { step: wizardStep + 1 })}</span>
        </div>

        {wizardStep === 0 && (
          <div className={styles.field}>
            <label>{t("wizardStep0Label")}</label>
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
            <label htmlFor="wizardFeatures">{t("wizardStep1Label")}</label>
            <textarea
              id="wizardFeatures"
              rows={6}
              placeholder={t("wizardStep1Placeholder")}
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
              {t("wizardStep1Unknown")}
            </label>
          </div>
        )}

        {wizardStep === 2 && (
          <div className={styles.field}>
            <label>{t("wizardStep2Label")}</label>
            <div className={styles.radioGroup}>
              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="budgetHas"
                  checked={budgetHas === "yes"}
                  onChange={() => setBudgetHas("yes")}
                />
                {t("wizardStep2Yes")}
              </label>
              <label className={styles.radioRow}>
                <input
                  type="radio"
                  name="budgetHas"
                  checked={budgetHas === "no"}
                  onChange={() => setBudgetHas("no")}
                />
                {t("wizardStep2No")}
              </label>
            </div>
            {budgetHas === "yes" && (
              <input
                type="text"
                placeholder={t("wizardStep2Placeholder")}
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
              />
            )}
          </div>
        )}

        {wizardStep === 3 && (
          <div className={styles.field}>
            <label htmlFor="wizardDeadline">{t("wizardStep3Label")}</label>
            <input
              id="wizardDeadline"
              type="text"
              placeholder={t("wizardStep3Placeholder")}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        )}

        {wizardError && <p className={styles.error}>{wizardError}</p>}

        <div className={styles.wizardNav}>
          {wizardStep < 3 ? (
            <button type="button" className={styles.primaryButton} onClick={handleWizardNext}>
              {t("wizardNext")}
            </button>
          ) : (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleGenerateRequest}
              disabled={wizardLoading}
            >
              {wizardLoading ? t("wizardGenerating") : t("wizardGenerate")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className={`${styles.card} glass ${styles.form}`} onSubmit={handleSubmit}>
      <button type="button" className={styles.backLink} onClick={resetToLanding}>
        {t("formBackHome")}
      </button>

      <div className={styles.field}>
        <label htmlFor="industry">{t("formIndustryLabel")}</label>
        <select id="industry" value={industry} onChange={(e) => setIndustry(e.target.value as Industry)}>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {tIndustries(opt.value)}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="hourlyRate">{t("formHourlyRateLabel")}</label>
        <input
          id="hourlyRate"
          type="number"
          min={0}
          placeholder={t("formHourlyRatePlaceholder")}
          value={hourlyRate}
          onChange={(e) => setHourlyRate(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label>{t("formRfpLabel")}</label>
        <div className={styles.modeTabs}>
          <button
            type="button"
            className={`${styles.modeTab} ${inputMode === "text" ? styles.modeTabActive : ""}`}
            onClick={() => handleModeChange("text")}
          >
            {t("formModeText")}
          </button>
          <button
            type="button"
            className={`${styles.modeTab} ${inputMode === "file" ? styles.modeTabActive : ""}`}
            onClick={() => handleModeChange("file")}
          >
            {t("formModeFile")}
          </button>
        </div>

        {inputMode === "text" ? (
          <>
            {fromWizard && (
              <p className={styles.noteBox}>{t("formWizardNote")}</p>
            )}
            {fromFeatureGenerator && (
              <p className={styles.noteBox}>{t("formFeatureGeneratorNote")}</p>
            )}
            <textarea
              id="rfpText"
              rows={10}
              placeholder={t("formTextPlaceholder")}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setFromWizard(false);
                setFromFeatureGenerator(false);
              }}
            />
          </>
        ) : (
          <div className={styles.fileDropzone}>
            {file ? (
              <div className={styles.fileSelected}>
                <span className={styles.fileName}>📄 {file.name}</span>
                <button type="button" className={styles.fileRemove} onClick={handleRemoveFile}>
                  {t("formFileRemove")}
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
                  <span>{t("formFileLabel")}</span>
                  <span className={styles.fileHint}>{t("formFileHint", { maxMb: MAX_FILE_SIZE_MB })}</span>
                </label>
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button type="submit" className={styles.primaryButton} disabled={loading}>
        {loading ? t("formSubmitting") : t("formSubmit")}
      </button>

      <p className={styles.formNote}>{t("formNote")}</p>
    </form>
  );
}
