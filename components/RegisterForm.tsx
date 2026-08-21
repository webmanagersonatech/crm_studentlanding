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
    const [captchaSvg, setCaptchaSvg] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [captchaError, setCaptchaError] = useState("");
    const [captchaLoading, setCaptchaLoading] = useState(false);
    const finalInstituteId = instituteId || form.instituteInput;
    const isInstituteSelected = Boolean(finalInstituteId);

    // Error states
    const [firstNameError, setFirstNameError] = useState("");
    const [lastNameError, setLastNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [mobileError, setMobileError] = useState("");
    const [instituteError, setInstituteError] = useState("");
    const [apiError, setApiError] = useState("");

    // Load captcha
    const loadCaptcha = async () => {
        setCaptchaLoading(true);
        setCaptchaError("");
        try {
            const res = await generateCaptcha();
            if (res.success) {
                setCaptchaSvg(res.captcha);
                setMsg("");
                setApiError("");
            } else {
                toast.error("Failed to load captcha");
                setApiError("Failed to load captcha");
            }
        } catch (error) {
            toast.error("Error loading captcha");
            setApiError("Error loading captcha");
        } finally {
            setCaptchaLoading(false);
        }
    };
    const isApplicationOpen = institutdata?.isApplicationOpen === true;
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

    // Validation Functions
    const validateFirstName = (value: string): boolean => {
        const nameRegex = /^[A-Za-z\s\-']+$/;
        const trimmed = value.trim();

        if (trimmed.length === 0) {
            setFirstNameError("First name is required");
            return false;
        }

        if (trimmed.length < 2) {
            setFirstNameError("First name must be at least 2 characters");
            return false;
        }

        if (trimmed.length > 50) {
            setFirstNameError("First name cannot exceed 50 characters");
            return false;
        }

        if (!nameRegex.test(trimmed)) {
            setFirstNameError("Only letters, spaces, hyphens, and apostrophes allowed");
            return false;
        }

        setFirstNameError("");
        return true;
    };

    const validateLastName = (value: string): boolean => {
        const nameRegex = /^[A-Za-z\s\-']+$/;
        const trimmed = value.trim();

        if (trimmed.length === 0) {
            setLastNameError("Last name is required");
            return false;
        }

        if (trimmed.length < 2) {
            setLastNameError("Last name must be at least 2 characters");
            return false;
        }

        if (trimmed.length > 50) {
            setLastNameError("Last name cannot exceed 50 characters");
            return false;
        }

        if (!nameRegex.test(trimmed)) {
            setLastNameError("Only letters, spaces, hyphens, and apostrophes allowed");
            return false;
        }

        setLastNameError("");
        return true;
    };

    const validateEmail = (value: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value.trim()) {
            setEmailError("Email is required");
            return false;
        }

        if (!emailRegex.test(value)) {
            setEmailError("Enter a valid email address");
            return false;
        }

        setEmailError("");
        return true;
    };

    const validateMobileNumber = (number: string): boolean => {
        const cleanNumber = number.replace(/\D/g, "");

        if (cleanNumber.length === 0) {
            setMobileError("Mobile number is required");
            return false;
        }

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

    const validateCaptcha = (value: string): boolean => {
        if (!value.trim()) {
            setCaptchaError("Captcha is required");
            return false;
        }
        setCaptchaError("");
        return true;
    };

    const validateInstitute = (): boolean => {
        if (!finalInstituteId) {
            setInstituteError("Please select an institute");
            return false;
        }
        setInstituteError("");
        return true;
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setApiError("");
        setMsg("");
        setMsgType("");

        // Validate all fields
        const isFirstNameValid = validateFirstName(form.firstName);
        const isLastNameValid = validateLastName(form.lastName);
        const isEmailValid = validateEmail(form.email);
        const isMobileValid = validateMobileNumber(form.mobileNo);
        const isCaptchaValid = validateCaptcha(captchaInput);
        const isInstituteValid = validateInstitute();

        // Check if any validation failed
        if (!isFirstNameValid) {
            toast.error(firstNameError);
            return;
        }

        if (!isLastNameValid) {
            toast.error(lastNameError);
            return;
        }

        if (!isEmailValid) {
            toast.error(emailError);
            return;
        }

        if (!isMobileValid) {
            toast.error(mobileError);
            return;
        }

        if (!isCaptchaValid) {
            toast.error(captchaError);
            return;
        }

        if (!isInstituteValid) {
            toast.error(instituteError);
            return;
        }

        setLoading(true);

        try {
            const result = await registerStudent({
                firstname: form.firstName.trim(),
                lastname: form.lastName.trim(),
                email: form.email.trim(),
                mobileNo: form.mobileNo.replace(/\D/g, ""),
                country: form.country,
                state: form.state,
                city: form.city,
                instituteId: finalInstituteId,
                captchaInput: captchaInput.trim(),
            });

            if (!result.success) {
                setMsgType("error");
                setMsg(result.message || "Registration failed");
                setApiError(result.message || "Registration failed");
                toast.error(result.message || "Registration failed");

                // Refresh captcha on error
                loadCaptcha();
                setCaptchaInput("");
                setCaptchaError("Invalid captcha, please try again");
                setLoading(false);
                return;
            }

            // Success case
            setRegistered(true);
            setMsgType("success");
            setMsg("Registration successful! Check your email for password.");
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

        } catch (error: any) {
            setMsgType("error");
            const errorMessage = error?.message || "An unexpected error occurred";
            setMsg(errorMessage);
            setApiError(errorMessage);
            toast.error(errorMessage);
            setLoading(false);
        }
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
                setApiError("Failed to load institutions");
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
        if (value.length > 0) {
            validateCaptcha(value);
        } else {
            setCaptchaError("");
        }
    };

    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^A-Za-z\s\-']/g, '');
        setForm({ ...form, firstName: value });
        if (value.length > 0) {
            validateFirstName(value);
        } else {
            setFirstNameError("");
        }
    };

    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^A-Za-z\s\-']/g, '');
        setForm({ ...form, lastName: value });
        if (value.length > 0) {
            validateLastName(value);
        } else {
            setLastNameError("");
        }
    };

    return (
        <AuthShell title="Student Portal - Register" logo={institutdata?.logo || null} size="lg">
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

            {!isInstituteSelected && (
                <div className="w-full p-8 space-y-4">
                    <Select
                        styles={selectStyles}
                        options={instituteOptions}
                        placeholder="Search Institute..."
                        onChange={async (opt: any) => {
                            try {
                                const res = await setInstituteCookie(opt.value as string);
                                if (!res.success) {
                                    toast.error(res.message || "Invalid Institute");
                                    setInstituteError(res.message || "Invalid Institute");
                                } else {
                                    setForm({ ...form, instituteInput: opt.value });
                                    setInstituteError("");
                                    router.refresh();
                                }
                            } catch (error: any) {
                                toast.error("Error selecting institute");
                                setInstituteError("Error selecting institute");
                            }
                        }}
                    />
                    {instituteError && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-500 text-center"
                        >
                            {instituteError}
                        </motion.p>
                    )}
                </div>
            )}

            {isInstituteSelected && (
                <>
                    {!isApplicationOpen ? (
                        <div className="w-full p-8 flex items-center justify-center">
                            <div className="w-full max-w-xl rounded-2xl bg-white/95 shadow-xl p-8 text-center">
                                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                                    <svg
                                        className="h-8 w-8 text-red-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"
                                        />
                                    </svg>
                                </div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                                    Applications Closed
                                </h2>

                                <p className="text-gray-600 text-base leading-relaxed">
                                    Applications are currently closed. Please contact the
                                    institution for more details.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="w-full p-8 space-y-6">
                            {/* Name Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* First Name */}
                                <div className="space-y-1">
                                    <input
                                        className={`${input} ${firstNameError ? inputError : ""}`}
                                        placeholder="First Name"
                                        required
                                        value={form.firstName}
                                        onChange={handleFirstNameChange}
                                        maxLength={50}
                                    />
                                    <div className="flex justify-between items-center">
                                        {firstNameError ? (
                                            <p className="text-xs text-red-500">{firstNameError}</p>
                                        ) : (
                                            <p className="text-xs text-white/60">
                                                {form.firstName.length}/50 characters
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Last Name */}
                                <div className="space-y-1">
                                    <input
                                        className={`${input} ${lastNameError ? inputError : ""}`}
                                        placeholder="Last Name"
                                        required
                                        value={form.lastName}
                                        onChange={handleLastNameChange}
                                        maxLength={50}
                                    />
                                    <div className="flex justify-between items-center">
                                        {lastNameError ? (
                                            <p className="text-xs text-red-500">{lastNameError}</p>
                                        ) : (
                                            <p className="text-xs text-white/60">
                                                {form.lastName.length}/50 characters
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Email / Mobile */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <input
                                        className={`${input} ${emailError ? inputError : ""}`}
                                        placeholder="Email"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setForm({ ...form, email: value });
                                            if (value.length > 0) {
                                                validateEmail(value);
                                            } else {
                                                setEmailError("");
                                            }
                                        }}
                                    />
                                    {emailError && (
                                        <p className="text-xs text-red-500">{emailError}</p>
                                    )}
                                </div>
                                <div className="space-y-1">
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
                                            className="text-xs text-red-500"
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

                            {/* Captcha Section */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                    {/* Left Side - Captcha Display */}
                                    <div className="space-y-3">
                                        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg  flex justify-center items-center min-h-[120px] shadow-sm">
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
                                                    className="captcha-svg clear-captcha"
                                                    style={{
                                                        filter: "none",
                                                        transform: "scale(1)",
                                                        maxWidth: "100%",
                                                        height: "auto"
                                                    }}
                                                />
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={loadCaptcha}
                                            disabled={captchaLoading}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center space-x-2 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                            <span>{captchaLoading ? "Refreshing..." : " Refresh Captcha"}</span>
                                        </button>
                                    </div>

                                    {/* Right Side - Captcha Input */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-white/90">
                                            Enter Captcha Code
                                        </label>
                                        <div className="space-y-1">
                                            <input
                                                className={`${input} ${captchaError ? inputError : ''} text-lg tracking-wider`}
                                                placeholder="Enter the characters above..."
                                                value={captchaInput}
                                                onChange={handleCaptchaChange}
                                                maxLength={6}
                                                required
                                                autoComplete="off"
                                            />
                                            {captchaError && (
                                                <motion.p
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="text-xs text-red-500"
                                                >
                                                    {captchaError}
                                                </motion.p>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/60 mt-1 flex items-center space-x-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>Case sensitive - enter exactly as shown</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* API Error Message - Below Submit Button */}
                            {apiError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-lg bg-red-100 border border-red-400 text-red-700 text-center"
                                >
                                    <p className="font-medium">{apiError}</p>
                                </motion.div>
                            )}

                            {/* Success/Error Message */}
                            {msg && !apiError && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-lg text-center ${msgType === "error"
                                        ? "bg-red-100 border border-red-400 text-red-700"
                                        : "bg-green-100 border border-green-400 text-green-700"
                                        }`}
                                >
                                    {msg}
                                </motion.div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !!mobileError || !!captchaError || !!firstNameError ||
                                    !!lastNameError || !!emailError || captchaLoading}
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
                        </form>)}
                </>
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