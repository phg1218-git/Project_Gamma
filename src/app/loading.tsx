import { Heart } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-romantic">
      <div className="text-center">
        <Heart className="heart-pulse mx-auto text-primary" size={56} fill="hsl(340, 82%, 62%)" strokeWidth={0} />
        <p className="mt-3 text-sm text-muted-foreground">불러오는 중...</p>
      </div>
    </main>
  );
}
