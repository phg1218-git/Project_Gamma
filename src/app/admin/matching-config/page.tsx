"use client";

import { useEffect, useState } from "react";

interface Config {
  filterSmoker: boolean;
  filterDrinker: boolean;
  filterReligion: boolean;
  filterDistance: boolean;
  updatedAt: string;
}

const FILTERS: { key: keyof Omit<Config, "updatedAt">; label: string; description: string }[] = [
  {
    key: "filterSmoker",
    label: "흡연자 필터",
    description: "ON 시 흡연자(가끔·자주)를 비흡연 선호 유저의 매칭에서 제외합니다.",
  },
  {
    key: "filterDrinker",
    label: "과음자 필터",
    description: "ON 시 음주를 자주 하는 유저를 과음 기피 유저의 매칭에서 제외합니다.",
  },
  {
    key: "filterReligion",
    label: "종교차이 필터",
    description: "ON 시 종교가 다른 경우 종교차이 기피 유저의 매칭에서 제외합니다.",
  },
  {
    key: "filterDistance",
    label: "장거리 필터",
    description: "ON 시 거주 시/도가 다른 경우 장거리 기피 유저의 매칭에서 제외합니다.",
  },
];

export default function MatchingConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    fetch("/api/admin/matching-config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setError("설정을 불러올 수 없습니다."));
  }, []);

  async function handleToggle(key: keyof Omit<Config, "updatedAt">) {
    if (!config || saving) return;
    const newValue = !config[key];
    setSaving(key);
    setError("");

    // 낙관적 업데이트
    setConfig((prev) => prev ? { ...prev, [key]: newValue } : prev);

    try {
      const res = await fetch("/api/admin/matching-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) throw new Error();
      const updated: Config = await res.json();
      setConfig(updated);
      setLastSaved(new Date().toLocaleTimeString("ko-KR"));
    } catch {
      // 롤백
      setConfig((prev) => prev ? { ...prev, [key]: !newValue } : prev);
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">매칭 필터 설정</h1>
        <p className="mt-1 text-sm text-slate-500">
          하드필터를 끄면 유저 개인 설정과 무관하게 해당 조건이 매칭에서 무시됩니다.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!config ? (
        <div className="text-sm text-slate-400">불러오는 중...</div>
      ) : (
        <>
          <div className="space-y-3">
            {FILTERS.map(({ key, label, description }) => {
              const isOn = config[key];
              const isSaving = saving === key;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-5 py-4"
                >
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-slate-900 text-sm">{label}</span>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isOn
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isOn ? "활성" : "비활성"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{description}</p>
                  </div>

                  {/* Toggle switch */}
                  <button
                    onClick={() => handleToggle(key)}
                    disabled={!!saving}
                    aria-label={`${label} ${isOn ? "끄기" : "켜기"}`}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-60 ${
                      isOn ? "bg-green-500" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                        isOn ? "translate-x-5" : "translate-x-0"
                      } ${isSaving ? "opacity-60" : ""}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {lastSaved
              ? `마지막 저장: ${lastSaved}`
              : `마지막 수정: ${new Date(config.updatedAt).toLocaleString("ko-KR")}`}
          </div>

          <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ 주의사항</p>
            <p className="text-xs text-amber-600">
              필터를 끄면 해당 조건을 기피 조건으로 설정한 유저에게도 매칭이 발생합니다.
              변경 사항은 다음 매칭 계산 시점부터 적용됩니다.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
