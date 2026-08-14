type TargetLanguage = "zh-CN" | "en";

async function translate(value: string, target: TargetLanguage) {
  const source = target === "en" ? "zh-CN" : "en";
  const params = new URLSearchParams({ q: value, langpair: `${source}|${target}` });
  const response = await fetch(`https://api.mymemory.translated.net/get?${params.toString()}`);
  if (!response.ok) throw new Error(`翻译服务返回 ${response.status}`);
  const payload = await response.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
  if (payload.responseStatus !== 200) throw new Error("翻译服务暂时不可用");
  return payload.responseData?.translatedText?.replace(/\s+/g, " ").trim() || "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { texts?: unknown; target?: unknown };
    const target = body.target === "en" ? "en" : "zh-CN";
    const texts = Array.isArray(body.texts)
      ? body.texts.filter((value): value is string => typeof value === "string" && Boolean(value.trim())).slice(0, 8)
      : [];
    if (!texts.length) return Response.json({ translations: [] });
    const translations = await Promise.all(texts.map((value) => translate(value, target)));
    return Response.json({ translations });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "翻译失败" },
      { status: 502 },
    );
  }
}
