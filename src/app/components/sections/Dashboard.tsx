import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  FileText, MessageSquare, Quote, TrendingUp,
  Upload, Clock, Zap, MoreHorizontal, ArrowRight
} from "lucide-react";
import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { useAuth } from "../../context/AuthContext";

const RECENT_DOCS = [
  { name: "Q4_Financial_Report.pdf", size: "4.2 MB", queries: 18, date: "Today, 2:34 PM" },
  { name: "Employment_Contract_2026.docx", size: "812 KB", queries: 7, date: "Today, 11:10 AM" },
  { name: "Legal_Terms_v3.pdf", size: "1.1 MB", queries: 34, date: "Yesterday, 6:45 PM" },
  { name: "Research_Paper_NLP.pdf", size: "3.7 MB", queries: 12, date: "Jul 3, 9:22 AM" },
];

const RECENT_ACTIVITY = [
  { icon: MessageSquare, action: "Asked 5 questions", doc: "Q4_Financial_Report.pdf", time: "10 min ago" },
  { icon: Upload, action: "Uploaded document", doc: "Employment_Contract_2026.docx", time: "1 hr ago" },
  { icon: Quote, action: "Copied citation", doc: "Legal_Terms_v3.pdf", time: "3 hr ago" },
  { icon: FileText, action: "Opened document", doc: "Research_Paper_NLP.pdf", time: "2 days ago" },
];

const STATS = [
  { label: "Documents Uploaded", value: "24", sub: "↑ 4 this week", icon: FileText },
  { label: "Total Queries", value: "312", sub: "↑ 28 this week", icon: MessageSquare },
  { label: "Citations Generated", value: "1,048", sub: "Across all documents", icon: Quote },
  { label: "Avg. Answer Speed", value: "1.8s", sub: "Faster than 94% of users", icon: Zap },
];

export function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate("/signin");
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <Section className="relative overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[120px]" />

      <Container className="relative">
        {/* Header */}
        <FadeIn className="mb-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono-label text-[10px] uppercase tracking-widest text-accent mb-2">
                Dashboard
              </p>
              <h1 className="text-3xl font-semibold tracking-tighter text-foreground md:text-4xl">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Here's what's happening across your documents.
              </p>
            </div>
            <button className="mt-4 sm:mt-0 self-start sm:self-end inline-flex items-center gap-2 border border-accent bg-accent/10 px-4 py-2.5 text-xs font-mono-label uppercase tracking-widest text-accent hover:bg-accent hover:text-accent-foreground transition-all duration-200">
              <Upload className="size-3.5" strokeWidth={1.5} />
              Upload Document
            </button>
          </div>
        </FadeIn>

        {/* Stats Grid */}
        <Stagger className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map(({ label, value, sub, icon: Icon }) => (
            <StaggerItem key={label}>
              <div className="group border border-border bg-input/10 p-5 hover:border-accent/40 hover:bg-input/20 transition-all duration-200">
                <div className="mb-3 flex items-center justify-between">
                  <Icon className="size-4 text-accent" strokeWidth={1.5} />
                  <TrendingUp className="size-3 text-muted-foreground/40" strokeWidth={1.5} />
                </div>
                <div className="text-2xl font-bold tracking-tighter text-foreground md:text-3xl">
                  {value}
                </div>
                <p className="mt-1 text-[10px] font-mono-label text-muted-foreground uppercase tracking-wider">
                  {label}
                </p>
                <p className="mt-2 text-[10px] text-accent/70">{sub}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Recent Documents */}
          <FadeIn className="lg:col-span-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Recent Documents</h2>
              <button className="font-mono-label text-[9px] uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors flex items-center gap-1">
                View all <ArrowRight className="size-3" />
              </button>
            </div>
            <div className="border border-border">
              {RECENT_DOCS.map((doc, i) => (
                <Link
                  key={doc.name}
                  to={`/workspace/${encodeURIComponent(doc.name.replace(/\.[^.]+$/, "").replace(/\s+/g, "-").toLowerCase())}`}
                  className={`group flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors ${
                    i !== RECENT_DOCS.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-input/40 group-hover:border-accent/40 transition-colors">
                      <FileText className="size-3.5 text-accent" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{doc.name}</p>
                      <p className="font-mono-label text-[9px] text-muted-foreground mt-0.5">
                        {doc.size} · {doc.queries} queries
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <p className="font-mono-label hidden text-[9px] text-muted-foreground sm:block">{doc.date}</p>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="size-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </FadeIn>

          {/* Recent Activity */}
          <FadeIn delay={0.1} className="lg:col-span-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Recent Activity</h2>
              <Clock className="size-3.5 text-muted-foreground/50" strokeWidth={1.5} />
            </div>
            <div className="border border-border">
              {RECENT_ACTIVITY.map(({ icon: Icon, action, doc, time }, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-4 px-5 py-4 ${
                    i !== RECENT_ACTIVITY.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="flex size-7 shrink-0 items-center justify-center border border-border bg-input/30 mt-0.5">
                    <Icon className="size-3 text-accent" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground">{action}</p>
                    <p className="font-mono-label mt-0.5 truncate text-[9px] text-muted-foreground">{doc}</p>
                    <p className="font-mono-label mt-1 text-[9px] text-muted-foreground/50">{time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 border border-border p-5 bg-input/10">
              <p className="font-mono-label mb-4 text-[9px] uppercase tracking-widest text-muted-foreground">
                Quick Actions
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Ask a question", path: "/" },
                  { label: "View Docs", path: "/docs" },
                  { label: "Upgrade Plan", path: "/pricing" },
                ].map(({ label, path }) => (
                  <Link
                    key={label}
                    to={path}
                    className="flex items-center justify-between border border-border/60 px-3 py-2 text-xs text-muted-foreground hover:border-accent/40 hover:text-foreground hover:bg-muted/30 transition-all duration-150"
                  >
                    {label}
                    <ArrowRight className="size-3" strokeWidth={1.5} />
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
