import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Shield, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FadeIn, Stagger, StaggerItem } from "../layout/FadeIn";
import { useAuth } from "../../context/AuthContext";

export function SignIn() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    // Email check
    if (!email) {
      setEmailError("Email address is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Password check
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    toast.loading("Authenticating your credentials...", { id: "auth" });

    // Simulate authentication delay
    setTimeout(() => {
      setIsLoading(false);
      signIn(email);
      toast.success("Successfully logged in!", { id: "auth" });
      navigate("/");
    }, 1500);
  };

  const handleOAuthLogin = (provider: "google" | "github") => {
    setIsLoading(true);
    toast.loading(`Redirecting to ${provider === "google" ? "Google" : "GitHub"} authorization...`, { id: "auth" });

    setTimeout(() => {
      setIsLoading(false);
      signIn(`user@${provider}.com`);
      toast.success("OAuth connection successful!", { id: "auth" });
      navigate("/");
    }, 1200);
  };

  return (
    <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background text-foreground overflow-hidden">
      
      {/* Back to Home Header Link (Absolute for mobile/desktop toggle) */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-50 group inline-flex items-center gap-2 text-xs font-mono-label uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
        Back to Home
      </Link>

      {/* Left Column: Splash Branding Panel (Col span 5) */}
      <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-12 border-r border-border bg-input/20">
        {/* Dynamic Background Gradients */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-accent/5 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[400px] w-[400px] rounded-full bg-accent/5 blur-[100px]" />
        
        {/* Digital Grid Overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] noise-texture" />

        {/* Branding header */}
        <div className="flex items-center gap-3 relative">
          <span className="text-xl font-semibold tracking-tight text-white">
            Evident
          </span>
          <span className="font-mono-label border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-accent">
            Beta
          </span>
        </div>

        {/* Splash Content Slider/Pillars */}
        <Stagger className="flex flex-col gap-8 max-w-sm relative my-auto">
          <StaggerItem>
            <h2 className="text-3xl font-semibold tracking-tighter leading-tight text-foreground">
              Master your document workflows with RAG
            </h2>
          </StaggerItem>
          <StaggerItem className="flex items-start gap-4">
            <Shield className="size-5 text-accent shrink-0 mt-1" strokeWidth={1.5} />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Secure & Encrypted</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                All document assets are parsed locally and stored in single-tenant encrypted partitions.
              </p>
            </div>
          </StaggerItem>
          <StaggerItem className="flex items-start gap-4">
            <Sparkles className="size-5 text-accent shrink-0 mt-1" strokeWidth={1.5} />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Zero Hallucinations</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                We anchor model outputs to direct vector source excerpts so every claims has a bracket citation link.
              </p>
            </div>
          </StaggerItem>
        </Stagger>

        {/* Bottom footer text */}
        <div className="text-[10px] font-mono-label text-muted-foreground/60 relative">
          © 2026 Evident AI Document Copilot. Protected by AES-256.
        </div>
      </div>

      {/* Right Column: Sign In Form (Col span 7) */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 md:p-12 relative min-h-screen">
        <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-accent/5 blur-[120px]" />
        
        <FadeIn className="w-full max-w-md flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tighter text-foreground mb-2">
              Sign in to your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials or choose a social integration provider.
            </p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            {/* Google OAuth Button */}
            <button
              onClick={() => handleOAuthLogin("google")}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 border border-border bg-input/10 hover:border-accent hover:bg-input/30 py-3 text-xs font-mono-label uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.465 0-6.273-2.808-6.273-6.273s2.808-6.273 6.273-6.273c1.558 0 2.977.568 4.07 1.51l3.056-3.056C19.062 2.378 15.892 1 12.24 1 5.86 1 .7 6.16.7 12.54S5.86 24.08 12.24 24.08c6.115 0 11.286-4.39 11.286-11.286 0-.745-.073-1.463-.207-2.155H12.24z" />
              </svg>
              Google
            </button>

            {/* GitHub OAuth Button */}
            <button
              onClick={() => handleOAuthLogin("github")}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 border border-border bg-input/10 hover:border-accent hover:bg-input/30 py-3 text-xs font-mono-label uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono-label text-[9px] uppercase tracking-wider text-muted-foreground/60">
              Or Sign In with Email
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-[10px] tracking-wider text-muted-foreground uppercase">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={`pl-10 h-12 bg-input/40 border ${
                    emailError ? "border-destructive focus-visible:border-destructive" : "border-border focus-visible:border-accent"
                  }`}
                  disabled={isLoading}
                />
              </div>
              {emailError && (
                <p className="text-[10px] text-destructive tracking-wide mt-1 font-mono-label">{emailError}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[10px] tracking-wider text-muted-foreground uppercase">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => toast.info("Password reset link simulation sent!")}
                  className="text-[10px] font-mono-label text-accent uppercase tracking-wider hover:underline"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" strokeWidth={1.5} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className={`pl-10 pr-10 h-12 bg-input/40 border ${
                    passwordError ? "border-destructive focus-visible:border-destructive" : "border-border focus-visible:border-accent"
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[10px] text-destructive tracking-wide mt-1 font-mono-label">{passwordError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full text-xs font-semibold py-5 mt-2"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>

          {/* Bottom Conversion Link */}
          <p className="text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/pricing" className="text-accent hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </FadeIn>

      </div>
    </div>
  );
}
