import { useState, FormEvent, useEffect, useRef } from "react"; // 👈 useRef add pannu
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import { registerStudent, getStudentSettings, getActiveInstitutions } from "@/lib/api";
import { AuthShell } from "./AuthShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ReCAPTCHA from "react-google-recaptcha"; // 👈 Import pannu

type Props = { instituteId?: string | null };

export default function RegisterForm({ instituteId }: Props) {
    const router = useRouter();
    const [registered, setRegistered] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        mobileNo: "",
        country: "India", // Default to India
        state: "",
        city: "",
        instituteInput: "",
    });

    const [institutdata, setInstitutdata] = useState<any>(null);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [mobileError, setMobileError] = useState("");

    // 👇 New state for reCAPTCHA
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [recaptchaError, setRecaptchaError] = useState("");
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const finalInstituteId = instituteId || form.instituteInput;
    const isInstituteSelected = Boolean(finalInstituteId);

    // -------------------- helpers --------------------

    const input =
        "w-full h-12 px-4 rounded-lg bg-white/90 text-gray-900 " +
        "border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500";

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            height: "48px",
            borderRadius: "0.5rem",
        }),
    };

    // -------------------- validate mobile number --------------------
    const validateMobileNumber = (number: string): boolean => {
        const cleanNumber = number.replace(/\D/g, "");

        if (cleanNumber.length !== 10) {
            setMobileError("Mobile number must be exactly 10 digits");
            return false;
        }

        if (cleanNumber.startsWith('0')) {
            setMobileError("Mobile number cannot start with 0");
            return false;
        }

        const firstDigit = cleanNumber.charAt(0);
        if (!['6', '7', '8', '9'].includes(firstDigit)) {
            setMobileError("Mobile number must start with 6, 7, 8, or 9");
            return false;
        }

        setMobileError("");
        return true;
    };

    // 👇 reCAPTCHA handlers
    const handleRecaptchaChange = (token: string | null) => {
        setRecaptchaToken(token);
        setRecaptchaError(""); // Clear error when token is set
    };

    const handleRecaptchaExpired = () => {
        setRecaptchaToken(null);
        setRecaptchaError("reCAPTCHA expired. Please verify again.");
    };

    // -------------------- submit --------------------

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!finalInstituteId) {
            setMsg("Institute is required");
            return;
        }

        if (!validateMobileNumber(form.mobileNo)) {
            return;
        }

        // 👇 Check reCAPTCHA
        if (!recaptchaToken) {
            setRecaptchaError("Please verify that you are not a robot");
            return;
        }

        setLoading(true);
        setMsg("");

        const result = await registerStudent({
            firstname: form.firstName,
            lastname: form.lastName,
            email: form.email,
            mobileNo: form.mobileNo.replace(/\D/g, ""),
            country: form.country,
            state: form.state,
            city: form.city,
            instituteId: finalInstituteId,
            recaptchaToken: recaptchaToken, // 👈 Token anuppu
        });

        console.log(result, "ll")

        if (!result.success) {
            setMsg(result.message);
            setLoading(false);

            // 👈 Reset reCAPTCHA on error
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
                setRecaptchaToken(null);
            }

            return;
        }

        setRegistered(true);
        setForm({
            firstName: "",
            lastName: "",
            email: "",
            mobileNo: "",
            country: "India",
            state: "",
            city: "",
            instituteInput: "",
        });

        // 👈 Reset reCAPTCHA after success
        if (recaptchaRef.current) {
            recaptchaRef.current.reset();
            setRecaptchaToken(null);
        }

        setLoading(false);
    };

    // -------------------- init --------------------

    useEffect(() => {
        const init = async () => {
            if (instituteId) {
                const res = await getStudentSettings(instituteId);
                if (res.success) setInstitutdata(res.data);
                return;
            }

            const res = await getActiveInstitutions();
            if (res.success) setInstitutions(res.data);
        };

        init();
    }, [instituteId]);

    // -------------------- options --------------------

    const countryOptions = Country.getAllCountries().map((c) => ({
        value: c.name,
        label: c.name,
        isoCode: c.isoCode,
    }));

    const selectedCountry = Country.getAllCountries().find(
        (c) => c.name === form.country
    );

    const stateOptions = State.getStatesOfCountry(
        selectedCountry?.isoCode || "IN"
    ).map((s) => ({
        value: s.name,
        label: s.name,
        isoCode: s.isoCode,
    }));

    const selectedState = State.getStatesOfCountry(
        selectedCountry?.isoCode || "IN"
    ).find((s) => s.name === form.state);

    const cityOptions = City.getCitiesOfState(
        selectedCountry?.isoCode || "IN",
        selectedState?.isoCode || ""
    ).map((c) => ({
        value: c.name,
        label: c.name,
    }));

    const instituteOptions = institutions.map((i) => ({
        value: i.instituteId,
        label: i.name,
    }));

    // -------------------- handle mobile change --------------------
    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const digitsOnly = value.replace(/\D/g, "");
        const truncated = digitsOnly.slice(0, 10);

        setForm({ ...form, mobileNo: truncated });

        if (truncated.length > 0) {
            validateMobileNumber(truncated);
        } else {
            setMobileError("");
        }
    };

    // -------------------- render --------------------

    return (
        <AuthShell title="ADMISSION PORTAL - REGISTER" logo={institutdata?.logo || null} size="lg">
            <Toaster position="top-right" />

            {/* Institute Selection */}
            {!isInstituteSelected && (
                <Select
                    styles={selectStyles}
                    options={instituteOptions}
                    placeholder="Search Institute..."
                    onChange={(opt: any) => {
                        document.cookie = `instituteId=${opt.value}; path=/; max-age=${60 * 60 * 24 * 7}`;
                        setForm({ ...form, instituteInput: opt.value });
                        router.refresh();
                    }}
                />
            )}

            {isInstituteSelected && (
                <form onSubmit={handleSubmit} className="w-full p-8 space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className={input}
                            placeholder="First Name"
                            required
                            value={form.firstName}
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        />
                        <input
                            className={input}
                            placeholder="Last Name"
                            required
                            value={form.lastName}
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        />
                    </div>

                    {/* Email / Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            className={input}
                            placeholder="Email"
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <div className="relative">
                            <input
                                className={`${input} ${mobileError ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                placeholder="Mobile Number"
                                required
                                value={form.mobileNo}
                                onChange={handleMobileChange}
                                maxLength={10}
                                inputMode="numeric"
                            />
                            {mobileError && (
                                <p className="absolute -bottom-5 left-0 text-xs text-red-500">
                                    {mobileError}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                            styles={selectStyles}
                            options={countryOptions}
                            placeholder="Search Country..."
                            value={countryOptions.find(c => c.value === form.country)}
                            onChange={(opt: any) =>
                                setForm({ ...form, country: opt.value, state: "", city: "" })
                            }
                        />

                        <Select
                            styles={selectStyles}
                            options={stateOptions}
                            placeholder="Search State..."
                            isDisabled={!form.country}
                            value={stateOptions.find(s => s.value === form.state)}
                            onChange={(opt: any) =>
                                setForm({ ...form, state: opt.value, city: "" })
                            }
                        />

                        <Select
                            styles={selectStyles}
                            options={cityOptions}
                            placeholder="Search City..."
                            isDisabled={!form.state}
                            value={cityOptions.find(c => c.value === form.city)}
                            onChange={(opt: any) =>
                                setForm({ ...form, city: opt.value })
                            }
                        />
                    </div>

                    {/* 👇 reCAPTCHA Component - Idhu sethukka */}
                    <div className="flex flex-col items-center space-y-2">
                        <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
                            onChange={handleRecaptchaChange}
                            onExpired={handleRecaptchaExpired}
                            theme="light"
                        />
                        {recaptchaError && (
                            <p className="text-sm text-red-500">{recaptchaError}</p>
                        )}
                    </div>

                    {/* Submit Button - disabled if no recaptcha token */}
                    <button
                        type="submit"
                        disabled={loading || !!mobileError || !recaptchaToken}
                        className="w-full h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                    {msg && <p className="text-center text-red-500">{msg}</p>}

                    <p className="text-center text-sm text-white/80">
                        Already have an account?{" "}
                        <Link href="/" className="text-indigo-300 hover:underline">
                            Login
                        </Link>
                    </p>
                </form>
            )}

            {/* Success Modal */}
            <AnimatePresence>
                {registered && (
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white rounded-2xl p-10 w-[420px] text-center space-y-6 shadow-2xl"
                        >
                            <motion.svg
                                width="90"
                                height="90"
                                viewBox="0 0 120 120"
                                className="mx-auto"
                            >
                                <motion.circle
                                    cx="60"
                                    cy="60"
                                    r="50"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="8"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.6 }}
                                />
                                <motion.path
                                    d="M40 65 L55 80 L85 45"
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ delay: 0.5, duration: 0.5 }}
                                />
                            </motion.svg>

                            <h2 className="text-2xl font-semibold text-gray-900">
                                Registration Successful
                            </h2>

                            <p className="text-gray-600">
                                Your password has been shared to your registered email.
                                Please check your <b>Inbox</b>, <b>Spam</b>, or <b>Other</b> folders.
                            </p>

                            <button
                                onClick={() => router.push("/")}
                                className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
                            >
                                Back to Login
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthShell>
    );
}