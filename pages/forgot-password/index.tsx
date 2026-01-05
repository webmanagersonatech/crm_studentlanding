
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import CryptoJS from "crypto-js";
import {
  sendStudentOtp,
  verifyStudentOtp,
  changeStudentPassword, // 🔥 add this api
} from "@/lib/api";

type Step = 1 | 2 | 3;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const SECRET_KEY = "sonacassecretkey@2025";
  /* =======================
     RESTORE STATE ON LOAD
  ======================== */
  useEffect(() => {
    const savedStep = localStorage.getItem("fp_step");
    const savedEmail = localStorage.getItem("fp_email");

    if (savedStep) setStep(Number(savedStep) as Step);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  /* =======================
     SAVE STEP
  ======================== */
  const goToStep = (s: Step) => {
    setStep(s);
    localStorage.setItem("fp_step", s.toString());
  };

  /* =======================
     STEP 1 — SEND OTP
  ======================== */
  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const res = await sendStudentOtp({ email });

    if (!res.success) {
      setMsg(res.message);
      setLoading(false);
      return;
    }

    setMsg("✅ OTP has been sent to your registered email address.");
    localStorage.setItem("fp_email", email);
    goToStep(2);
    setLoading(false);
  };


  /* =======================
     STEP 2 — VERIFY OTP
  ======================== */
  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const res = await verifyStudentOtp({ email, otp });

    if (!res.success) {
      setMsg(res.message);
      setLoading(false);
      return;
    }

    setMsg("✅ OTP verified successfully.");
    goToStep(3);
    setLoading(false);
  };


  /* =======================
     STEP 3 — RESET PASSWORD
  ======================== */


  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMsg("❌ Passwords do not match");
      return;
    }

    setLoading(true);
    setMsg("");

    const encryptedNew = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
    const encryptedConfirm = CryptoJS.AES.encrypt(confirmPassword, SECRET_KEY).toString();

    const res = await changeStudentPassword({
      email,
      newPassword: encryptedNew,
      confirmPassword: encryptedConfirm,
    });

    if (!res.success) {
      setMsg(res.message);
      setLoading(false);
      return;
    }

    setMsg("✅ Password changed successfully. Redirecting to login...");

    localStorage.removeItem("fp_step");
    localStorage.removeItem("fp_email");

    setTimeout(() => {
      window.location.href = "/";
    }, 1500);

    setLoading(false);
  };

  const handleBackToLogin = () => {
    localStorage.removeItem("fp_step");
    localStorage.removeItem("fp_email");
  };

  /* =======================
     UI STYLES
  ======================== */
  const inputClass =
    "w-full h-12 px-4 rounded-xl bg-white/20 border border-white/40 text-white " +
    "placeholder-white/70 outline-none focus:border-white/70 " +
    "focus:shadow-[0_0_12px_rgba(255,255,255,0.35)] transition";

  const btnClass =
    "w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 " +
    "text-white font-semibold shadow-lg hover:shadow-xl " +
    "transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50";

  /* =======================
     RENDER
  ======================== */
  return (
    <AuthShell title="RESET PASSWORD">
      {/* Step Indicator */}
      <div className="flex justify-center mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-3 h-3 mx-1 rounded-full ${step >= s ? "bg-amber-400" : "bg-white/30"
              }`}
          />
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <input
            type="email"
            placeholder="Registered Email Address"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <button disabled={loading} className={btnClass}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-5">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className={inputClass}
          />
          <button disabled={loading} className={btnClass}>
            {loading ? "Verifying OTP..." : "Verify OTP"}
          </button>
        </form>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <input
            type="password"
            placeholder="New Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
          <button disabled={loading} className={btnClass}>
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      )}

      {msg && (
        <p className="text-center mt-5 text-sm font-semibold text-white">
          {msg}
        </p>
      )}

      <div className="text-center mt-6 text-sm">
        <Link
          href="/"
          onClick={handleBackToLogin}
          className="text-white/80 hover:text-white"
        >
          ← Back to Login
        </Link>
      </div>

    </AuthShell>
  );
}
