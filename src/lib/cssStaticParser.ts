// 매우 단순화된 정적 CSS 파서 — 색상 대비 점검(a11y.color_contrast)을 위해
// "단순 선택자(태그/클래스/아이디 조합, 콤비네이터 없음)"의 color/background-color/
// background/font-size/font-weight 선언과 :root의 CSS 변수만 뽑아낸다.
//
// @media 등 at-rule 내부는 조건부 스타일(다크모드/반응형 등)이라 기본 렌더링 상태를
// 알 수 없으므로 통째로 건너뛴다 — 오탐(다크모드 색상을 기본값으로 오인)을 막기 위한
// 의도적 단순화. 콤비네이터(공백/>/+/~)나 의사클래스/속성 선택자가 있는 규칙도
// 매칭 정확도를 보장할 수 없어 스킵한다.

export interface CssRule {
  selector: string;
  declarations: Record<string, string>;
  order: number;
}

export interface ParsedCss {
  rules: CssRule[];
  rootVars: Record<string, string>;
}

const DECL_KEYS = ["color", "background-color", "background", "font-size", "font-weight"];

function parseDeclBody(body: string, keyFilter?: string[]): Record<string, string> {
  const decls: Record<string, string> = {};
  for (const pair of body.split(";")) {
    const idx = pair.indexOf(":");
    if (idx === -1) continue;
    const prop = pair.slice(0, idx).trim().toLowerCase();
    const val = pair.slice(idx + 1).trim();
    if (!prop || !val) continue;
    if (!keyFilter || prop.startsWith("--") || keyFilter.includes(prop)) decls[prop] = val;
  }
  return decls;
}

export interface CssBlock {
  header: string;
  body: string;
}

