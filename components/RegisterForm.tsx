import { useState, FormEvent, useEffect } from "react";
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import { registerStudent, getStudentSettings, getActiveInstitutions, setInstituteCookie, generateCaptcha } from "@/lib/api";
import { AuthShell } from "./AuthShell";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

type Props = { instituteId?: string | null };

export default function RegisterForm({ instituteId }: Props) {
    const router = useRouter();
    const [registered, setRegistered] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        mobileNo: "",
        country: "India",
        state: "",
        city: "",
        instituteInput: "",
    });

    const [institutdata, setInstitutdata] = useState<any>(null);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");
    const [msgType, setMsgType] = useState<"error" | "success" | "">("");
    const [mobileError, setMobileError] = useState("");
    const [captchaSvg, setCaptchaSvg] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [captchaError, setCaptchaError] = useState("");
    const [captchaLoading, setCaptchaLoading] = useState(false);
    const finalInstituteId = instituteId || form.instituteInput;
    const isInstituteSelected = Boolean(finalInstituteId);

    // Load captcha
    const loadCaptcha = async () => {
        setCaptchaLoading(true);
        setCaptchaError("");
        try {
            const res = await generateCaptcha();
            if (res.success) {
                setCaptchaSvg(res.captcha);
                setMsg("");
            } else {
                toast.error("Failed to load captcha");
            }
        } catch (error) {
            toast.error("Error loading captcha");
        } finally {
            setCaptchaLoading(false);
        }
    };

    useEffect(() => {
        loadCaptcha();
    }, []);

    const input = "w-full h-12 px-4 rounded-lg bg-white/90 text-gray-900 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500";
    const inputError = "border-red-500 ring-1 ring-red-500";

    const selectStyles = {
        control: (base: any) => ({
            ...base,
            height: "48px",
            borderRadius: "0.5rem",
        }),
    };

    // Validate mobile number
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

    // Validate captcha input
    const validateCaptcha = (value: string) => {
        if (!value.trim()) {
            setCaptchaError("Captcha is required");
            return false;
        }
        setCaptchaError("");
        return true;
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!finalInstituteId) {
            setMsgType("error");
            setMsg("Please select an institute");
            toast.error("Please select an institute");
            return;
        }

        if (!validateMobileNumber(form.mobileNo)) {
            toast.error(mobileError);
            return;
        }

        if (!validateCaptcha(captchaInput)) {
            toast.error(captchaError);
            return;
        }

        setLoading(true);
        setMsg("");
        setMsgType("");
        setCaptchaError("");

        const result = await registerStudent({
            firstname: form.firstName,
            lastname: form.lastName,
            email: form.email,
            mobileNo: form.mobileNo.replace(/\D/g, ""),
            country: form.country,
            state: form.state,
            city: form.city,
            instituteId: finalInstituteId,
            captchaInput: captchaInput,
        });

        if (!result.success) {
            setMsgType("error");
            setMsg(result.message);
            toast.error(result.message);

            // Refresh captcha on error
            loadCaptcha();
            setCaptchaInput("");
            setCaptchaError("Invalid captcha, please try again");
            setLoading(false);
            return;
        }

        // Success case
        setRegistered(true);
        toast.success("Registration successful! Check your email for password.");

        // Reset form
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
        setCaptchaInput("");
        setCaptchaError("");
        setLoading(false);

        // Load new captcha for next registration
        loadCaptcha();
    };

    // Initialize data
    useEffect(() => {
        const init = async () => {
            try {
                if (instituteId) {
                    const res = await getStudentSettings(instituteId);
                    if (res.success) setInstitutdata(res.data);
                    return;
                }

                const res = await getActiveInstitutions();
                if (res.success) setInstitutions(res.data);
            } catch (error) {
                toast.error("Failed to load institutions");
            }
        };

        init();
    }, [instituteId]);

    // Country/State/City options
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

    const handleCaptchaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase();
        setCaptchaInput(value);
        validateCaptcha(value);
    };

    return (
        <AuthShell title="ADMISSION PORTAL - REGISTER" logo={institutdata?.logo || null} size="lg">
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

            {!isInstituteSelected && (
                <Select
                    styles={selectStyles}
                    options={instituteOptions}
                    placeholder="Search Institute..."
                    onChange={async (opt: any) => {
                        const res = await setInstituteCookie(opt.value as string);

                        if (!res.success) {
                            toast.error(res.message || "Invalid Institute");
                            
                        } else {
                            setForm({ ...form, instituteInput: opt.value });
                          
                        }
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
                                className={`${input} ${mobileError ? inputError : ''}`}
                                placeholder="Mobile Number"
                                required
                                value={form.mobileNo}
                                onChange={handleMobileChange}
                                maxLength={10}
                                inputMode="numeric"
                            />
                            {mobileError && (
                                <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute -bottom-5 left-0 text-xs text-red-500"
                                >
                                    {mobileError}
                                </motion.p>
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

                    {/* Captcha Section - Enhanced for Large Screens */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* Left Side - Captcha Display */}
                            <div className="space-y-3">
                                <div className="bg-white border rounded-lg p-4 flex justify-center items-center min-h-[100px]">
                                    {captchaLoading ? (
                                        <div className="flex items-center space-x-2">
                                            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="text-gray-600">Loading captcha...</span>
                                        </div>
                                    ) : (
                                        <div
                                            dangerouslySetInnerHTML={{ __html: captchaSvg }}
                                            className="captcha-svg"
                                        />
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={loadCaptcha}
                                    disabled={captchaLoading}
                                    className="text-sm text-indigo-600 hover:underline disabled:opacity-50 flex items-center space-x-1"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span>{captchaLoading ? "Refreshing..." : "Refresh Captcha"}</span>
                                </button>
                            </div>

                            {/* Right Side - Captcha Input with Error Display */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-white/90">
                                    Enter Captcha
                                </label>
                                <div className="relative">
                                    <input
                                        className={`${input} ${captchaError ? inputError : ''}`}
                                        placeholder="Type the captcha here..."
                                        value={captchaInput}
                                        onChange={handleCaptchaChange}
                                        maxLength={6}
                                        required
                                    />
                                    {captchaError && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="absolute -bottom-6 left-0 flex items-center space-x-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-xs text-red-500 font-medium">
                                                {captchaError}
                                            </p>
                                        </motion.div>
                                    )}
                                </div>
                                <p className="text-xs text-white/60 mt-6">
                                    Enter the characters shown in the image
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Message Display */}
                    {msg && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-lg text-center ${msgType === "error"
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                                }`}
                        >
                            {msg}
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !!mobileError || !!captchaError || captchaLoading}
                        className="w-full h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center space-x-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Registering...</span>
                            </span>
                        ) : "Register"}
                    </button>

                    <p className="text-center text-sm text-white/80">
                        Already have an account?{" "}
                        <Link href="/" className="text-indigo-300 hover:underline font-medium">
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
                                Your username and password has been sent to <b>{form.email}</b>.
                                Please check your <b>Inbox</b>, <b>Spam</b>, or <b>Other</b> folders.
                            </p>

                            <button
                                onClick={() => router.push("/")}
                                className="w-full h-11 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
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