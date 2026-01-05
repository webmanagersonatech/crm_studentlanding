

import React from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

const BackButton: React.FC = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="
        flex items-center gap-2 px-5 py-2 my-6
         bg-gradient-to-b from-[#003B73] to-[#0057A0]
        text-white font-semibold
        rounded-lg shadow-lg
        hover:from-[#002855] hover:to-[#004080] 
        focus:outline-none focus:ring-2 focus:ring-[#3d4f91]
        transition-all duration-300 ease-in-out
      "
    >
      <FaArrowLeft className="w-5 h-5" />
      Back
    </button>
  );
};

export default BackButton;
