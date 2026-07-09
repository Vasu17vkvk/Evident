import { useState, FormEvent, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { FadeIn } from "../layout/FadeIn";
import { useAuth } from "../../context/AuthContext";

export function SignIn() {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, signIn } = useAuth();
  const [view, setView] = useState<"options" | "email_login" | "email_signup">("options");
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

    if (!email) {
      setEmailError("Email address is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    toast.loading("Connecting Google account...", { id: "auth" });
    try {
      await loginWithGoogle();
      toast.success("Welcome to Evident!", { id: "auth" });
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to authenticate with Google", { id: "auth" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    toast.loading(view === "email_login" ? "Signing in..." : "Creating account...", { id: "auth" });
    try {
      if (view === "email_login") {
        await login(email, password);
        toast.success("Successfully logged in!", { id: "auth" });
      } else {
        await register(email, password);
        toast.success("Account created successfully!", { id: "auth" });
      }
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed", { id: "auth" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    toast.loading("Accessing workspace as Guest...", { id: "auth" });
    setTimeout(() => {
      setIsLoading(false);
      signIn("guest@evident.com");
      toast.success("Signed in as Guest User", { id: "auth" });
      navigate("/");
    }, 1000);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0a0a0a] text-foreground overflow-hidden px-4">
      {/* Editorial dark mesh ambient backdrop */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full bg-[#ff3d00]/5 blur-[120px]" />
      
      {/* Noise Grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02] noise-texture" />

      {/* Close/Back Home */}
      <Link
        to="/"
        className="absolute top-6 left-6 group inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
        Exit to Home
      </Link>

      {/* Centered Premium Modal Card */}
      <div className="relative w-full max-w-[440px] border border-border/80 bg-[#111111]/90 backdrop-blur-md p-8 md:p-10 shadow-2xl flex flex-col gap-8 select-none">
        
        {/* Header Accent Branding */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-tighter text-white font-sans uppercase">
              Evident
            </span>
            <span className="font-mono text-[8px] border border-[#ff3d00]/30 bg-[#ff3d00]/10 px-1.5 py-0.5 uppercase tracking-widest text-[#ff3d00] font-semibold">
              Beta
            </span>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
            Document Intelligence Platform
          </p>
        </div>

        {view === "options" ? (
          <FadeIn className="flex flex-col gap-6 w-full">
            <div className="text-center">
              <h2 className="text-lg font-semibold tracking-tight text-white mb-1.5">
                Welcome to Evident
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your account or explore workspaces instantly.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 border border-border bg-[#181818]/60 hover:border-[#ff3d00]/50 hover:bg-[#1a1a1a] py-3.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <svg className="size-4 shrink-0 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.465 0-6.273-2.808-6.273-6.273s2.808-6.273 6.273-6.273c1.558 0 2.977.568 4.07 1.51l3.056-3.056C19.062 2.378 15.892 1 12.24 1 5.86 1 .7 6.16.7 12.54S5.86 24.08 12.24 24.08c6.115 0 11.286-4.39 11.286-11.286 0-.745-.073-1.463-.207-2.155H12.24z" />
                </svg>
                Continue with Google
              </button>

              {/* Email Button */}
              <button
                onClick={() => setView("email_login")}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 border border-border bg-[#181818]/60 hover:border-[#ff3d00]/50 hover:bg-[#1a1a1a] py-3.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <Mail className="size-4 shrink-0" strokeWidth={1.5} />
                Continue with Email
              </button>

              <div className="flex items-center gap-3 py-2">
                <div className="h-px flex-1 bg-border/40" />
                <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground/40">
                  Or
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>

              {/* Guest Button */}
              <button
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 border border-[#ff3d00]/30 bg-[#ff3d00]/5 hover:border-[#ff3d00] hover:bg-[#ff3d00]/10 py-3.5 text-xs font-mono uppercase tracking-wider text-[#ff3d00] hover:text-[#ff3d00] transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                Continue as Guest
              </button>
            </div>
          </FadeIn>
        ) : (
          <FadeIn className="flex flex-col gap-5 w-full">
            <div className="text-center">
              <h2 className="text-lg font-semibold tracking-tight text-white mb-1">
                {view === "email_login" ? "Sign In" : "Create Account"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {view === "email_login" ? "Enter your email credentials" : "Choose email details to register"}
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit}>
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.5} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError("");
                    }}
                    className={`pl-10 h-11 bg-input/20 border text-xs ${
                      emailError ? "border-destructive focus-visible:border-destructive" : "border-border focus-visible:border-[#ff3d00]/50"
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {emailError && (
                  <p className="text-[9px] text-destructive tracking-wide font-mono mt-0.5">{emailError}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[9px] font-mono tracking-wider text-muted-foreground uppercase">
                    Password
                  </Label>
                  {view === "email_login" && (
                    <button
                      type="button"
                      onClick={() => toast.info("Password resets are simulated in beta mode.")}
                      className="text-[9px] font-mono text-[#ff3d00] uppercase tracking-wider hover:underline"
                      disabled={isLoading}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.5} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                    }}
                    className={`pl-10 pr-10 h-11 bg-input/20 border text-xs ${
                      passwordError ? "border-destructive focus-visible:border-destructive" : "border-border focus-visible:border-[#ff3d00]/50"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="size-4" strokeWidth={1.5} /> : <Eye className="size-4" strokeWidth={1.5} />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[9px] text-destructive tracking-wide font-mono mt-0.5">{passwordError}</p>
                )}
              </div>

              {/* Submit Trigger */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ff3d00] hover:bg-[#ff3d00]/90 text-white font-mono text-xs uppercase tracking-wider py-3 mt-2 font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  view === "email_login" ? "Sign In" : "Register Account"
                )}
              </button>
            </form>

            <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-border/40 text-center">
              <button
                onClick={() => {
                  setView(view === "email_login" ? "email_signup" : "email_login");
                  setEmailError("");
                  setPasswordError("");
                }}
                disabled={isLoading}
                className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:underline cursor-pointer disabled:opacity-50"
              >
                {view === "email_login" ? "Don't have an account? Sign Up" : "Already registered? Sign In"}
              </button>
              <button
                onClick={() => {
                  setView("options");
                  setEmailError("");
                  setPasswordError("");
                }}
                disabled={isLoading}
                className="text-[10px] font-mono uppercase tracking-wider text-[#ff3d00]/80 hover:text-[#ff3d00] cursor-pointer disabled:opacity-50"
              >
                Back to Options
              </button>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
