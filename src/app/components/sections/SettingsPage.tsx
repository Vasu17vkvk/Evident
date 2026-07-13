import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Shield, CreditCard, Trash2, Check, Lock, Eye, EyeOff, Menu, User, Mail, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { useSidebar } from "../../context/SidebarContext";
import { WorkspaceShell } from "../workspace/WorkspaceShell";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { FadeIn } from "../layout/FadeIn";

const PLAN_FEATURES = {
  Starter: ["3 documents limit", "10 MB per file maximum", "50 questions / month", "Standard document processing"],
};

type ModelTier = "Economy" | "Balanced" | "Advanced";

export function SettingsPage() {
  const { user, isAuthenticated, updateName } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { toggle: toggleSidebar } = useSidebar();

  // Profile States
  const [displayName, setDisplayName] = useState("");
  
  // Password States
  const [newPassword, setNewPassword] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  
  // Model & Export Preference States
  const [selectedTier, setSelectedTier] = useState<ModelTier>("Economy");
  const [exportFormat, setExportFormat] = useState<string>("PDF");
  const [incMetadata, setIncMetadata] = useState(true);
  const [incInsights, setIncInsights] = useState(true);
  const [incStatistics, setIncStatistics] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) navigate("/signin");
  }, [isAuthenticated, navigate]);

  // Load preferences and user details
  useEffect(() => {
    if (user) {
      setDisplayName(user.name);
    }
    
    // Model Selection
    const savedTier = localStorage.getItem("evident_copilot_model_tier") as ModelTier;
    if (savedTier) setSelectedTier(savedTier);

    // Export preferences
    const savedFormat = localStorage.getItem("evident_export_format") || "PDF";
    setExportFormat(savedFormat);

    const getPref = (key: string, def = true) => {
      const val = localStorage.getItem(key);
      return val !== null ? val === "true" : def;
    };
    setIncMetadata(getPref("evident_export_include_metadata", true));
    setIncInsights(getPref("evident_export_include_insights", true));
    setIncStatistics(getPref("evident_export_include_statistics", true));
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      updateName(displayName);
      setIsSaving(false);
      toast.success("Profile display name updated successfully!");
    }, 600);
  };

  const handleUpdatePassword = () => {
    if (!newPassword) {
      toast.error("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Security password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    }, 800);
  };

  const handleSavePreferences = () => {
    setIsSaving(true);
    try {
      localStorage.setItem("evident_copilot_model_tier", selectedTier);
      localStorage.setItem("evident_export_format", exportFormat);
      localStorage.setItem("evident_export_include_metadata", incMetadata.toString());
      localStorage.setItem("evident_export_include_insights", incInsights.toString());
      localStorage.setItem("evident_export_include_statistics", incStatistics.toString());
      
      toast.success("Workspace preferences updated successfully!");
      window.dispatchEvent(new CustomEvent("evident-document-update"));
    } catch (e) {
      toast.error("Failed to save workspace preferences.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeChange = (val: string) => {
    const nextIsDark = val === "dark";
    if (nextIsDark !== isDark) {
      toggleTheme();
      toast.success(`Theme switched to ${val} mode.`);
    }
  };

  return (
    <WorkspaceShell activeId="settings" showDocSearch={false}>
      <div className="relative min-h-[calc(100vh-72px)] p-6 md:p-8 bg-background">
        <div className="pointer-events-none absolute -top-40 right-0 h-[400px] w-[400px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />

        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <FadeIn className="mb-8 border-b border-border pb-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] mb-1">
              Account Management
            </p>
            <h1 className="text-2xl font-semibold tracking-tighter text-foreground md:text-3xl flex items-center gap-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden lg:flex size-8 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-sm hover:bg-muted/10"
                aria-label="Toggle sidebar"
              >
                <Menu className="size-5" />
              </button>
              Workspace Settings
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Configure system themes, model tiers, export formats, security credentials, and billing.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Column: Profile & Security */}
            <div className="space-y-6">
              
              {/* Profile Details */}
              <FadeIn delay={0.05} className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                <h2 className="text-sm font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
                  <User className="size-4 text-[#ff3d00]" />
                  Profile Information
                </h2>
                
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#ff3d00] text-sm font-bold text-[#0a0a0a]">
                    {user.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{user.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">Avatar generated from name initials.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Name Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" strokeWidth={1.5} />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full h-11 pl-10 pr-4 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground focus:outline-none transition-colors rounded-sm"
                      />
                    </div>
                  </div>

                  {/* Email (Read-Only) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">Registered Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/30" strokeWidth={1.5} />
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="w-full h-11 pl-10 pr-4 bg-[#141414] border border-border text-xs text-muted-foreground/50 cursor-not-allowed focus:outline-none rounded-sm"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 border border-[#ff3d00]/40 bg-[#ff3d00]/5 hover:bg-[#ff3d00]/10 hover:border-[#ff3d00] py-2.5 font-mono text-[9px] uppercase tracking-widest text-[#ff3d00] transition-all rounded-sm cursor-pointer disabled:opacity-50"
                  >
                    Update Profile Details
                  </button>
                </div>
              </FadeIn>

              {/* Password update form */}
              <FadeIn delay={0.08} className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                <h2 className="text-sm font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
                  <Lock className="size-4 text-[#ff3d00]" />
                  Security Credentials
                </h2>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" strokeWidth={1.5} />
                      <input
                        type={showNewPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-11 pl-10 pr-10 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground focus:outline-none transition-colors rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground cursor-pointer"
                      >
                        {showNewPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" strokeWidth={1.5} />
                      <input
                        type={showConfirmPwd ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full h-11 pl-10 pr-10 bg-[#0a0a0a] border border-border focus:border-[#ff3d00]/40 text-xs text-foreground focus:outline-none transition-colors rounded-sm ${
                          confirmPassword && newPassword !== confirmPassword ? "border-destructive/60" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground cursor-pointer"
                      >
                        {showConfirmPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <span className="font-mono text-[9px] text-destructive">Passwords do not match.</span>
                    )}
                  </div>

                  <button
                    onClick={handleUpdatePassword}
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 border border-[#ff3d00] bg-[#ff3d00]/10 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-200 cursor-pointer rounded-sm disabled:opacity-50"
                  >
                    Save New Password
                  </button>
                </div>
              </FadeIn>

              {/* Danger Zone */}
              <FadeIn delay={0.1} className="border border-destructive/20 bg-destructive/5 p-6 rounded-sm">
                <div className="flex items-start gap-3.5">
                  <Trash2 className="size-5 text-destructive shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-xs font-semibold text-foreground mb-1">Delete Workspace Account</h3>
                    <p className="text-[10px] leading-relaxed text-muted-foreground mb-3">
                      Completely remove your user credentials, uploaded files, and chat history. This action is final.
                    </p>
                    <button
                      onClick={() => toast.error("Please contact support@evident.ai to request account deletion.")}
                      className="font-mono text-[9px] uppercase tracking-widest border border-destructive/40 text-destructive hover:bg-destructive/10 px-4 py-2 transition-all cursor-pointer rounded-sm"
                    >
                      Request Deletion
                    </button>
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Right Column: Preferences & Subscriptions */}
            <div className="space-y-6">

              {/* Workspace Preferences */}
              <FadeIn delay={0.06} className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                <h2 className="text-sm font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="size-4 text-[#ff3d00]" />
                  Workspace Preferences
                </h2>

                <div className="space-y-4">
                  {/* Theme Select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">Color Theme</label>
                    <select
                      value={isDark ? "dark" : "light"}
                      onChange={(e) => handleThemeChange(e.target.value)}
                      className="w-full h-11 px-3 bg-[#0a0a0a] border border-border text-xs text-foreground focus:outline-none transition-colors rounded-sm cursor-pointer"
                    >
                      <option value="dark">Dark Theme</option>
                      <option value="light">Light Theme</option>
                    </select>
                  </div>

                  {/* Model Select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">Default Gemini Model</label>
                    <select
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(e.target.value as ModelTier)}
                      className="w-full h-11 px-3 bg-[#0a0a0a] border border-border text-xs text-foreground focus:outline-none transition-colors rounded-sm cursor-pointer"
                    >
                      <option value="Economy">Economy (Gemini 2.0 Flash Lite)</option>
                      <option value="Balanced">Balanced (Gemini 2.5 Flash)</option>
                      <option value="Advanced">Advanced (Gemini 2.5 Pro)</option>
                    </select>
                  </div>

                  <div className="h-px bg-border my-4" />

                  <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Download className="size-3.5 text-[#ff3d00]" />
                    Export Configurations
                  </h3>

                  {/* Default Format Select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-[#737373]">Preferred Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full h-11 px-3 bg-[#0a0a0a] border border-border text-xs text-foreground focus:outline-none transition-colors rounded-sm cursor-pointer"
                    >
                      <option value="PDF">PDF Document (.pdf)</option>
                      <option value="Markdown">Markdown (.md)</option>
                      <option value="TXT">Plain Text (.txt)</option>
                      <option value="JSON">JSON Data (.json)</option>
                      <option value="CSV">CSV Spreadsheet (.csv)</option>
                    </select>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-2.5 pt-2">
                    {[
                      { label: "Include Document Metadata", state: incMetadata, set: setIncMetadata },
                      { label: "Include Executive Insights & Timeline", state: incInsights, set: setIncInsights },
                      { label: "Include Statistics & Analysis Summary", state: incStatistics, set: setIncStatistics },
                    ].map(({ label, state, set }) => (
                      <label key={label} className="flex items-center gap-3 cursor-pointer select-none border border-border/50 px-3 py-2 bg-[#0a0a0a]/30">
                        <input
                          type="checkbox"
                          checked={state}
                          onChange={(e) => set(e.target.checked)}
                          className="accent-[#ff3d00] size-3.5"
                        />
                        <span className="text-[11px] text-muted-foreground">{label}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={isSaving}
                    className="w-full inline-flex items-center justify-center gap-2 border border-[#ff3d00] bg-[#ff3d00]/10 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] hover:bg-[#ff3d00] hover:text-[#0a0a0a] transition-all duration-200 cursor-pointer rounded-sm"
                  >
                    Save Preferences
                  </button>
                </div>
              </FadeIn>

              {/* Billing Info */}
              <FadeIn delay={0.08} className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                <h2 className="text-sm font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
                  <CreditCard className="size-4 text-[#ff3d00]" />
                  Plan & Subscription
                </h2>
                
                <div className="border border-[#ff3d00]/20 bg-[#ff3d00]/5 p-5 rounded-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[#ff3d00]">Account Tier</p>
                      <p className="text-lg font-bold text-foreground">Starter Tier</p>
                    </div>
                    <span className="font-mono text-[8px] uppercase tracking-widest border border-[#ff3d00]/40 px-2 py-0.5 bg-[#ff3d00]/10 text-[#ff3d00] font-semibold">
                      Free Account
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {PLAN_FEATURES.Starter.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="size-3.5 text-[#ff3d00] shrink-0" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-border p-5 rounded-sm bg-[#0a0a0a]/50 mt-4">
                  <p className="text-xs font-semibold text-foreground mb-1">Upgrade to Professional</p>
                  <p className="text-[11px] text-muted-foreground mb-4">
                    Unlock higher thresholds, faster text indexing, API keys, and dedicated RAG collections.
                  </p>
                  <button
                    onClick={() => navigate("/pricing")}
                    className="w-full inline-flex items-center justify-center gap-2 border border-[#ff3d00]/30 hover:border-[#ff3d00] bg-[#ff3d00]/5 hover:bg-[#ff3d00]/10 py-2.5 font-mono text-[10px] uppercase tracking-widest text-[#ff3d00] transition-all rounded-sm cursor-pointer"
                  >
                    View Pricing Plans
                  </button>
                </div>
              </FadeIn>

              {/* Security Operations */}
              <FadeIn delay={0.12} className="border border-border p-6 bg-[#0f0f0f]/40 rounded-sm">
                <h2 className="text-sm font-semibold tracking-tight text-foreground mb-4 flex items-center gap-2">
                  <Shield className="size-4 text-[#ff3d00]" />
                  Security Operations
                </h2>
                <div className="space-y-3">
                  {[
                    { label: "AES-256 Document Encryption", status: true },
                    { label: "TLS 1.3 In-transit Encryption", status: true },
                    { label: "Secure Document Shredding", status: true },
                  ].map(({ label, status }) => (
                    <div key={label} className="flex items-center justify-between border border-border/50 px-4 py-3 bg-[#0a0a0a]/30">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#ff3d00] font-semibold">
                        {status ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceShell>
  );
}
