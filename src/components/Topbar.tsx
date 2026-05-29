import { Bell, Command, Search, Sparkles, Plug2 } from "lucide-react";
import { useEffect, useState } from "react";
import { LiveDot } from "./Delta";

export function Topbar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <header className="h-14 hairline-b flex items-center gap-4 px-5 bg-[oklch(0.17_0.013_260/0.6)] backdrop-blur-xl sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-full bg-[oklch(0.78_0.18_152/0.12)] px-2.5 py-1 text-[11px] font-medium text-bull">
          <LiveDot />
          Market Open
        </div>
        <div className="text-xs text-muted-foreground num">{date} · {time} ET</div>
      </div>

      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search symbols, news, indicators…"
            className="w-full h-9 pl-9 pr-16 rounded-lg bg-surface-1 hairline text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted-foreground hairline">
            <Command className="h-3 w-3" /> K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="hidden md:inline-flex items-center gap-2 rounded-lg hairline bg-surface-1 px-3 h-9 text-xs hover:bg-surface-2 transition">
          <Plug2 className="h-3.5 w-3.5 text-bull" />
          <span>IBKR Connected</span>
          <LiveDot />
        </button>
        <button className="inline-flex items-center gap-2 rounded-lg gradient-primary text-background px-3 h-9 text-xs font-semibold glow-primary">
          <Sparkles className="h-3.5 w-3.5" />
          AI Copilot
        </button>
        <button className="relative h-9 w-9 grid place-items-center rounded-lg hairline bg-surface-1 hover:bg-surface-2">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-bear glow-bear" />
        </button>
        <div className="h-9 w-9 rounded-full gradient-primary grid place-items-center text-[11px] font-bold text-background">
          AK
        </div>
      </div>
    </header>
  );
}
