
import { useState, FormEvent, useEffect } from "react";

import { loginStudent, getStudentSettings } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "./AuthShell";
import Link from "next/link";

type Props = { instituteId?: string | null };

export default function LoginForm({ instituteId }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [msg, setMsg] = useState("");
    const [institutdata, setInstitutdata] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const isApplicationOpen = institutdata?.isApplicationOpen ?? true;
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // 🚫 Block login if application closed
        if (!isApplicationOpen) {
            setMsg("Applications are currently closed. Login is disabled.");
            return;
        }
        setLoading(true);
        setMsg("");

        const result = await loginStudent(email, password);

        if (!result.success) {
            setMsg(result.message);
            setLoading(false);
            return;
        }

        setLoading(false);

        // Redirect to dashboard after login
        window.location.href = "/dashboard";
    };

    useEffect(() => {
        const fetchSettings = async () => {
            if (!instituteId) return;

            const result = await getStudentSettings(instituteId);
            if (result.success && result.data) {
                setInstitutdata(result.data);
            }
        };

        fetchSettings();
    }, [instituteId]);




    return (
        <AuthShell title="ADMISSION PORTAL - LOGIN" logo={institutdata?.logo || null} size="sm">
            {!isApplicationOpen && (
                <div className="mb-4 p-3 rounded-xl bg-red-100 text-red-700 text-center font-semibold">
                    🚫 Applications are currently closed.
                    Please contact the institution for more details.
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <input
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Username or Email"
                    required
                    disabled={!isApplicationOpen}
                    className="w-full h-12 px-4 rounded-xl border bg-white/20 text-white placeholder-white/80 outline-none"
                />

                {/* Password */}
                <div className="relative">
                    <input
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        required
                        disabled={!isApplicationOpen}
                        className="w-full h-12 px-4 rounded-xl border bg-white/20 text-white placeholder-white/80 outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>



                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading || !isApplicationOpen}
                    className="w-full h-12 bg-indigo-600 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>

                {msg && <p className="text-center text-red-600">{msg}</p>}

                {/* Links */}
                {isApplicationOpen && (<div className="text-center text-sm">
                    {/* ✅ Allow registration only if open */}

                    <Link href="/register" className="text-white/80 mx-2">
                        Create Account
                    </Link>


                    {/* ✅ Forgot password always allowed */}
                    <Link href="/forgot-password" className="text-white/80 mx-2">
                        Forgot Password?
                    </Link>

                </div>)}
            </form>
        </AuthShell>
    );
}
