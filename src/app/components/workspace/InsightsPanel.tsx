import { useState, useRef, useEffect } from "react";
import {
  BarChart3,
  X,
  FileText,
  Target,
  Hash,
  Sparkles,
  Users,
  Building2,
  TrendingUp,
  DollarSign,
  Zap,
  Calendar,
  Check,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { useDocument } from "../../hooks/useDocument";
import { DocumentInsights } from "../../types/document";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
}

const TABS = [
  "Summary",
  "Facts",
  "Entities",
  "Timeline",
  "Metrics",
] as const;

type TabName = typeof TABS[number];



const CHART_CONFIG = {
  value: { label: "Count", color: "#ff3d00" },
} satisfies any;

// ------------------------------
// Reusable Components
// ------------------------------

function SummarySection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-6 items-center justify-center rounded-sm bg-[#ff3d00]/10">
          <Icon className="size-3 text-[#ff3d00]" strokeWidth={1.5} />
        </div>
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </span>
      <Badge
        variant="outline"
        className="w-fit bg-secondary border-border text-foreground text-[11px]"
      >
        {value}
      </Badge>
    </div>
  );
}

const ICON_MAP: Record<string, any> = {
  DollarSign,
  Users,
  Zap,
  Building2,
  TrendingUp,
  Check,
  Calendar,
  Sparkles,
  FileText
};

// Use type any for simplicity in mock maps
function FactItem({ fact }: { fact: any }) {
  const Icon = typeof fact.icon === "string" ? (ICON_MAP[fact.icon] || Sparkles) : fact.icon;
  return (
    <Card className="p-3 bg-card border border-border rounded-sm mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center bg-secondary border border-border rounded-sm">
            <Icon className="size-3.5 text-[#ff3d00]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-foreground font-medium">{fact.label}</span>
            <span className="text-[10px] text-muted-foreground">{fact.change}</span>
          </div>
        </div>
        <div className="font-mono text-[13px] text-foreground">{fact.value}</div>
      </div>
    </Card>
  );
}

function EntityItem({ entity, type }: { entity: any; type: string }) {
  return (
    <Card className="p-3 bg-card border border-border rounded-sm mb-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[11px] text-foreground font-medium">{entity.name}</span>
          <span className="text-[10px] text-muted-foreground">{entity.role || entity.type}</span>
        </div>
        <Badge variant="outline" className="bg-secondary border border-border text-[#ff3d00] text-[10px]">
          {entity.mentions} mentions
        </Badge>
      </div>
    </Card>
  );
}

