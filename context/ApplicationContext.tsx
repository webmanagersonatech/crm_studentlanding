"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ApplicationData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    dateOfBirth: string;
  };
  qualification: {
    degree: string;
    institution: string;
    yearOfPassing: string;
    percentage: string;
  };
  selectedCourse: string;
  paymentMethod: string;
}

interface ApplicationContextType {
  currentStep: number;
  applicationData: ApplicationData;
  setCurrentStep: (step: number) => void;
  updatePersonalInfo: (data: Partial<ApplicationData["personalInfo"]>) => void;
  updateQualification: (
    data: Partial<ApplicationData["qualification"]>
  ) => void;
  setSelectedCourse: (course: string) => void;
  setPaymentMethod: (method: string) => void;
  resetApplication: () => void;
}

const ApplicationContext = createContext<ApplicationContextType | null>(null);

const initialData: ApplicationData = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
  },
  qualification: {
    degree: "",
    institution: "",
    yearOfPassing: "",
    percentage: "",
  },
  selectedCourse: "",
  paymentMethod: "",
};

export const ApplicationProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] =
    useState<ApplicationData>(initialData);

  const updatePersonalInfo = (
    data: Partial<ApplicationData["personalInfo"]>
  ) => {
    setApplicationData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...data },
    }));
  };

  const updateQualification = (
    data: Partial<ApplicationData["qualification"]>
  ) => {
    setApplicationData((prev) => ({
      ...prev,
      qualification: { ...prev.qualification, ...data },
    }));
  };

  const setSelectedCourse = (course: string) => {
    setApplicationData((prev) => ({ ...prev, selectedCourse: course }));
  };

  const setPaymentMethod = (method: string) => {
    setApplicationData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const resetApplication = () => {
    setCurrentStep(1);
    setApplicationData(initialData);
  };

  return (
    <ApplicationContext.Provider
      value={{
        currentStep,
        applicationData,
        setCurrentStep,
        updatePersonalInfo,
        updateQualification,
        setSelectedCourse,
        setPaymentMethod,
        resetApplication,
      }}
    >
      {children}
    </ApplicationContext.Provider>
  );
};

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error("useApplication must be used within ApplicationProvider");
  }
  return context;
};