// 주석/@import/@charset 제거 후 중괄호 깊이를 세어 최상위 블록(헤더+본문)만 뽑아낸다.
// at-rule(@media 등) 내부는 조건부 스타일(다크모드/반응형 등)이라 기본 렌더링 상태를 알 수
// 없으므로 통째로 건너뛴다 — 오탐(다크모드 색상을 기본값으로 오인)을 막기 위한 의도적 단순화.
// @import/@charset처럼 블록({}) 없이 세미콜론으로 끝나는 at-rule은 먼저 제거해야 함 —
// 그대로 두면 다음 규칙의 헤더(예: ":root")까지 통째로 섞여 매칭이 깨진다(중괄호 스캔 기준이라
// "{" 없는 문장은 다음 "{"까지 전부 헤더로 흡수돼버림). google fonts @import의 URL에는
// "Inter:wght@400;500;600..."처럼 세미콜론이 포함될 수 있어, 따옴표 안은 통째로 건너뛰고
// 따옴표 밖의 첫 ";"에서만 끊어야 한다.
export function scanCssBlocks(css: string): CssBlock[] {
  const cleaned = css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@import\s+(?:"[^"]*"|'[^']*'|[^;])*;/gi, "")
    .replace(/@charset\s+(?:"[^"]*"|'[^']*'|[^;])*;/gi, "");
  const blocks: CssBlock[] = [];
  let i = 0;
  const n = cleaned.length;

  while (i < n) {
    const braceIdx = cleaned.indexOf("{", i);
    if (braceIdx === -1) break;
    const header = cleaned.slice(i, braceIdx).trim();

    let depth = 1;
    let j = braceIdx + 1;
    while (j < n && depth > 0) {
      if (cleaned[j] === "{") depth++;
      else if (cleaned[j] === "}") depth--;
      j++;
    }
    const body = cleaned.slice(braceIdx + 1, j - 1);
    i = j;

    if (!header || header.startsWith("@")) continue; // at-rule 내부는 통째로 스킵
    blocks.push({ header, body });
  }

  return blocks;
}

export function parseCss(css: string): ParsedCss {
  const rules: CssRule[] = [];
  const rootVars: Record<string, string> = {};
  let order = 0;

  for (const { header, body } of scanCssBlocks(css)) {
    const decls = parseDeclBody(body, DECL_KEYS);
    if (Object.keys(decls).length === 0) continue;

    for (const rawSelector of header.split(",")) {
      const selector = rawSelector.trim();
      if (!selector) continue;
      if (selector === ":root" || selector === "html:root") {
        for (const [k, v] of Object.entries(decls)) {
          if (k.startsWith("--")) rootVars[k] = v;
        }
        continue;
      }
      // 콤비네이터/의사클래스/속성선택자가 있으면 매칭하지 않음(정확히 매칭 못 할 바에야 스킵)
      if (/[\s>+~:[\]]/.test(selector)) continue;
      rules.push({ selector, declarations: decls, order: order++ });
    }
  }

  return { rules, rootVars };
}

// :focus 계열(:focus, :focus-visible, :focus-within) 선택자를 포함하는 규칙만 뽑아 outline/대체
// 포커스 스타일 선언을 그대로 반환 — parseCss()의 "단순 선택자만" 제약과 무관하게 셀렉터 텍스트에
// ":focus"가 있는지만 substring으로 판별(매칭 대상이 DOM 요소가 아니라 CSS 텍스트 자체이므로
// 콤비네이터가 섞여 있어도 상관없음).
export function findFocusRuleDeclarations(css: string): { selector: string; declarations: Record<string, string> }[] {
  const out: { selector: string; declarations: Record<string, string> }[] = [];
  for (const { header, body } of scanCssBlocks(css)) {
    if (!/:focus(-visible|-within)?\b/i.test(header)) continue;
    const decls = parseDeclBody(body);
    if (Object.keys(decls).length === 0) continue;
    out.push({ selector: header, declarations: decls });
  }
  return out;
}

export interface SimpleSelector {
  tag: string | null;
  classes: string[];
  id: string | null;
  specificity: number;
}

const selectorCache = new Map<string, SimpleSelector | null>();

// 지원 형태: "*", "div", ".foo", "#bar", "div.foo.bar", "a#baz" 등 콤비네이터 없는 조합만.
export function parseSimpleSelector(selector: string): SimpleSelector | null {
  const cached = selectorCache.get(selector);
  if (cached !== undefined) return cached;

  if (selector === "*") {
    const result: SimpleSelector = { tag: null, classes: [], id: null, specificity: 0 };
    selectorCache.set(selector, result);
    return result;
  }

  const tokenRe = /([a-zA-Z][\w-]*)|(\.[a-zA-Z_-][\w-]*)|(#[a-zA-Z_-][\w-]*)/g;
  const matches = selector.match(tokenRe);
  if (!matches || matches.join("") !== selector) {
    selectorCache.set(selector, null);
    return null;
  }

  let tag: string | null = null;
  let id: string | null = null;
  const classes: string[] = [];
  for (const m of matches) {
    if (m.startsWith(".")) classes.push(m.slice(1));
    else if (m.startsWith("#")) id = m.slice(1);
    else tag = m.toLowerCase();
  }
  const specificity = (id ? 100 : 0) + classes.length * 10 + (tag ? 1 : 0);
  const result: SimpleSelector = { tag, classes, id, specificity };
  selectorCache.set(selector, result);
  return result;
}

export function matchesSelector(
  sel: SimpleSelector,
  tagName: string,
  classList: string[],
  elId: string | undefined
): boolean {
  if (sel.tag && sel.tag !== tagName.toLowerCase()) return false;
  if (sel.id && sel.id !== elId) return false;
  if (sel.classes.length > 0 && !sel.classes.every((c) => classList.includes(c))) return false;
  return true;
}

// var(--name, fallback) 재귀 치환. 순환 참조/과도한 중첩에 대비해 깊이 제한을 둠.
export function resolveVar(value: string, vars: Record<string, string>, depth = 0): string {
  if (depth > 5) return value;
  const varRe = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/;
  const match = value.match(varRe);
  if (!match) return value;
  const [full, name, fallback] = match;
  const resolvedInner = resolveVar((vars[name] ?? fallback ?? "").trim(), vars, depth + 1);
  const next = value.replace(full, resolvedInner);
  return resolveVar(next, vars, depth + 1);
}

// 값(예: "1px solid var(--border) / #fff no-repeat")을 괄호 안 공백은 무시하고 토큰으로 분리.
export function splitCssValueTokens(value: string): string[] {
  const tokens: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === " " && depth === 0) {
      if (current) tokens.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}