function TimelineItem({ item }: { item: DocumentInsights['timeline'][0] }) {
  return (
    <div className="flex gap-3 mb-5 pl-4 relative border-l border-border last:border-transparent">
      <div className="absolute left-[-5px] top-0 size-2 bg-[#ff3d00] rounded-full" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-mono text-[#ff3d00]">{item.date}</span>
          <Badge variant="outline" className="bg-secondary border border-border text-muted-foreground text-[9px]">
            p.{item.page}
          </Badge>
        </div>
        <span className="text-[11px] text-foreground font-medium">{item.title}</span>
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
      </div>
    </div>
  );
}

export function InsightsPanel({
  isOpen = false,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabName>("Summary");
  const scrollPositions = useRef<Record<string, number>>({});
  const contentRef = useRef<HTMLDivElement>(null);
  const { document } = useDocument();

  const insights = document?.insights || {
    executiveSummary: "",
    documentPurpose: "",
    keyTopics: [],
    readingTime: "0 min",
    tone: "",
    facts: [],
    entities: { people: [], organizations: [], locations: [] },
    timeline: [],
    statistics: [],
  };

  // Save scroll position when active tab changes
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        scrollPositions.current[activeTab] = contentRef.current.scrollTop;
      }
    };

    const currentContentRef = contentRef.current;
    if (currentContentRef) {
      currentContentRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentContentRef) {
        currentContentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [activeTab]);

  // Restore scroll position when tab changes
  useEffect(() => {
    if (contentRef.current) {
      const savedPosition = scrollPositions.current[activeTab] || 0;
      contentRef.current.scrollTop = savedPosition;
    }
  }, [activeTab]);

  return (
    <>
      {/* Panel */}
      <aside
        className={`
          flex flex-col h-full w-full
          border-l border-border bg-background
          transition-all duration-200 ease-in-out
          lg:shrink-0 lg:relative lg:h-full
          ${isOpen ? "lg:w-[360px] lg:opacity-100" : "lg:w-0 lg:opacity-0 lg:border-none lg:overflow-hidden"}
        `}
      >
        {/* ── Panel header ────────────────────────── */}
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-3.5 text-[#ff3d00]" strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground">
              Insights
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-6 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* ── Tab navigation ────────────────────────── */}
        <div className="shrink-0 overflow-x-auto border-b border-border">
          <div className="flex min-w-max gap-1 px-4 py-3">
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  type="button"
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    relative px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em]
                    transition-all duration-200 ease-in-out
                    ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}
                  `}
                >
                  {tab}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff3d00] transition-all duration-200" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Panel content area ──────────────────── */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto"
        >
          {TABS.map((tab) => (
            <div
              key={tab}
              className={`
                px-5 py-4 transition-all duration-200 ease-in-out
                ${activeTab === tab ? "opacity-100 visible" : "opacity-0 invisible absolute inset-x-0"}
              `}
              style={{ display: activeTab === tab ? "block" : "none" }}
            >
              {tab === "Summary" ? (
                <>
                  {/* Executive Summary */}
                  <SummarySection title="Executive Summary" icon={FileText}>
                    <Card className="p-4 bg-card border border-border rounded-sm gap-3">
                      <p className="text-[11px] leading-relaxed text-foreground">
                        {insights.executiveSummary}
                      </p>
                    </Card>
                  </SummarySection>

                  {/* Document Purpose */}
                  <SummarySection title="Document Purpose" icon={Target}>
                    <Card className="p-4 bg-card border border-border rounded-sm gap-3">
                      <p className="text-[11px] leading-relaxed text-foreground">
                        {insights.documentPurpose}
                      </p>
                    </Card>
                  </SummarySection>

                  {/* Key Topics */}
                  <SummarySection title="Key Topics" icon={Hash}>
                    <Card className="p-4 bg-card border border-border rounded-sm gap-3">
                      <div className="flex flex-wrap gap-2">
                        {insights.keyTopics.map((topic, idx) => (
                          <Badge
                             key={idx}
                             variant="outline"
                             className="bg-secondary border-border text-foreground text-[10px]"
                          >
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  </SummarySection>

                  {/* Reading Stats */}
                  <SummarySection title="Document Stats" icon={Sparkles}>
                    <Card className="p-4 bg-card border border-border rounded-sm gap-3">
                      <div className="grid grid-cols-4 gap-3">
                        <SummaryStat
                          label="Reading Time"
                          value={document?.statistics?.readingTime ? `${document.statistics.readingTime} min` : (typeof insights.readingTime === 'string' ? insights.readingTime : '12 min')}
                        />
                        <SummaryStat
                          label="Word Count"
                          value={document?.statistics?.words ? document.statistics.words.toLocaleString() : (document?.wordCount ? document.wordCount.toLocaleString() : "2,500")}
                        />
                        <SummaryStat
                          label="Characters"
                          value={document?.statistics?.characters ? document.statistics.characters.toLocaleString() : "0"}
                        />
                        <SummaryStat
                          label="Pages"
                          value={document?.pages ? document.pages.toString() : "20"}
                        />
                        <SummaryStat
                          label="Paragraphs"
                          value={document?.statistics?.paragraphs ? document.statistics.paragraphs.toString() : "0"}
                        />
                        <SummaryStat
                          label="Sentences"
                          value={document?.statistics?.sentences ? document.statistics.sentences.toString() : "0"}
                        />
                        <SummaryStat
                          label="Avg Sentence"
                          value={document?.statistics?.averageSentenceLength ? `${document.statistics.averageSentenceLength} words` : "0 words"}
                        />
                        <SummaryStat
                          label="Headings"
                          value={document?.statistics?.headings ? document.statistics.headings.toString() : "0"}
                        />
                        <SummaryStat
                          label="Lists"
                          value={document?.statistics?.lists ? document.statistics.lists.toString() : "0"}
                        />
                        <SummaryStat
                          label="Tables"
                          value={document?.statistics?.tables ? document.statistics.tables.toString() : "0"}
                        />
                        <SummaryStat
                          label="Images"
                          value={document?.statistics?.images ? document.statistics.images.toString() : "0"}
                        />
                      </div>
                    </Card>
                  </SummarySection>
                </>
              ) : tab === "Facts" ? (
                  insights.facts.map((fact) => (
                    <FactItem key={fact.id} fact={fact} />
                  ))
                ) : tab === "Entities" ? (
                  <>
                    <SummarySection title="People" icon={Users}>
                      {insights.entities.people.map((person, idx) => (
                        <EntityItem key={idx} entity={person} type="person" />
                      ))}
                    </SummarySection>
                    <SummarySection title="Organizations" icon={Building2}>
                      {insights.entities.organizations.map((org, idx) => (
                        <EntityItem key={idx} entity={org} type="org" />
                      ))}
                    </SummarySection>
                    <SummarySection title="Locations" icon={Building2}>
                      {insights.entities.locations.map((loc, idx) => (
                        <EntityItem key={idx} entity={loc} type="loc" />
                      ))}
                    </SummarySection>
                  </>
                ) : tab === "Timeline" ? (
                  <div className="mt-1">
                    {insights.timeline.map((item, idx) => (
                      <TimelineItem key={idx} item={item} />
                    ))}
                  </div>
                ) : (
                  <>
                    <SummarySection title={document?.name.toLowerCase().includes("financial") ? "Quarterly Revenue" : "Document Metrics"} icon={TrendingUp}>
                      <Card className="p-4 bg-card border border-border rounded-sm">
                        <ChartContainer config={CHART_CONFIG} className="h-[200px]">
                          <BarChart data={insights.statistics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar 
                              dataKey="value" 
                              fill="#ff3d00" 
                              radius={[4, 4, 0, 0]} 
                            />
                          </BarChart>
                        </ChartContainer>
                      </Card>
                    </SummarySection>
                  </>
                )}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
