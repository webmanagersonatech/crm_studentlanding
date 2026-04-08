import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { setInstituteCookie } from "@/lib/api";
import { motion } from "framer-motion"; // Install: npm install framer-motion
import Head from "next/head";
export default function InstitutePage() {
    const router = useRouter();
    const { instituteId } = router.query;

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!instituteId) return;

        const callApi = async () => {
            const res = await setInstituteCookie(instituteId as string);

            if (!res.success) {
                setError(res.message || "Invalid Institute");
                setLoading(false);
            } else {
                // ✅ SUCCESS → redirect to home
                router.replace("/"); // no back button return
            }
        };

        callApi();
    }, [instituteId]);

    // ⏳ Loading UI with animations
  if (loading) {
        return (
            <>
                <Head>
                    <title>HikaApp</title>
                </Head>

                <div className="flex items-center justify-center h-screen bg-white">

                    {/* Animated Loader */}
                    <motion.div
                        className="flex flex-col items-center space-y-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {/* Spinner */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                repeat: Infinity,
                                duration: 1,
                                ease: "linear"
                            }}
                            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
                        />

                        {/* Optional subtle text */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5
                            }}
                            className="text-blue-500 text-sm tracking-widest"
                        >
                            LOADING...
                        </motion.p>
                    </motion.div>

                </div>
            </>
        );
    }

    // ❌ Error UI with animations and better design
    if (error) {
        return (
            <>
                <Head>
                    <title>HikaApp</title>
                </Head>

                <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-orange-50">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
                    >
                        {/* Error Icon Animation */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="relative mb-6"
                        >
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                                <motion.svg
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                    className="w-12 h-12 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </motion.svg>
                            </div>
                        </motion.div>

                        {/* Error Title */}
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-2xl font-bold text-center text-gray-800 mb-2"
                        >
                            Oops! Something went wrong
                        </motion.h2>

                        {/* Error Message Card */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6"
                        >
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                    {instituteId && (
                                        <p className="text-xs text-red-500 mt-1">
                                            Institute ID: {instituteId}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>



                        {/* Help Text */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-xs text-center text-gray-500 mt-6"
                        >
                            If the problem persists, please contact support
                        </motion.p>
                    </motion.div>

                </div>
            </>
        );
    }

    return null; // nothing shown on success (since redirect happens)
}