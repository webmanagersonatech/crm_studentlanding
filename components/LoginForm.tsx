
import { useState, FormEvent, useEffect } from "react";

import { loginStudent, getStudentSettings } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "./AuthShell";
import Link from "next/link";

type Props = { instituteId?: string | null };

export default function LoginForm({ instituteId }: Props) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [msg, setMsg] = useState("");
    const [institutdata, setInstitutdata] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const isApplicationOpen = institutdata?.isApplicationOpen ?? true;
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setLoading(true);
        setMsg("");

        const result = await loginStudent(username, password);

        if (!result.success) {
            setMsg(result.message);
            setLoading(false);
            return;
        }

        setLoading(false);

        // Redirect to dashboard after login
        window.location.href = "/dashboard";
    };

    const institutionWebsites: Record<string, string> = {
        "INS-0VVEACMY": "https://scaleindia.in/sona-uwa",
        "INS-HY0CZ0CO": "https://www.sonatech.ac.in/",
        "INS-IWXDEN7K": "https://scaleindia.in/",
        "INS-3-ZXYXKM": "https://www.sonavalliappapublicschool.com/",
        "INS-YOWWE5DG": "https://tpt.edu.in/",
        "INS-P2VTCZ5T": "https://sonacas.edu.in/",
        "INS-ZFBTTF5P": "https://www.sonatech.ac.in/",
        "INS-DHJMFQ6G": "https://sonabusinessschool.com/",
        "INS-ESTKLHCB": "https://sonamedicalcollege.ac.in/",
    };

    const institutionWebsite =
        institutionWebsites[instituteId ?? ""] || "/";


    const institutionBackgrounds: Record<string, string> = {
        "INS-0VVEACMY": "/images/hero-3.webp",
        "INS-HY0CZ0CO": "/images/hero-1.webp",
        "INS-IWXDEN7K": "/images/hero-1.webp",
        "INS-3-ZXYXKM": "/images/hero-2.webp",
        "INS-YOWWE5DG": "/images/hero-1.webp",
        "INS-P2VTCZ5T": "/images/hero-1.webp",
        "INS-ZFBTTF5P": "/images/hero-1.webp",
        "INS-DHJMFQ6G": "/images/hero-1.webp",
        "INS-ESTKLHCB": "/images/hero-4.webp",
    };

    const backgroundImage =
        institutionBackgrounds[instituteId ?? ""] || "/images/hero-1.webp";

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
        <AuthShell title="Hika Portal" logo={institutdata?.logo || null} backgroundImage={backgroundImage} size="sm">
            {!isApplicationOpen && (
                <div className="mb-4 p-4 rounded-xl bg-red-100 text-red-700 text-center">
                    <div className="font-semibold">
                        🚫 Applications are currently closed.
                    </div>

                    <div className="mt-1 text-sm">
                        Please contact the institution for more details.
                    </div>

                    {institutionWebsite && (
                        <a
                            href={institutionWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-2 gap-2  px-5 
                            text-red 
                           font-bold"
                        >
                            ← Back to Website
                        </a>
                    )}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <input
                    name="username"

                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required

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
                    disabled={loading}
                    className="w-full h-12 bg-indigo-600 text-white rounded-xl font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Signing in..." : "Sign In"}
                </button>

                {msg && <p className="text-center text-red-600">{msg}</p>}

                {/* Links */}
                <div className="text-center text-sm">
                    {/* ✅ Allow registration only if open */}

                    {isApplicationOpen && (<Link href="/register" className="text-white/80 mx-2">
                        New User
                    </Link>)}


                    {/* ✅ Forgot password always allowed */}
                    <Link href="/forgot-password" className="text-white/80 mx-2">
                        Forgot Password?
                    </Link>

                </div>
            </form>
        </AuthShell>
    );
}
