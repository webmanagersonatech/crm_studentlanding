


import { useState, FormEvent, useEffect } from "react";
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import { registerStudent, getStudentSettings, getActiveInstitutions } from "@/lib/api";
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
        country: "",
        state: "",
        city: "",
        instituteInput: "",
    });

    const [institutdata, setInstitutdata] = useState<any>(null);
    const [institutions, setInstitutions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

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

    // -------------------- submit --------------------

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!finalInstituteId) return setMsg("Institute is required");

        setLoading(true);
        setMsg("");

        const result = await registerStudent({
            firstname: form.firstName,
            lastname: form.lastName,
            email: form.email,
            mobileNo: form.mobileNo,
            country: form.country,
            state: form.state,
            city: form.city,
            instituteId: finalInstituteId,
        });

        console.log(result, "ll")

        if (!result.success) {
            setMsg(result.message);
            setLoading(false);
            return;
        }
        setRegistered(true);
        // toast.success("Registered successfully ");
        setForm({
            firstName: "",
            lastName: "",
            email: "",
            mobileNo: "",
            country: "",
            state: "",
            city: "",
            instituteInput: "",
        });
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
        value: c.isoCode,
        label: c.name,
    }));

    const stateOptions = State.getStatesOfCountry(form.country).map((s) => ({
        value: s.isoCode,
        label: s.name,
    }));

    const cityOptions = City.getCitiesOfState(form.country, form.state).map((c) => ({
        value: c.name,
        label: c.name,
    }));

    const instituteOptions = institutions.map((i) => ({
        value: i.instituteId,
        label: i.name,
    }));

    // -------------------- render --------------------

    return (
        <AuthShell title="ADMISSION PORTAL - REGISTER" logo={institutdata?.logo || null} size="lg">
            <Toaster position="top-right" />
            {/* Institute */}
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

                    {/* Name */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className={input} placeholder="First Name" required
                            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        />
                        <input className={input} placeholder="Last Name" required
                            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        />
                    </div>

                    {/* Email / Mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className={input} placeholder="Email" required
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <input className={input} placeholder="Mobile Number" required
                            onChange={(e) => setForm({ ...form, mobileNo: e.target.value })}
                        />
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <Select
                            styles={selectStyles}
                            options={countryOptions}
                            placeholder="Search Country..."
                            onChange={(opt: any) =>
                                setForm({ ...form, country: opt.value, state: "", city: "" })
                            }
                        />

                        <Select
                            styles={selectStyles}
                            options={stateOptions}
                            placeholder="Search State..."
                            isDisabled={!form.country}
                            onChange={(opt: any) =>
                                setForm({ ...form, state: opt.value, city: "" })
                            }
                        />

                        <Select
                            styles={selectStyles}
                            options={cityOptions}
                            placeholder="Search City..."
                            isDisabled={!form.state}
                            onChange={(opt: any) =>
                                setForm({ ...form, city: opt.value })
                            }
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
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

                            {/* Animated Tick */}
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
