

import { Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";


import BackButton from "@/components/Backbutton";

import { changeStudentPasswordafterlogin } from "@/lib/api";
import CryptoJS from "crypto-js";
import { AppShell } from "@/components/AppShell";
import toast, { Toaster } from "react-hot-toast";

const SECRET_KEY = "sonacassecretkey@2025";

export default function ChangepasswordPage() {
  const inputClass =
    "w-full border border-[#0057A0] p-2 rounded bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#0057A0]";
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error("Please fill all fields");
    }

    if (newPassword !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      setLoading(true);

      const encryptedOld = CryptoJS.AES.encrypt(currentPassword, SECRET_KEY).toString();
      const encryptedNew = CryptoJS.AES.encrypt(newPassword, SECRET_KEY).toString();
      const encryptedConfirm = CryptoJS.AES.encrypt(confirmPassword, SECRET_KEY).toString();

      const res = await changeStudentPasswordafterlogin({
        oldPassword: encryptedOld,
        newPassword: encryptedNew,
        confirmPassword: encryptedConfirm,
      });

      if (!res.success) {
        return toast.error(res.message); // show backend error
      }

      toast.success(res.message); // show backend success

      // Redirect after success
      setTimeout(() => {
        router.push("/"); // navigate to home
      }, 1000); // optional delay to show toast

    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };




  return (
    <AppShell>
      <div className="p-6">
        <Toaster position="top-right" />
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Change Password
          </h1>
        </div>

        <BackButton />

        <div className="flex items-center justify-center mt-6">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-xl bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-lg space-y-6"
          >
            {/* Current Password */}
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                placeholder="Current Password"
                className={inputClass}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </span>
            </div>

            {/* New Password */}
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                placeholder="New Password"
                className={inputClass}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </span>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="
  w-full py-2 font-semibold text-white rounded-lg shadow-md
  bg-gradient-to-b from-[#003B73] to-[#0057A0]
  hover:from-[#002855] hover:to-[#004080] 
  transition-all duration-300
  disabled:opacity-50
"

            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

