import { promises as dns } from "node:dns";
import type { LookupAddress, LookupOptions } from "node:dns";
import net from "node:net";
import { Agent } from "undici";

// Node.js 런타임 전용(dns/net 모듈 사용) — 이 파일을 import하는 API 라우트는
// runtime = "edge"를 설정하면 안 됨(생략 = 기본 Node 런타임).

export interface SafeFetchOk {
  ok: true;
  status: number;
  finalUrl: string;
  contentType: string | null;
  body: string;
  truncated: boolean;
  // 최종 응답의 헤더(중복 키는 fetch 표준대로 콤마로 합쳐짐 — set-cookie는 예외라 아래
  // setCookies로 별도 제공) — security-check 같은 헤더 기반 점검 도구가 사용.
  headers: Record<string, string>;
  setCookies: string[];
}

export type SafeFetchErrorReason =
  | "invalid_url"
  | "blocked_protocol"
  | "blocked_host"
  | "dns_error"
  | "timeout"
  | "too_large"
  | "too_many_redirects"
  | "network_error"
  | "http_error";

export interface SafeFetchErr {
  ok: false;
  reason: SafeFetchErrorReason;
  status?: number;
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  accept?: string;
}

const DEFAULT_TIMEOUT_MS = 7000;
const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_MAX_REDIRECTS = 3;
const USER_AGENT = "NexaLabSEOChecker/1.0 (+https://www.nexalab.app)";

// 사설/루프백/링크로컬/클라우드 메타데이터 등 서버 자신 또는 내부망을 가리킬 수 있는
// IPv4 대역. 169.254.0.0/16에는 클라우드 메타데이터 엔드포인트(169.254.169.254)도 포함됨.
const BLOCKED_IPV4_RANGES: { base: string; bits: number }[] = [
  { base: "0.0.0.0", bits: 8 },
  { base: "10.0.0.0", bits: 8 },
  { base: "100.64.0.0", bits: 10 }, // CGNAT
  { base: "127.0.0.0", bits: 8 },
  { base: "169.254.0.0", bits: 16 }, // link-local, 클라우드 메타데이터 포함
  { base: "172.16.0.0", bits: 12 },
  { base: "192.0.0.0", bits: 24 },
  { base: "192.0.2.0", bits: 24 }, // TEST-NET
  { base: "192.168.0.0", bits: 16 },
  { base: "198.18.0.0", bits: 15 },
  { base: "224.0.0.0", bits: 4 }, // multicast
  { base: "240.0.0.0", bits: 4 }, // reserved
];

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isBlockedIPv4(ip: string): boolean {
  const target = ipv4ToInt(ip);
  return BLOCKED_IPV4_RANGES.some(({ base, bits }) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (target & mask) === (ipv4ToInt(base) & mask);
  });
}

function isBlockedIPv6(ip: string): boolean {
  const norm = ip.toLowerCase();
  if (norm === "::1" || norm === "::") return true;
  if (norm.startsWith("fe80:")) return true; // link-local
  if (/^f[c-d][0-9a-f]{2}:/.test(norm)) return true; // fc00::/7 unique-local
  const v4mapped = norm.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mapped) return isBlockedIPv4(v4mapped[1]);
  return false;
}

export function isBlockedIP(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) return isBlockedIPv4(ip);
  if (version === 6) return isBlockedIPv6(ip);
  return true; // 파싱 불가한 값은 안전하게 차단
}

const BLOCKED_HOSTNAME_SUFFIXES = ["localhost", "internal", "local"];

function hasBlockedHostnameLiteral(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower === "metadata.google.internal") return true;
  return BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => lower === suffix || lower.endsWith(`.${suffix}`));
}

type HostValidation =
  | { ok: true; address: string; family: 4 | 6 }
  | { ok: false; reason: "blocked_host" | "dns_error" };

// DNS 조회 자체가 실패한 경우(오타/존재하지 않는 도메인)와 "IP가 사설/내부망으로 확인되어
// 의도적으로 차단"한 경우를 구분해서 반환한다 — 둘을 같은 에러로 합치면 사용자가 URL을
// 잘못 입력했을 뿐인데 "접근이 제한된 주소"라는 오해를 살 수 있다.
// 검증에 사용한 IP를 그대로 반환해서, 실제 연결(fetch)이 이 IP로 고정(pin)되도록 한다
// (DNS 리바인딩 방지 — 아래 pinnedLookup() 참고).
async function validateHost(hostname: string): Promise<HostValidation> {
  if (hasBlockedHostnameLiteral(hostname)) return { ok: false, reason: "blocked_host" };

  const literalVersion = net.isIP(hostname);
  if (literalVersion !== 0) {
    if (isBlockedIP(hostname)) return { ok: false, reason: "blocked_host" };
    return { ok: true, address: hostname, family: literalVersion as 4 | 6 };
  }

  try {
    const addrs = await dns.lookup(hostname, { all: true, verbatim: true });
    if (addrs.length === 0) return { ok: false, reason: "dns_error" };
    if (addrs.some((addr) => isBlockedIP(addr.address))) return { ok: false, reason: "blocked_host" };
    const [first] = addrs;
    return { ok: true, address: first.address, family: first.family as 4 | 6 };
  } catch {
    return { ok: false, reason: "dns_error" };
  }
}

type NodeLookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number
) => void;

// undici Agent의 connect.lookup에 주입하는 DNS 리졸버. 호스트명이 무엇이든 항상
// validateHost()가 이미 검증한 단일 IP만 반환해서, fetch()가 별도로 DNS를 재조회하며
// 생기는 시간차(TOCTOU) 동안 공격자가 응답을 사설/내부망 IP로 바꿔치기하는 DNS
// 리바인딩 공격을 원천적으로 차단한다.
function pinnedLookup(address: string, family: 4 | 6) {
  return (
    _hostname: string,
    optionsOrCallback: LookupOptions | NodeLookupCallback,
    maybeCallback?: NodeLookupCallback
  ): void => {
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : (maybeCallback as NodeLookupCallback);
    const wantsAll = typeof optionsOrCallback !== "function" && Boolean((optionsOrCallback as { all?: boolean }).all);
    if (wantsAll) {
      callback(null, [{ address, family }]);
    } else {
      callback(null, address, family);
    }
  };
}

async function readBodyCapped(
  res: Response,
  maxBytes: number
): Promise<{ body: string; truncated: boolean }> {
  const reader = res.body?.getReader();
  if (!reader) {
    const text = await res.text();
    return { body: text.slice(0, maxBytes), truncated: text.length > maxBytes };
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      truncated = true;
      await reader.cancel().catch(() => {});
      break;
    }
    chunks.push(value);
  }

  return { body: Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8"), truncated };
}

export async function safeFetch(
  rawUrl: string,
  opts: SafeFetchOptions = {}
): Promise<SafeFetchOk | SafeFetchErr> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = opts.maxRedirects ?? DEFAULT_MAX_REDIRECTS;

  let currentUrl: URL;
  try {
    currentUrl = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      if (currentUrl.protocol !== "http:" && currentUrl.protocol !== "https:") {
        return { ok: false, reason: "blocked_protocol" };
      }

      const hostValidation = await validateHost(currentUrl.hostname);
      if (!hostValidation.ok) {
        return { ok: false, reason: hostValidation.reason };
      }

      // fetch()가 별도로 DNS를 재조회하지 않도록, 방금 검증한 IP로 연결을 고정한다
      // (DNS 리바인딩/TOCTOU 방지 — pinnedLookup() 참고).
      const pinnedAgent = new Agent({
        connect: { lookup: pinnedLookup(hostValidation.address, hostValidation.family) },
      });

      let res: Response;
      try {
        res = await fetch(currentUrl.toString(), {
          redirect: "manual",
          signal: controller.signal,
          // Node 내장 fetch(undici 기반)는 dispatcher로 커스텀 Agent 주입을 지원함.
          dispatcher: pinnedAgent,
          headers: {
            "User-Agent": USER_AGENT,
            ...(opts.accept ? { Accept: opts.accept } : {}),
          },
        } as RequestInit);
      } catch (err) {
        await pinnedAgent.close().catch(() => {});
        if (err instanceof Error && err.name === "AbortError") {
          return { ok: false, reason: "timeout" };
        }
        return { ok: false, reason: "network_error" };
      }

      if (res.status >= 300 && res.status < 400) {
        await res.body?.cancel().catch(() => {});
        await pinnedAgent.close().catch(() => {});
        const location = res.headers.get("location");
        if (!location) {
          return { ok: false, reason: "http_error", status: res.status };
        }
        if (hop === maxRedirects) {
          return { ok: false, reason: "too_many_redirects" };
        }
        try {
          currentUrl = new URL(location, currentUrl);
        } catch {
          return { ok: false, reason: "invalid_url" };
        }
        continue;
      }

      if (!res.ok) {
        await pinnedAgent.close().catch(() => {});
        return { ok: false, reason: "http_error", status: res.status };
      }

      const { body, truncated } = await readBodyCapped(res, maxBytes);
      const headers = Object.fromEntries(res.headers.entries());
      const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
      await pinnedAgent.close().catch(() => {});
      return {
        ok: true,
        status: res.status,
        finalUrl: currentUrl.toString(),
        contentType: res.headers.get("content-type"),
        body,
        truncated,
        headers,
        setCookies,
      };
    }

    return { ok: false, reason: "too_many_redirects" };
  } finally {
    clearTimeout(timer);
  }
}
