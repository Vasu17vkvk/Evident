import { useNavigate } from "react-router";
import { ArrowLeft, MessageSquare, Quote, Zap, BarChart2, TrendingUp, Calendar } from "lucide-react";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";

interface Props {
  type: "queries" | "citations" | "performance";
}

export function AnalyticsPage({ type }: Props) {
  const navigate = useNavigate();

  const config = {
    queries: {
      title: "Queries Analytics",
      description: "Analyze search trends and prompt history over time.",
      icon: MessageSquare,
      statLabel: "Total Prompts Asked",
      statValue: "284",
      statChange: "+12.4% this week",
    },
    citations: {
      title: "Citations Generated",
      description: "Track how often source material is cited in response answers.",
      icon: Quote,
      statLabel: "Total Citations Copies",
      statValue: "1,492",
      statChange: "+8.1% this week",
    },
    performance: {
      title: "Response Performance",
      description: "Gemini model latency metrics and query times.",
      icon: Zap,
      statLabel: "Average Answer Speed",
      statValue: "1.8s",
      statChange: "-120ms improvement",
    },
  }[type];

  return (
    <WorkspaceShell activeId="dashboard" showDocSearch={false}>
      <div className="relative min-h-[calc(100vh-72px)] p-6 md:p-8 bg-background">
        <div className="pointer-events-none absolute -top-40 left-0 h-[400px] w-[400px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />

        <div className="mx-auto max-w-4xl">
          {/* Back button */}
          <FadeIn className="mb-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-[#ff3d00] transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </button>
          </FadeIn>

          {/* Header */}
          <FadeIn className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center border border-[#ff3d00]/30 bg-[#ff3d00]/10 rounded-sm">
                <config.icon className="size-5 text-[#ff3d00]" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tighter text-foreground md:text-3xl">
                  {config.title}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-3 mb-8">
            <StaggerItem>
              <div className="border border-border bg-[#0f0f0f]/40 p-5 rounded-sm">
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2">
                  {config.statLabel}
                </p>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  {config.statValue}
                </p>
                <p className="mt-2 font-mono text-[9px] text-[#ff3d00]">{config.statChange}</p>
              </div>
            </StaggerItem>
            
            <StaggerItem>
              <div className="border border-border bg-[#0f0f0f]/40 p-5 rounded-sm">
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2">
                  Active Users
                </p>
                <p className="text-3xl font-bold tracking-tight text-foreground">
                  1
                </p>
                <p className="mt-2 font-mono text-[9px] text-muted-foreground/60">Single User Sandbox</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="border border-border bg-[#0f0f0f]/40 p-5 rounded-sm">
                <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider mb-2">
                  System Health
                </p>
                <p className="text-3xl font-bold tracking-tight text-emerald-500">
                  99.9%
                </p>
                <p className="mt-2 font-mono text-[9px] text-[#ff3d00]/70">All Systems Operational</p>
              </div>
            </StaggerItem>
          </Stagger>

          {/* Detailed Analytics Graph Mock */}
          <FadeIn className="border border-border bg-[#0f0f0f]/20 p-6 rounded-sm">
            <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="size-4 text-[#ff3d00]" />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Weekly Activity Trend</h2>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground font-mono text-[9px] uppercase tracking-wider">
                <Calendar className="size-3" />
                <span>Last 7 Days</span>
              </div>
            </div>

            {/* Visual mock chart bars */}
            <div className="flex h-48 items-end gap-3 pt-6 border-b border-border/40 pb-2">
              {[60, 45, 80, 55, 95, 70, 110].map((height, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div 
                    className="w-full bg-[#ff3d00]/20 hover:bg-[#ff3d00] transition-colors rounded-t-sm relative"
                    style={{ height: `${(height / 120) * 100}%` }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#0a0a0a] border border-border text-[8px] font-mono text-foreground px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {height} pts
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-muted-foreground">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span>Activity is trending up by <span className="text-emerald-500 font-bold">18.4%</span> compared to the previous week.</span>
            </div>
          </FadeIn>
        </div>
      </div>
    </WorkspaceShell>
  );
}
