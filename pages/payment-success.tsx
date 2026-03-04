
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard"); // change if needed
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white shadow-lg rounded-xl p-8 text-center max-w-md">
        <div className="text-green-600 text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600">
          Your application fee has been received successfully.
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Redirecting to dashboard...
        </p>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}