

import { useApplication } from "@/context/ApplicationContext";
import {
  FaBook,
  FaUser,
  FaGraduationCap,
  FaCreditCard,
  FaCheckCircle,
} from "react-icons/fa";

export function StepNavigation() {
  const { currentStep, setCurrentStep, applicationData } = useApplication();

  const steps = [
    {
      id: 1,
      label: "Course Selection",
      icon: FaBook,
      required: "Select a course",
    },
    {
      id: 2,
      label: "Personal Details",
      icon: FaUser,
      required: "Fill personal info",
    },
    {
      id: 3,
      label: "Qualification",
      icon: FaGraduationCap,
      required: "Add education",
    },
    { id: 4, label: "Payment", icon: FaCreditCard, required: "Make payment" },
  ];

  return (
    <div className="w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <h3 className="font-bold text-gray-800 text-lg mb-6">
        Application Progress
      </h3>

      <div className="space-y-4">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          return (
            <div key={step.id} className="relative">
              {/* Connector Line */}
              {step.id > 1 && (
                <div
                  className={`absolute left-5 top-0 h-6 w-0.5 -translate-y-full ${
                    currentStep >= step.id ? "bg-blue-500" : "bg-gray-200"
                  }`}
                />
              )}

              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-4 w-full p-4 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-50 border-l-4 border-blue-500"
                    : isCompleted
                    ? "bg-green-50"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* Step Icon */}
                <div
                  className={`relative flex-shrink-0 ${
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-blue-100"
                        : isCompleted
                        ? "bg-green-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {isCompleted ? (
                      <FaCheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Step Info */}
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-medium ${
                        isActive
                          ? "text-blue-800"
                          : isCompleted
                          ? "text-green-800"
                          : "text-gray-700"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCompleted && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isActive ? "Current step" : step.required}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-bold text-blue-600">
            {Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Course Info */}
      {applicationData.selectedCourse && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800">Selected Course</p>
          <p className="text-blue-600 font-semibold mt-1">
            {applicationData.selectedCourse === "bba"
              ? "BBA"
              : applicationData.selectedCourse === "mba"
              ? "MBA"
              : applicationData.selectedCourse === "bca"
              ? "BCA"
              : applicationData.selectedCourse === "bcom"
              ? "B.Com"
              : "M.Com"}
          </p>
        </div>
      )}
    </div>
  );
}
