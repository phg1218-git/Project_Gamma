import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

async function updateSetting(formData: FormData) {
  "use server";
  const key = String(formData.get("key") ?? "");
  const value = String(formData.get("value") ?? "");
  if (!key) return;
  await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  const defaults = ["daily_like_limit", "min_match_score"];
  return <Card><CardHeader><CardTitle>운영 설정</CardTitle></CardHeader><CardContent className="space-y-4">{defaults.map((key)=>{
    const value = settings.find((s)=>s.key===key)?.value ?? "";
    return <form key={key} action={updateSetting} className="grid gap-2 rounded-xl border p-4 md:grid-cols-4"><input type="hidden" name="key" value={key} /><p className="text-sm font-medium md:col-span-1">{key}</p><Input name="value" defaultValue={value} className="md:col-span-2" /><Button type="submit">저장</Button></form>;
  })}</CardContent></Card>;
}
