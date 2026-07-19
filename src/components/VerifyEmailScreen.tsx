import React, { useState } from "react";
import { 
  Mail, 
  RefreshCw, 
  LogOut, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { resendVerificationEmail, reloadCurrentUser, signOut } from "../lib/firebase";
import { User } from "../types";
import { motion } from "motion/react";

interface VerifyEmailScreenProps {
  currentUser: User;
  onLogout: () => void;
  onVerifiedSuccess: (user: User) => void;
}

export default function VerifyEmailScreen({ currentUser, onLogout, onVerifiedSuccess }: VerifyEmailScreenProps) {
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  React.useEffect(() => {
    const savedErr = sessionStorage.getItem("auth_verification_error");
    if (savedErr) {
      try {
        const parsed = JSON.parse(savedErr);
        console.error("[DEBUG_EMAIL] Initial signup verification promise was rejected. Complete Error:", parsed);
        setError(`Firebase Error [${parsed.code || "unknown"}]: ${parsed.message || "No error message provided"}`);
        setMessage(null);
      } catch (e) {
        console.error("[DEBUG_EMAIL] Failed to parse saved auth verification error:", e);
        setError("Failed to send verification email immediately on signup.");
        setMessage(null);
      }
    } else {
      console.log("[DEBUG_EMAIL] Initial signup verification promise resolved successfully (no saved error).");
      setMessage("Verification email sent.");
    }
  }, []);

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      await resendVerificationEmail();
      console.log("[DEBUG_EMAIL] Resend verification email promise resolved successfully.");
      setMessage("Verification email sent.");
    } catch (err: any) {
      console.error("[DEBUG_EMAIL] Resend verification email promise rejected. Complete Error:", err);
      console.dir(err);
      const errCode = err.code || "unknown";
      const errMsg = err.message || "No error message provided";
      setError(`Firebase Error [${errCode}]: ${errMsg}`);
    } finally {
      setResending(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const updatedUser = await reloadCurrentUser();
      if (updatedUser) {
        if (updatedUser.emailVerified) {
          onVerifiedSuccess(updatedUser);
        } else {
          setError("Your email is still not verified. Please check your inbox and click the verification link.");
        }
      } else {
        setError("Could not retrieve user details. Please try signing in again.");
      }
    } catch (err: any) {
      console.error("Refresh user verification status failed:", err);
      setError(err.message || "Failed to refresh verification status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    setLoading(true);
    try {
      await signOut();
      onLogout();
    } catch (err: any) {
      console.error("Sign out failed during verification screen:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 justify-center text-slate-100 px-6 py-8 relative overflow-y-auto" id="verify-email-container">
      
      {/* Centered Graphic and Header */}
      <div className="flex flex-col items-center text-center mt-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 mb-4 animate-pulse">
          <Mail size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Verify Your <span className="text-sky-400">Email</span>
        </h2>
        <p className="text-slate-400 text-sm mt-1 max-w-xs leading-relaxed">
          We need to verify your email address to secure your account.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-slate-950/50 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl mt-6">
        <div className="text-center mb-6">
          <span className="text-xs text-slate-500 block uppercase font-bold tracking-wider mb-1">
            Registered Email
          </span>
          <span className="text-sm font-semibold text-slate-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800/60 inline-block font-mono max-w-full overflow-hidden text-ellipsis">
            {currentUser.email}
          </span>
        </div>

        {/* Dynamic Alerts / Feedback */}
        {message && (
          <div className="mb-5 p-4 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-xs text-sky-400 flex items-start gap-2.5 animate-fade-in" id="verify-success-banner">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-sky-400" />
            <span className="leading-relaxed font-medium">{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-400 flex items-start gap-2.5 animate-fade-in" id="verify-error-banner">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || resending}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-sky-500/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            id="btn-refresh-verification"
          >
            {loading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Refresh Verification Status</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={loading || resending}
            className="w-full bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            id="btn-resend-verification"
          >
            {resending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <>
                <Mail size={16} />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>

          <div className="border-t border-slate-800/80 pt-4 mt-2">
            <button
              type="button"
              onClick={handleLogoutClick}
              disabled={loading || resending}
              className="w-full bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 font-semibold rounded-xl py-2.5 text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              id="btn-logout-verification"
            >
              <LogOut size={13} />
              <span>Logout & Sign In with Another Account</span>
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mt-6">
        <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
          Check your spam folder or junk mail if you cannot find the verification link.
        </p>
      </div>
    </div>
  );
}
