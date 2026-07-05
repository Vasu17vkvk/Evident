import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  User, Mail, Shield, Bell, Trash2,
  CreditCard, Check, ChevronRight, Eye, EyeOff, Lock
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "../layout/Container";
import { Section } from "../layout/Section";
import { FadeIn } from "../layout/FadeIn";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "../../context/AuthContext";

const TABS = ["Profile", "Security", "Notifications", "Billing"] as const;
type Tab = typeof TABS[number];

const PLAN_FEATURES = {
  Starter: ["3 documents", "10 MB per file", "50 questions / month"],
  Professional: ["Unlimited documents", "100 MB per file", "Unlimited queries", "API access"],
  Enterprise: ["Custom limits", "Dedicated index", "Full API access", "SLA guarantee"],
};

export function Account() {
  const { user, isAuthenticated } = useAuth();
  const { updateName } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("Profile");

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    weeklyDigest: true,
    newFeatures: false,
    securityAlerts: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate("/signin");
  }, [isAuthenticated, navigate]);

  // Initialize display name from user
  useEffect(() => {
    if (user) setDisplayName(user.name);
  }, [user]);

  if (!user) return null;

  const simulateSave = (msg: string) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(msg);
    }, 800);
  };

  return (
    <Section className="relative overflow-hidden pt-28 pb-20 md:pt-32 md:pb-28">
      <div className="pointer-events-none absolute -top-40 right-0 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[120px]" />

      <Container className="relative max-w-5xl">
        {/* Page Header */}
        <FadeIn className="mb-10">
          <p className="font-mono-label mb-2 text-[10px] uppercase tracking-widest text-accent">
            Account Settings
          </p>
          <h1 className="text-3xl font-semibold tracking-tighter text-foreground md:text-4xl">
            My Account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your profile, security, and subscription preferences.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left Sidebar — Tabs */}
          <FadeIn className="lg:col-span-3">
            {/* User Card */}
            <div className="mb-6 border border-border p-4 flex items-center gap-3 bg-input/10">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                {user.initials}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="font-mono-label text-[9px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex flex-col border border-border">
              {TABS.map((tab, i) => {
                const icons = [User, Lock, Bell, CreditCard];
                const Icon = icons[i];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-3 px-4 py-3 text-xs transition-colors duration-150 ${
                      i !== TABS.length - 1 ? "border-b border-border" : ""
                    } ${
                      activeTab === tab
                        ? "bg-accent/10 text-accent border-l-2 border-l-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    }`}
                  >
                    <Icon className="size-3.5 shrink-0" strokeWidth={1.5} />
                    {tab}
                    {activeTab === tab && (
                      <ChevronRight className="ml-auto size-3" strokeWidth={1.5} />
                    )}
                  </button>
                );
              })}
            </nav>
          </FadeIn>

          {/* Right Content Panel */}
          <FadeIn key={activeTab} delay={0.05} className="lg:col-span-9">
            <div className="border border-border">
              {/* Panel Header */}
              <div className="border-b border-border px-6 py-5">
                <h2 className="text-base font-semibold tracking-tight text-foreground">{activeTab}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeTab === "Profile" && "Update your personal information."}
                  {activeTab === "Security" && "Manage your password and account security."}
                  {activeTab === "Notifications" && "Control what emails and alerts you receive."}
                  {activeTab === "Billing" && "Your current plan and billing information."}
                </p>
              </div>

              {/* Panel Body */}
              <div className="p-6">
                {/* === Profile Tab === */}
                {activeTab === "Profile" && (
                  <div className="flex flex-col gap-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-5">
                      <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
                        {user.initials}
                      </span>
                      <div>
                        <p className="text-xs font-medium text-foreground mb-1">Profile Picture</p>
                        <p className="text-[10px] text-muted-foreground mb-2">
                          Avatar is auto-generated from your name initials.
                        </p>
                        <button className="font-mono-label text-[9px] uppercase tracking-widest text-accent border border-accent/30 px-3 py-1.5 hover:bg-accent/10 transition-colors">
                          Change Avatar
                        </button>
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Fields */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Display Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.5} />
                          <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="h-11 pl-9 bg-input/30 border-border focus-visible:border-accent"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.5} />
                          <Input
                            value={user.email}
                            readOnly
                            className="h-11 pl-9 bg-muted/20 border-border text-muted-foreground cursor-not-allowed"
                          />
                        </div>
                        <p className="text-[9px] font-mono-label text-muted-foreground/60">Email cannot be changed.</p>
                      </div>
                    </div>

                    <div className="flex justify-end border-t border-border pt-5">
                      <button
                        onClick={() => {
                          if (!displayName.trim()) {
                            toast.error("Display name cannot be empty");
                            return;
                          }
                          updateName(displayName);
                          simulateSave("Profile updated successfully!");
                        }}
                        disabled={isSaving}
                        className="font-mono-label text-[10px] uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/80 px-5 py-2.5 transition-colors disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}

                {/* === Security Tab === */}
                {activeTab === "Security" && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground mb-4">Change Password</h3>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">New Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.5} />
                            <Input
                              type={showNewPwd ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="h-11 pl-9 pr-10 bg-input/30 border-border focus-visible:border-accent"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPwd(!showNewPwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                            >
                              {showNewPwd ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Confirm New Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.5} />
                            <Input
                              type={showConfirmPwd ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`h-11 pl-9 pr-10 bg-input/30 border-border focus-visible:border-accent ${
                                confirmPassword && newPassword !== confirmPassword ? "border-destructive" : ""
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                            >
                              {showConfirmPwd ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
                            </button>
                          </div>
                          {confirmPassword && newPassword !== confirmPassword && (
                            <p className="font-mono-label text-[9px] text-destructive">Passwords do not match</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-border" />

                    {/* Security badges */}
                    <div className="flex flex-col gap-3">
                      <h3 className="text-xs font-semibold text-foreground mb-1">Security Status</h3>
                      {[
                        { label: "AES-256 Document Encryption", status: true },
                        { label: "TLS 1.3 In-transit Encryption", status: true },
                        { label: "Two-Factor Authentication", status: false },
                      ].map(({ label, status }) => (
                        <div key={label} className="flex items-center justify-between border border-border/60 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Shield className={`size-4 ${status ? "text-accent" : "text-muted-foreground/50"}`} strokeWidth={1.5} />
                            <span className="text-xs text-muted-foreground">{label}</span>
                          </div>
                          <span className={`font-mono-label text-[9px] uppercase tracking-wider ${status ? "text-accent" : "text-muted-foreground/40"}`}>
                            {status ? "Active" : "Inactive"}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end border-t border-border pt-5">
                      <button
                        onClick={() => {
                          if (!newPassword) { toast.error("Enter a new password first"); return; }
                          if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
                          simulateSave("Password updated successfully!");
                          setNewPassword(""); setConfirmPassword("");
                        }}
                        disabled={isSaving}
                        className="font-mono-label text-[10px] uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/80 px-5 py-2.5 transition-colors disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Update Password"}
                      </button>
                    </div>
                  </div>
                )}

                {/* === Notifications Tab === */}
                {activeTab === "Notifications" && (
                  <div className="flex flex-col gap-5">
                    {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, value]) => {
                      const labels: Record<keyof typeof notifications, { title: string; desc: string }> = {
                        emailUpdates: { title: "Product Email Updates", desc: "Receive emails about product changes and announcements." },
                        weeklyDigest: { title: "Weekly Usage Digest", desc: "A summary of your document activity sent every Monday." },
                        newFeatures: { title: "New Feature Announcements", desc: "Be the first to know when new capabilities launch." },
                        securityAlerts: { title: "Security Alerts", desc: "Immediate notifications for suspicious activity or logins." },
                      };
                      return (
                        <div key={key} className="flex items-start justify-between border border-border/60 p-4 gap-6">
                          <div>
                            <p className="text-xs font-semibold text-foreground">{labels[key].title}</p>
                            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{labels[key].desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                            className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${
                              value ? "bg-accent" : "bg-muted"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 translate-y-0.5 transform rounded-full bg-white shadow-sm transition duration-200 ${
                                value ? "translate-x-4" : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}

                    <div className="flex justify-end border-t border-border pt-5">
                      <button
                        onClick={() => simulateSave("Notification preferences saved!")}
                        disabled={isSaving}
                        className="font-mono-label text-[10px] uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/80 px-5 py-2.5 transition-colors disabled:opacity-60"
                      >
                        {isSaving ? "Saving..." : "Save Preferences"}
                      </button>
                    </div>
                  </div>
                )}

                {/* === Billing Tab === */}
                {activeTab === "Billing" && (
                  <div className="flex flex-col gap-6">
                    {/* Current Plan */}
                    <div className="border border-accent/30 bg-accent/5 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-mono-label text-[9px] uppercase tracking-widest text-accent mb-1">Current Plan</p>
                          <p className="text-xl font-bold tracking-tight text-foreground">Starter</p>
                        </div>
                        <span className="font-mono-label text-[9px] uppercase tracking-widest border border-accent/40 bg-accent/10 px-2 py-1 text-accent">
                          Free
                        </span>
                      </div>
                      <ul className="flex flex-col gap-1.5">
                        {PLAN_FEATURES.Starter.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="size-3 text-accent shrink-0" strokeWidth={2.5} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Upgrade CTA */}
                    <div className="border border-border p-5">
                      <p className="text-sm font-semibold text-foreground mb-1">Upgrade to Professional</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Unlock unlimited documents, 100 MB file support, and full API access starting at $19/month.
                      </p>
                      <ul className="mb-5 flex flex-col gap-1.5">
                        {PLAN_FEATURES.Professional.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="size-3 text-accent shrink-0" strokeWidth={2.5} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => navigate("/pricing")}
                        className="font-mono-label text-[10px] uppercase tracking-widest bg-accent text-accent-foreground hover:bg-accent/80 px-5 py-2.5 transition-colors"
                      >
                        View Pricing Plans
                      </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="border border-destructive/30 bg-destructive/5 p-5">
                      <div className="flex items-start gap-3">
                        <Trash2 className="size-4 text-destructive shrink-0 mt-0.5" strokeWidth={1.5} />
                        <div>
                          <p className="text-xs font-semibold text-foreground mb-1">Delete Account</p>
                          <p className="text-[10px] leading-relaxed text-muted-foreground mb-3">
                            Permanently remove your account, all documents, and associated data. This action cannot be undone.
                          </p>
                          <button
                            onClick={() => toast.error("Contact support to delete your account.")}
                            className="font-mono-label text-[9px] uppercase tracking-widest border border-destructive/40 text-destructive hover:bg-destructive/10 px-4 py-2 transition-colors"
                          >
                            Request Account Deletion
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </Container>
    </Section>
  );
}
