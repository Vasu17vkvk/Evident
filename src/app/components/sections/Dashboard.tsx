import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  FileText, MessageSquare, Quote, TrendingUp,
  Upload, Clock, Zap, MoreHorizontal, ArrowRight, Sparkles
} from "lucide-react";
import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import {
  fetchDashboardStats,
  fetchDashboardRecentDocuments,
  fetchDashboardRecentActivity,
  type DashboardStats,
  type DashboardRecentDocument,
  type DashboardActivity
} from "../../../services/api/api";

const ACTIVITY_ICONS: Record<string, any> = {
  upload: Upload,
  open: FileText,
  chat: MessageSquare,
  citation_copy: Quote,
  insight: Sparkles,
};

export function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentDocs, setRecentDocs] = useState<DashboardRecentDocument[]>([]);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate("/signin");
  }, [isAuthenticated, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, docsData, activityData] = await Promise.all([
        fetchDashboardStats(),
        fetchDashboardRecentDocuments(),
        fetchDashboardRecentActivity(),
      ]);
      setStats(statsData);
      setRecentDocs(docsData);
      setActivities(activityData);
    } catch (e) {
      console.error("Failed to load dashboard statistics:", e);
      toast.error("Failed to load live analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  if (!user) return null;

  const statsConfig = [
    { label: "Documents Uploaded", value: stats?.documentsUploaded ?? 0, sub: "Across all folders", icon: FileText },
    { label: "Total Queries", value: stats?.totalQueries ?? 0, sub: "Asked by user", icon: MessageSquare },
    { label: "Citations Generated", value: stats?.citationsGenerated ?? 0, sub: "Across all documents", icon: Quote },
    { label: "Avg. Answer Speed", value: `${stats?.avgResponseTime ?? 1.8}s`, sub: "Gemini latency average", icon: Zap },
  ];

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffMs = now.getTime() - past.getTime();
      const diffMin = Math.round(diffMs / 60000);
      
      if (diffMin < 1) return "just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      
      const diffHrs = Math.round(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      
      const diffDays = Math.round(diffHrs / 24);
      if (diffDays === 1) return "yesterday";
      return `${diffDays} days ago`;
    } catch (e) {
      return "recently";
    }
  };

  return (
    <Section className="relative overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-0 h-[400px] w-[400px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />

      <Container className="relative">
        {/* Header */}
        <FadeIn className="mb-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] mb-2">
                Dashboard
              </p>
              <h1 className="text-3xl font-semibold tracking-tighter text-foreground md:text-4xl">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Here's what's happening across your documents.
              </p>
            </div>
            <button
              onClick={() => navigate("/documents")}
              className="mt-4 sm:mt-0 self-start sm:self-end inline-flex items-center gap-2 border border-[#ff3d00] bg-[#ff3d00]/10 px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-200 cursor-pointer rounded-sm"
            >
              <Upload className="size-3.5" strokeWidth={1.5} />
              Upload Document
            </button>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        {loading ? (
          <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse border border-border bg-[#0f0f0f]/40 p-5 rounded-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="size-4 bg-muted/20 rounded-full" />
                  <div className="size-3 bg-muted/10 rounded" />
                </div>
                <div className="h-8 w-16 bg-muted/20 rounded mb-2" />
                <div className="h-3 w-28 bg-muted/10 rounded mb-1" />
                <div className="h-3.5 w-20 bg-[#ff3d00]/10 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <Stagger className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statsConfig.map(({ label, value, sub, icon: Icon }) => (
              <StaggerItem key={label}>
                <div className="group border border-border bg-[#0f0f0f]/40 p-5 hover:border-[#ff3d00]/40 hover:bg-[#ff3d00]/[0.02] transition-all duration-200 rounded-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <Icon className="size-4 text-[#ff3d00]" strokeWidth={1.5} />
                    <TrendingUp className="size-3 text-muted-foreground/45" strokeWidth={1.5} />
                  </div>
                  <div className="text-2xl font-bold tracking-tighter text-foreground md:text-3xl">
                    {value}
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="mt-2 font-mono text-[9px] text-[#ff3d00]/70">{sub}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Recent Documents */}
          <FadeIn className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Recent Documents</h2>
              <button
                onClick={() => navigate("/documents")}
                className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground hover:text-[#ff3d00] transition-colors flex items-center gap-1 cursor-pointer"
              >
                View all <ArrowRight className="size-3" />
              </button>
            </div>
            
            {loading ? (
              <div className="border border-border divide-y divide-border rounded-sm overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 bg-[#0f0f0f]/20 animate-pulse">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="size-8 rounded border border-border bg-input/20" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-40 bg-muted/20 rounded" />
                        <div className="h-2.5 w-24 bg-muted/10 rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-16 bg-muted/10 rounded" />
                  </div>
                ))}
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border bg-[#0f0f0f]/10 p-12 text-center rounded-sm">
                <FileText className="size-8 text-muted-foreground/35 mb-4 animate-pulse" strokeWidth={1.5} />
                <h3 className="text-xs font-semibold text-foreground">No documents found</h3>
                <p className="mt-1 text-[11px] text-muted-foreground max-w-xs leading-relaxed mb-4">
                  Upload your first PDF, DOCX, or TXT document to start reasoning with RAG.
                </p>
                <button
                  onClick={() => navigate("/documents")}
                  className="font-mono text-[9px] uppercase tracking-widest border border-[#ff3d00]/40 text-[#ff3d00] hover:bg-[#ff3d00]/10 px-4 py-2 transition-all cursor-pointer rounded-sm"
                >
                  Upload File
                </button>
              </div>
            ) : (
              <div className="border border-border rounded-sm overflow-hidden">
                {recentDocs.map((doc, i) => (
                  <Link
                    key={doc.documentId}
                    to={`/workspace/${encodeURIComponent(doc.documentId)}`}
                    className={`group flex items-center justify-between px-5 py-4 hover:bg-[#ff3d00]/[0.01] transition-colors bg-[#0f0f0f]/20 ${
                      i !== recentDocs.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-[#0f0f0f]/40 group-hover:border-[#ff3d00]/40 transition-colors rounded-sm">
                        <FileText className="size-3.5 text-[#ff3d00]" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{doc.filename}</p>
                        <p className="font-mono text-[9px] text-muted-foreground mt-0.5">
                          {formatFileSize(doc.fileSize)} · {doc.queryCount} queries
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4">
                      <p className="font-mono text-[9px] hidden text-muted-foreground sm:block">
                        {doc.lastOpenedAt ? formatTimeAgo(doc.lastOpenedAt) : formatTimeAgo(doc.uploadDate)}
                      </p>
                      <button className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        <MoreHorizontal className="size-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </FadeIn>

          {/* Recent Activity */}
          <FadeIn delay={0.1} className="lg:col-span-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Recent Activity</h2>
              <Clock className="size-3.5 text-muted-foreground/50" strokeWidth={1.5} />
            </div>

            {loading ? (
              <div className="border border-border divide-y divide-border rounded-sm overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-4 px-5 py-4 bg-[#0f0f0f]/20 animate-pulse">
                    <div className="size-7 rounded border border-border bg-input/20 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 bg-muted/20 rounded" />
                      <div className="h-2.5 w-1/2 bg-muted/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border bg-[#0f0f0f]/10 p-12 text-center rounded-sm">
                <Clock className="size-8 text-muted-foreground/35 mb-4 animate-pulse" strokeWidth={1.5} />
                <h3 className="text-xs font-semibold text-foreground">No recent activity</h3>
                <p className="mt-1 text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                  Activities like uploads, queries, and citation copies will appear here.
                </p>
              </div>
            ) : (
              <div className="border border-border rounded-sm overflow-hidden">
                {activities.map((act, i) => {
                  const Icon = ACTIVITY_ICONS[act.type] || Clock;
                  return (
                    <div
                      key={act.activityId}
                      className={`flex items-start gap-4 px-5 py-4 bg-[#0f0f0f]/20 ${
                        i !== activities.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center border border-border bg-[#0a0a0a] mt-0.5 rounded-sm">
                        <Icon className="size-3 text-[#ff3d00]" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground">{act.action}</p>
                        {act.documentName && (
                          <p className="font-mono mt-0.5 truncate text-[9px] text-muted-foreground">{act.documentName}</p>
                        )}
                        <p className="font-mono mt-1 text-[8px] text-muted-foreground/50">{formatTimeAgo(act.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-6 border border-border p-5 bg-[#0f0f0f]/40 rounded-sm">
              <p className="font-mono mb-4 text-[9px] uppercase tracking-widest text-muted-foreground">
                Quick Actions
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Search inside documents", path: "/documents" },
                  { label: "View all notes", path: "/notes" },
                  { label: "Billing details", path: "/settings" },
                ].map(({ label, path }) => (
                  <Link
                    key={label}
                    to={path}
                    className="flex items-center justify-between border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:border-[#ff3d00]/40 hover:text-foreground hover:bg-[#ff3d00]/[0.01] transition-all duration-150 rounded-sm"
                  >
                    {label}
                    <ArrowRight className="size-3 text-muted-foreground/60 group-hover:text-[#ff3d00] transition-colors" strokeWidth={1.5} />
                  </Link>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
