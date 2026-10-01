"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation";
import Select from "react-select"
import toast, { Toaster } from "react-hot-toast"
import { getLoggedInStudent, createApplication, getStudentApplicationById } from "@/lib/api"
import SignatureCanvas from 'react-signature-canvas';
import { Country, State, City } from "country-state-city"

import { CheckIcon } from "@heroicons/react/24/solid";

interface OptionType {
  value: string
  label: string
}

type Tab = "personal" | "education"
type Step = "program" | "personal" | "education"

type LocationKeys = { country: string; state: string; city: string }

// Address field groups (current + permanent). Names must match the form config exactly.
const LOCATION_GROUPS: LocationKeys[] = [
  { country: "Country", state: "State", city: "City" },
  { country: "Permanent  Country", state: "Permanent  State", city: "Permanent City" },
]

// Fields that keep their own `required` value even when they have `showWhen`
const EXCLUDE_FROM_AUTO_REQUIRED = ["Class 12 Backlogs", "Diploma Backlogs"]

const DEFAULT_COUNTRY_CODE = "IN";
// const BASE_URL = "http://localhost:4000/uploads/"
const BASE_URL = "https://hikabackend.sonastar.com/uploads/";

export default function CourseApplication() {

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [selectedInstitute, setSelectedInstitute] = useState("")
  const [programOptions, setProgramOptions] = useState<OptionType[]>([])
  const [activeStep, setActiveStep] = useState<Step>("program")
  const [student, setStudent] = useState<any>(null);
  const [programId, setProgramId] = useState("")
  const [formConfig, setFormConfig] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [files, setFiles] = useState<Record<string, File>>({})
  const [minApplicantAge, setMinApplicantAge] = useState<number | null>(null)
  const [academicYear, setAcademicYear] = useState<string>("")
  const [applicationSource, setApplicationSource] = useState<"online" | "offline" | "lead">("online");
  const [signatures, setSignatures] = useState<Record<string, SignatureCanvas | null>>({});
  const [signaturesData, setSignaturesData] = useState<Record<string, string>>({});
  const signaturesLoaded = useRef<Record<string, boolean>>({}); // Track loaded signatures
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sameAddress, setSameAddress] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testFields, setTestFields] = useState<Record<string, any[]>>({});

  const inputClass =
    "border border-gray-300 w-full p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#003B73]"

  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map(c => ({
        value: c.isoCode,
        label: c.name,
      })),
    []
  );

  const selectStyles = (hasError: boolean) => ({
    control: (base: any) => ({
      ...base,
      borderColor: hasError ? "#ef4444" : base.borderColor,
      "&:hover": {
        borderColor: hasError ? "#ef4444" : base.borderColor,
      },
    }),
  });

  /* =========================================================
     HELPERS
  ========================================================= */

  const hasPersonalField = (name: string) =>
    formConfig?.personalDetails?.some((section: any) =>
      section.fields.some(
        (f: any) => f.fieldName.toLowerCase() === name.toLowerCase()
      )
    );

  // ✅ A field with showWhen is visible only when its condition is met
  const isFieldVisible = (field: any) =>
    !field.showWhen || formData[field.showWhen.field] === field.showWhen.value;

  const isValidDOB = (dob: string) => {
    if (!dob) return false

    const birthDate = new Date(dob)
    const today = new Date()

    // future date check
    if (birthDate > today) return false

    const minAge = minApplicantAge ?? 16

    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age >= minAge
  }

  // Sum the given subject fields into a target field (auto-calculated totals)
  const syncTotal = (target: string, subjectKeys: string[]) => {
    let total = 0;
    let hasAnyValue = false;

    subjectKeys.forEach(subject => {
      const value = parseFloat(formData[subject] || "0");
      if (!isNaN(value) && value > 0) {
        total += value;
        hasAnyValue = true;
      }
    });

    if (hasAnyValue) {
      total = Math.round(total * 100) / 100;
      const currentTotal = parseFloat(formData[target] || "0");

      if (Math.abs(total - currentTotal) > 0.01) {
        setFormData(prev => ({ ...prev, [target]: total.toString() }));
        setFieldErrors(prev => ({ ...prev, [target]: "" }));
      }
    } else if (formData[target] && formData[target] !== "") {
      setFormData(prev => ({ ...prev, [target]: "" }));
    }
  };

  /* =========================================================
     EFFECTS
  ========================================================= */

  // ✅ FIX 1: showWhen fields become required ONLY when their condition is met
  // (old code compared formData[a] === formData[b] which made hidden fields required)
  useEffect(() => {
    if (!formConfig) return;

    const updateRequiredFields = (details: any[], flag: { changed: boolean }) =>
      details.map((section: any) => ({
        ...section,
        fields: section.fields.map((field: any) => {
          if (EXCLUDE_FROM_AUTO_REQUIRED.includes(field.fieldName)) return field;
          if (!field.showWhen) return field;

          const conditionMet =
            formData[field.showWhen.field] === field.showWhen.value;

          if (field.required === conditionMet) return field;

          flag.changed = true;
          return { ...field, required: conditionMet };
        }),
      }));

    setFormConfig((prev: any) => {
      if (!prev) return prev;
      const flag = { changed: false };
      const personalDetails = updateRequiredFields(prev.personalDetails || [], flag);
      const educationDetails = updateRequiredFields(prev.educationDetails || [], flag);

      // nothing changed -> keep same reference (no extra re-render)
      if (!flag.changed) return prev;

      return { ...prev, personalDetails, educationDetails };
    });
  }, [formData]);

  // English Language Proficiency - dynamic fields per selected test
  useEffect(() => {
    if (!formConfig?.educationDetails) return;

    const proficiencySection = formConfig.educationDetails.find(
      (section: any) => section.sectionName === "English Language Proficiency"
    );

    if (!proficiencySection) return;

    const selectedTestValue = formData["English Proficiency Test"];
    let tests: string[] = [];

    if (Array.isArray(selectedTestValue)) {
      tests = selectedTestValue;
    } else if (typeof selectedTestValue === "string" && selectedTestValue) {
      tests = [selectedTestValue];
    }

    setSelectedTests(tests);

    // Base field templates (excluding the selection field itself)
    const baseFields = [
      { fieldName: "Test Name", label: "Test Name", type: "text", required: false, minLength: 3, maxLength: 50 },
      { fieldName: "Overall Score", label: "Overall Score", type: "any", required: false },
      { fieldName: "Listening", label: "Listening", type: "any", required: false },
      { fieldName: "Reading", label: "Reading", type: "any", required: false },
      { fieldName: "Writing", label: "Writing", type: "text", required: false },
      { fieldName: "Speaking", label: "Speaking", type: "any", required: false },
      { fieldName: "Test Date", label: "Test Date", type: "date", required: false },
      { fieldName: "Score Report ID", label: "Score Report ID", type: "alphanumeric", required: false }
    ];

    const newTestFields: Record<string, any[]> = {};
    const allDynamicFields: any[] = [];

    tests.forEach(test => {
      const testSpecificFields = baseFields.map(field => ({
        ...field,
        fieldName: `${field.fieldName} (${test})`,
        label: `${field.label} (${test})`,
        isDynamic: true,
        parentTest: test,
        originalFieldName: field.fieldName
      }));
      newTestFields[test] = testSpecificFields;
      allDynamicFields.push(...testSpecificFields);
    });

    setTestFields(newTestFields);

    // Immutable update: keep the selection field + dynamic fields
    setFormConfig((prev: any) => {
      if (!prev?.educationDetails) return prev;

      const idx = prev.educationDetails.findIndex(
        (s: any) => s.sectionName === "English Language Proficiency"
      );
      if (idx < 0) return prev;

      const section = prev.educationDetails[idx];
      const selectionField = section.fields.find(
        (f: any) => f.fieldName === "English Proficiency Test"
      );

      const newFields = [selectionField, ...allDynamicFields].filter(Boolean);

      // no change -> don't trigger another render
      const sameFields =
        newFields.length === section.fields.length &&
        newFields.every((f: any, i: number) => f.fieldName === section.fields[i].fieldName);
      if (sameFields) return prev;

      const educationDetails = [...prev.educationDetails];
      educationDetails[idx] = { ...section, fields: newFields };
      return { ...prev, educationDetails };
    });

    // Clean up form data for tests that were deselected
    const removedTests = Object.keys(testFields).filter(test => !tests.includes(test));

    if (removedTests.length > 0) {
      setFormData(prev => {
        const newData = { ...prev };
        removedTests.forEach(test => {
          baseFields.forEach(field => {
            delete newData[`${field.fieldName} (${test})`];
          });
        });
        return newData;
      });
    }

  }, [formData["English Proficiency Test"], formConfig?.educationDetails]);

  // Sibling fields - repeat base fields for each sibling
  useEffect(() => {
    if (!formConfig) return

    const count = Number(formData["Sibling Count"]) || 0

    setFormConfig((prev: any) => {
      if (!prev?.personalDetails) return prev

      const idx = prev.personalDetails.findIndex(
        (s: any) => s.sectionName === "Sibling Details"
      )
      if (idx < 0) return prev

      const section = prev.personalDetails[idx]

      const baseFields = section.fields.filter(
        (f: any) => !f.isCustom && f.fieldName !== "Sibling Count"
      )
      const keptFields = section.fields.filter((f: any) => !f.isCustom)

      const extraFields: any[] = []
      for (let i = 2; i <= count; i++) {
        baseFields.forEach((field: any) => {
          extraFields.push({
            ...field,
            fieldName: `${field.fieldName} ${i}`,
            label: `${field.label} ${i}`,
            isCustom: true,
          })
        })
      }

      const personalDetails = [...prev.personalDetails]
      personalDetails[idx] = { ...section, fields: [...keptFields, ...extraFields] }
      return { ...prev, personalDetails }
    })
  }, [formData["Sibling Count"], !!formConfig])

  // Fetch logged-in student, form config and existing application
  const fetchStudentAndApplication = async () => {
    try {
      const res = await getLoggedInStudent();

      if (!res?.success) {
        toast.error("Failed to fetch student");
        return;
      }

      const { student, settings, formManager } = res.data;
      let finalAcademicYear = settings?.academicYear || ""
      setAcademicYear(finalAcademicYear)
      setStudent(student);

      setMinApplicantAge(settings?.applicantAge ?? 16)

      // Set basic student info
      setSelectedInstitute(student?.instituteId || "");
      setFormData({
        "First Name": student?.firstname || "",
        "Last Name": student?.lastname || "",
        "Full Name": `${student?.firstname || ""} ${student?.lastname || ""}`.trim(),
        "Email Address": student?.email || "",
        "Contact Number": student?.mobileNo || "",
      });

      // Program options
      if (Array.isArray(settings?.courses)) {
        setProgramOptions(
          settings.courses.map((c: any) => ({
            value: c.courseId,
            label: c.name,
          }))
        );
      }

      // Form configuration
      if (!formManager) {
        toast.error("No form configuration found");
        return;
      }
      setFormConfig(formManager);

      // Fetch existing application if applicationId exists
      if (student.applicationId) {
        const appRes = await getStudentApplicationById(student.applicationId);

        if (appRes.success && appRes.data) {
          finalAcademicYear = appRes.data.academicYear || finalAcademicYear

          const appData = appRes.data;

          const source: "online" | "offline" | "lead" = appData.applicationSource || "online";
          setApplicationSource(source);

          const newFormData: Record<string, any> = {};

          // Map personalDetails + educationDetails
          [...(appData.personalDetails || []), ...(appData.educationDetails || [])].forEach(
            (section: any) => {
              Object.entries(section.fields).forEach(([key, value]) => {
                newFormData[key] = value;
              });
            }
          );

          setFormData((prev) => ({ ...prev, ...newFormData }));

          // set program
          setProgramId(appData.programId || "");
          setAcademicYear(finalAcademicYear)
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while fetching student data");
    }
  };

  useEffect(() => {
    fetchStudentAndApplication();
  }, []);

  // Cutoff (12th) auto calculation
  useEffect(() => {
    if (!formConfig?.educationDetails) return;

    const cutoffSection = formConfig.educationDetails.find(
      (section: any) => section.sectionName === "Cutoff Details (12th)"
    );

    if (!cutoffSection) return;

    const hasBiologyField = cutoffSection.fields.some(
      (field: any) => field.fieldName === "Subject3(Biology)"
    );
    const hasMathsField = cutoffSection.fields.some(
      (field: any) => field.fieldName === "Subject3(Mathematics)"
    );

    let physics = parseFloat(formData["Subject1(Physics)"] || "0");
    let chemistry = parseFloat(formData["Subject2(Chemistry)"] || "0");
    let thirdSubject = 0;

    if (isNaN(physics)) physics = 0;
    if (isNaN(chemistry)) chemistry = 0;

    if (hasBiologyField) {
      thirdSubject = parseFloat(formData["Subject3(Biology)"] || "0");
    } else if (hasMathsField) {
      thirdSubject = parseFloat(formData["Subject3(Mathematics)"] || "0");
    } else {
      thirdSubject = parseFloat(
        formData["Subject3(Biology)"] || formData["Subject3(Mathematics)"] || "0"
      );
    }
    if (isNaN(thirdSubject)) thirdSubject = 0;

    const cutoff = (physics / 2) + (chemistry / 2) + thirdSubject;

    if (physics > 0 || chemistry > 0 || thirdSubject > 0) {
      const roundedCutoff = Math.round(cutoff * 100) / 100;
      const currentCutoff = parseFloat(formData["Cutoff"] || "0");

      if (Math.abs(roundedCutoff - currentCutoff) > 0.01) {
        setFormData(prev => ({ ...prev, "Cutoff": roundedCutoff.toString() }));
        setFieldErrors(prev => ({ ...prev, "Cutoff": "" }));
      }
    } else if (formData["Cutoff"] && formData["Cutoff"] !== "") {
      setFormData(prev => ({ ...prev, "Cutoff": "" }));
    }

  }, [
    formData["Subject1(Physics)"],
    formData["Subject2(Chemistry)"],
    formData["Subject3(Biology)"],
    formData["Subject3(Mathematics)"],
    formConfig
  ]);

  // Same as current address
  useEffect(() => {
    if (sameAddress) {
      setFormData((prev) => ({
        ...prev,
        "Permanent  Country": prev["Country"] || "",
        "Permanent  State": prev["State"] || "",
        "Permanent City": prev["City"] || "",
        "Permanent Pincode": prev["Pincode"] || "",
        "Permanent Address": prev["Address"] || "",
      }));
    }
  }, [
    sameAddress,
    formData["Country"],
    formData["State"],
    formData["City"],
    formData["Pincode"],
    formData["Address"],
  ]);

  // Auto-calculate 10th Standard Total Marks
  useEffect(() => {
    if (!formConfig?.educationDetails) return;

    const tenthSection = formConfig.educationDetails.find(
      (section: any) => section.sectionName === "10th Standard  – Marks Details"
    );
    if (!tenthSection) return;

    syncTotal("10th Standard Total Marks", [
      "10th Standard First Language Marks",
      "10th Standard English Marks",
      "10th Standard Mathematics Marks",
      "10th Standard Science Marks",
      "10th Standard Social Science Marks",
    ]);
  }, [
    formData["10th Standard First Language Marks"],
    formData["10th Standard English Marks"],
    formData["10th Standard Mathematics Marks"],
    formData["10th Standard Science Marks"],
    formData["10th Standard Social Science Marks"],
    formConfig
  ]);

  // Auto-calculate 11th Standard Obtained Total Mark
  useEffect(() => {
    if (!formConfig?.educationDetails) return;

    const eleventhMarksSection = formConfig.educationDetails.find(
      (section: any) => section.sectionName === "11th Standard(HSC) – Marks Details"
    );
    if (!eleventhMarksSection) return;

    syncTotal("11th Obtained Total Mark", [
      "11th Language Mark",
      "11th English Mark",
      "11th Mathematics Mark",
      "11th Physics Mark",
      "11th Chemistry Mark",
      "11th Biology Mark",
      "11th Computer Science Mark",
    ]);
  }, [
    formData["11th Language Mark"],
    formData["11th English Mark"],
    formData["11th Mathematics Mark"],
    formData["11th Physics Mark"],
    formData["11th Chemistry Mark"],
    formData["11th Biology Mark"],
    formData["11th Computer Science Mark"],
    formConfig
  ]);

  // Auto-calculate 12th Standard Obtained Total Mark
  useEffect(() => {
    if (!formConfig?.educationDetails) return;

    const twelfthMarksSection = formConfig.educationDetails.find(
      (section: any) => section.sectionName === "12th Standard  – Marks Details"
    );
    if (!twelfthMarksSection) return;

    // Only calculate when result is declared
    if (formData["12th Result Status"] !== "Declared") {
      if (formData["12th Obtained Total Mark"] && formData["12th Obtained Total Mark"] !== "") {
        setFormData(prev => ({ ...prev, "12th Obtained Total Mark": "" }));
      }
      return;
    }

    syncTotal("12th Obtained Total Mark", [
      "12th Language Mark",
      "12th English Mark",
      "12th Mathematics Mark",
      "12th Physics Mark",
      "12th Chemistry Mark",
      "12th Biology Mark",
      "12th Computer Science Mark",
    ]);
  }, [
    formData["12th Result Status"],
    formData["12th Language Mark"],
    formData["12th English Mark"],
    formData["12th Mathematics Mark"],
    formData["12th Physics Mark"],
    formData["12th Chemistry Mark"],
    formData["12th Biology Mark"],
    formData["12th Computer Science Mark"],
    formConfig
  ]);

  // Age from Date of Birth
  useEffect(() => {
    const dob = formData["Date of Birth"];

    if (!dob) {
      setFormData((prev) => (prev["Age"] ? { ...prev, Age: "" } : prev));
      return;
    }

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    setFormData((prev) => ({
      ...prev,
      Age: age.toString(),
    }));
  }, [formData["Date of Birth"]]);

  // Restore step after page reload
  useEffect(() => {
    const savedStep = localStorage.getItem("courseApplicationStep") as Step | null

    if (savedStep) {
      setActiveStep(savedStep)
      localStorage.removeItem("courseApplicationStep")
    }
  }, [])

  // Emergency contact auto-fill
  useEffect(() => {
    const relationship =
      formData["Relationship with Emergency Contact Person"];

    if (!relationship) return;

    if (relationship === "Father") {
      setFormData((prev) => ({
        ...prev,
        "Emergency Contact Name": prev["Father Name"] || "",
        "Emergency Contact Person Primary Contact Number": prev["Father Contact No"] || "",
      }));
    }

    if (relationship === "Mother") {
      setFormData((prev) => ({
        ...prev,
        "Emergency Contact Name": prev["Mother Name"] || "",
        "Emergency Contact Person Primary Contact Number": prev["Mother Contact No"] || "",
      }));
    }

    if (relationship === "Guardian") {
      setFormData((prev) => ({
        ...prev,
        "Emergency Contact Name": prev["Guardian Name"] || "",
        "Emergency Contact Person Primary Contact Number": prev["Guardian Contact No"] || "",
      }));
    }
  }, [
    formData["Relationship with Emergency Contact Person"],
    formData["Father Name"],
    formData["Father Contact No"],
    formData["Mother Name"],
    formData["Mother Contact No"],
    formData["Guardian Name"],
    formData["Guardian Contact No"],
  ]);

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validateField = (field: any, value: any): string => {
    // ✅ FIX 2: declaration is read-only text, never has a value in formData
    if (field.type === "declaration") return "";

    if (field.required && (!value || value.toString().trim() === "")) {
      return `${field.fieldName} is required`;
    }

    if (value && value.toString().trim() !== "") {
      if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Invalid email format";
      }

      if (field.fieldName === "Date of Birth" && field.type === "date") {
        if (!isValidDOB(value)) {
          return `You must be at least ${minApplicantAge ?? 16} years old`;
        }
      }

      if (field.type === "number" || field.type === "decimal") {
        const strValue = value.toString();

        // Zero start validation (decimals like 0.5 are allowed)
        const startsWithZero =
          field.type === "decimal" ? /^0\d/.test(strValue) : strValue.startsWith("0");

        if (strValue.length > 0 && startsWithZero) {
          return `${field.fieldName} cannot start with zero`;
        }

        const numericValue = Number(value);

        if (field.minValue !== undefined && numericValue < field.minValue) {
          return `${field.fieldName} must be at least ${field.minValue}`;
        }

        if (field.maxValue !== undefined && numericValue > field.maxValue) {
          return `${field.fieldName} cannot exceed ${field.maxValue}`;
        }
      }

      // MIN LENGTH VALIDATION
      if (field.minLength && value.toString().length < field.minLength) {
        return `${field.fieldName} must be at least ${field.minLength} characters`;
      }

      // MAX LENGTH VALIDATION
      if (field.maxLength && value.toString().length > field.maxLength) {
        return `${field.fieldName} cannot exceed ${field.maxLength} characters`;
      }
    }

    return "";
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Find the field configuration
    let fieldConfig: any = null;
    ["personal", "education"].forEach(tab => {
      formConfig?.[`${tab}Details`]?.forEach((section: any) => {
        const found = section.fields.find((f: any) => f.fieldName === name);
        if (found) fieldConfig = found;
      });
    });

    if (fieldConfig) {
      const error = validateField(fieldConfig, value);
      setFieldErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }

  const validateProgram = () => {
    if (!programId) {
      toast.error("Please select a program")
      return false
    }
    return true
  }

  // ✅ FIX 3 + 4: skips hidden fields, shows the real errors in a toast,
  // and scrolls to the first invalid field
  const validateSection = (sections?: any[]) => {
    if (!Array.isArray(sections)) return true;

    const newErrors: Record<string, string> = {};

    for (const section of sections) {
      for (const field of section.fields || []) {
        if (!isFieldVisible(field)) continue; // hidden fields can't block submit

        const error = validateField(field, formData[field.fieldName]);
        if (error) newErrors[field.fieldName] = error;
      }
    }

    const errorList = Object.entries(newErrors);

    if (errorList.length > 0) {
      setFieldErrors(prev => ({ ...prev, ...newErrors }));

      toast.error(
        () => (
          <div className="text-sm">
            <p className="font-semibold mb-1">
              Please fix {errorList.length} field{errorList.length > 1 ? "s" : ""}:
            </p>
            <ul className="list-disc ml-4 space-y-0.5">
              {errorList.slice(0, 5).map(([name, msg]) => (
                <li key={name}>{msg}</li>
              ))}
            </ul>
            {errorList.length > 5 && (
              <p className="mt-1 text-xs">+{errorList.length - 5} more</p>
            )}
          </div>
        ),
        { id: "validation-error", duration: 6000 }
      );

      const firstName = errorList[0][0];
      setTimeout(() => {
        document
          .querySelector(`[data-field="${CSS.escape(firstName)}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      return false;
    }

    return true;
  }

  /* =========================================================
     HANDLERS
  ========================================================= */

  const removeField = (tab: Tab, sectionName: string, fieldName: string) => {
    setFormConfig((prev: any) => {
      const sections = prev?.[`${tab}Details`] || []

      const updatedSections = sections.map((section: any) => {
        if (section.sectionName !== sectionName) return section

        return {
          ...section,
          fields: section.fields.filter((f: any) => f.fieldName !== fieldName),
        }
      })

      return {
        ...prev,
        [`${tab}Details`]: updatedSections,
      }
    })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    const newValue = type === "checkbox" ? checked : value

    setFormData(p => ({ ...p, [name]: newValue }))
    setFieldErrors(prev => ({ ...prev, [name]: "" }));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const fieldName = e.target.name;

    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (file.size > MAX_SIZE) {
      toast.error("File must be less than 2MB");
      e.target.value = "";
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only Images, PDF, DOC, DOCX allowed");
      e.target.value = "";
      return;
    }

    setFiles((prev) => ({ ...prev, [fieldName]: file }));
    setFormData((prev) => ({ ...prev, [fieldName]: file.name }));
    setFieldErrors(prev => ({ ...prev, [fieldName]: "" }));
  };

  const mapSectionData = (sections?: any[]) => {
    if (!Array.isArray(sections)) return []
    return sections.map((section) => {
      const sectionObj: any = { sectionName: section.sectionName, fields: {} }
      section.fields.forEach((field: any) => {
        sectionObj.fields[field.fieldName] =
          field.type === "file"
            ? files[field.fieldName]?.name || formData[field.fieldName] || ""
            : field.type === "declaration"
              ? field.declarationText || ""
              : formData[field.fieldName] || ""
      })
      return sectionObj
    })
  }

  const savePersonalDetails = async () => {
    if (!validateSection(formConfig?.personalDetails)) {
      return false;
    }

    try {
      setLoading(true);

      const fd = new FormData();

      fd.append("instituteId", selectedInstitute);
      fd.append("programId", programId);
      fd.append("academicYear", academicYear);
      fd.append("applicationSource", applicationSource);

      fd.append(
        "personalDetails",
        JSON.stringify(mapSectionData(formConfig?.personalDetails))
      );

      formConfig?.personalDetails?.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.type === "file" && files[field.fieldName]) {
            fd.append(field.fieldName, files[field.fieldName]);
          }
        });
      });

      const res = await createApplication(fd, true);

      if (!res?.success) {
        toast.error(res?.message || "Failed to save personal details");
        return false;
      }

      toast.success("Personal details saved");

      localStorage.setItem("courseApplicationStep", "education");

      setTimeout(() => {
        window.location.reload();
      }, 1000);

      return true;
    } catch (err: any) {
      toast.error(err?.message || "Failed to save personal details");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === "program") {
      if (!validateProgram()) return;
      setActiveStep("personal");
      return;
    }

    if (activeStep === "personal") {
      if (!validateSection(formConfig?.personalDetails)) return;
      setFieldErrors({}); // Clear errors when moving to next step

      if (!student?.applicationId) {
        const success = await savePersonalDetails();
        if (!success) return;
      }

      setActiveStep("education");
    }
  };

  const handlePrev = () => {
    setFieldErrors({}); // Clear errors when moving back
    if (activeStep === "education") {
      setActiveStep("personal")
    } else if (activeStep === "personal") {
      setActiveStep("program")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Pressing Enter on an earlier step should go to the next step, not submit
    if (activeStep !== "education") {
      await handleNext()
      return
    }

    if (!selectedInstitute) {
      toast.error("Institute is required")
      return
    }
    if (!validateProgram()) return
    if (!validateSection(formConfig?.educationDetails)) return

    try {
      setLoading(true)
      const fd = new FormData()
      fd.append("instituteId", selectedInstitute)
      fd.append("programId", programId)
      fd.append("academicYear", academicYear)
      fd.append("applicationSource", applicationSource);

      fd.append("personalDetails", JSON.stringify(mapSectionData(formConfig?.personalDetails)))
      fd.append("educationDetails", JSON.stringify(mapSectionData(formConfig?.educationDetails)))
      Object.entries(files).forEach(([key, file]) => fd.append(key, file))

      const res = await createApplication(fd, true)

      if (res?.success) {
        toast.success("Application Updated successfully")
        router.push("/dashboard")
      } else {
        toast.error(res?.message || "Submission failed")
      }
    } catch (err: any) {
      toast.error(err?.message || "Submission failed")
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     RENDER HELPERS
  ========================================================= */

  const renderSignatureField = (field: any) => {
    const existingSignature = formData[field.fieldName];
    const currentSignatureData = signaturesData[field.fieldName] || "";

    return (
      <div className="space-y-2">
        <div className="border rounded p-2 bg-white">
          <SignatureCanvas
            ref={(ref) => {
              if (!ref) return;

              // Only update if ref changed
              setSignatures(prev => {
                if (prev[field.fieldName] === ref) return prev;
                return { ...prev, [field.fieldName]: ref };
              });

              // Load existing signature if available and not already loaded
              if (existingSignature && !signaturesData[field.fieldName] && !signaturesLoaded.current[field.fieldName]) {
                signaturesLoaded.current[field.fieldName] = true;

                setTimeout(() => {
                  const img = new Image();
                  img.onload = () => {
                    ref.clear();
                    ref.fromDataURL(existingSignature);
                    setSignaturesData(prev => ({
                      ...prev,
                      [field.fieldName]: existingSignature
                    }));
                  };
                  img.src = existingSignature;
                }, 100);
              }
            }}
            canvasProps={{
              className: "signature-canvas w-full h-32 border rounded",
              style: { border: "1px solid #ccc" }
            }}
            backgroundColor="rgb(255,255,255)"
            onEnd={() => {
              const currentSig = signatures[field.fieldName];
              if (currentSig) {
                const dataUrl = currentSig.toDataURL();
                setSignaturesData(prev => ({ ...prev, [field.fieldName]: dataUrl }));
                setFormData(prev => ({ ...prev, [field.fieldName]: dataUrl }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: "" }));
              }
            }}
          />
        </div>
        {/* Clear and Download buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const currentSig = signatures[field.fieldName];
              if (currentSig) {
                currentSig.clear();
                setSignaturesData(prev => ({ ...prev, [field.fieldName]: "" }));
                setFormData(prev => ({ ...prev, [field.fieldName]: "" }));
                // Reset loaded flag if cleared
                signaturesLoaded.current[field.fieldName] = false;
              }
            }}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
          {currentSignatureData && (
            <button
              type="button"
              onClick={() => {
                const link = document.createElement("a");
                link.download = `${field.fieldName}.png`;
                link.href = currentSignatureData;
                link.click();
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Download
            </button>
          )}
        </div>
        {currentSignatureData && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Preview:</p>
            <img src={currentSignatureData} alt={`${field.fieldName} preview`} className="h-16 border rounded mt-1" />
          </div>
        )}
      </div>
    );
  };

  // Country / State / City selects (for both current and permanent address)
  const renderLocationSelect = (
    field: any,
    g: LocationKeys,
    hasError: boolean,
    error?: string
  ) => {
    const name = field.fieldName;
    const countryName = formData[g.country];
    const countryCode = Country.getAllCountries().find(c => c.name === countryName)?.isoCode;

    let options: any[] = [];
    let isDisabled = false;
    let placeholder = "";
    let onChange: (val: any) => void = () => { };

    if (name === g.country) {
      options = countryOptions;
      placeholder = "Select Country";
      onChange = (val) =>
        setFormData(p => ({
          ...p,
          [g.country]: val?.label || "",
          [g.state]: "",
          [g.city]: "",
        }));
    } else if (name === g.state) {
      const hasCountryField = hasPersonalField(g.country);
      const code = hasCountryField && countryName ? countryCode : DEFAULT_COUNTRY_CODE;

      options = code
        ? State.getStatesOfCountry(code).map(s => ({ value: s.isoCode, label: s.name }))
        : [];
      isDisabled = hasCountryField && !countryName;
      placeholder = "Select State";
      onChange = (val) =>
        setFormData(p => ({ ...p, [g.state]: val?.label || "", [g.city]: "" }));
    } else {
      const code = countryCode || DEFAULT_COUNTRY_CODE;
      const stateCode = State.getStatesOfCountry(code)
        .find(s => s.name === formData[g.state])?.isoCode;

      if (stateCode) {
        options = City.getCitiesOfState(code, stateCode).map(c => ({
          value: c.name,
          label: c.name,
        }));
      }
      isDisabled = !formData[g.state];
      placeholder = "Select City";
      onChange = (val) =>
        setFormData(p => ({ ...p, [g.city]: val?.label || "" }));
    }

    return (
      <div>
        <Select
          options={options}
          value={options.find(o => o.label === formData[name]) || null}
          onChange={(val) => {
            onChange(val);
            setFieldErrors(prev => ({ ...prev, [name]: "" }));
          }}
          onBlur={() => {
            const err = validateField(field, formData[name]);
            setFieldErrors(prev => ({ ...prev, [name]: err }));
          }}
          isDisabled={isDisabled}
          placeholder={placeholder}
          styles={selectStyles(hasError)}
        />
        {hasError && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const renderField = (field: any) => {
    const value = formData[field.fieldName] ?? (field.type === "checkbox" ? [] : "");
    const error = fieldErrors[field.fieldName];
    const hasError = !!error;

    if (field.fieldName === "Cutoff") {
      return (
        <div>
          <input
            type="text"
            name={field.fieldName}
            value={value || ""}
            readOnly
            disabled
            className={`${inputClass} bg-gray-100 cursor-not-allowed ${hasError ? 'border-red-500' : ''}`}
          />
          {hasError && <p className="text-red-500 text-xs mt-1">{error}</p>}
          <p className="text-xs text-gray-500 mt-1">This field is auto-calculated based on subject marks</p>
        </div>
      );
    }

    /* COUNTRY / STATE / CITY (current + permanent) */
    const locationGroup = LOCATION_GROUPS.find(g =>
      [g.country, g.state, g.city].includes(field.fieldName)
    );
    if (locationGroup) {
      return renderLocationSelect(field, locationGroup, hasError, error);
    }

    /* =========================
       TYPE BASED RENDERING
    ========================= */
    const renderInput = () => {
      switch (field.type) {
        /* TEXTAREA */
        case "textarea":
          return (
            <textarea
              name={field.fieldName}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputClass} ${hasError ? 'border-red-500' : ''}`}
              minLength={field.minLength}
              maxLength={field.maxLength ?? 500}
            />
          );

        case "signature":
          return renderSignatureField(field);

        /* SELECT */
        case "select":
          return (
            <select
              name={field.fieldName}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${inputClass} ${hasError ? 'border-red-500' : ''}`}
            >
              <option value="">Select</option>
              {field.options?.map((o: string) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          );

        /* RADIO */
        case "radiobutton":
          return (
            <div className="space-y-1">
              {field.options?.map((o: string) => (
                <label key={o} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={field.fieldName}
                    value={o}
                    checked={value === o}
                    onChange={() => {
                      setFormData(p => ({ ...p, [field.fieldName]: o }));
                      setFieldErrors(prev => ({ ...prev, [field.fieldName]: "" }));
                    }}
                    onBlur={() => {
                      const err = validateField(field, value);
                      setFieldErrors(prev => ({ ...prev, [field.fieldName]: err }));
                    }}
                  />
                  {o}
                </label>
              ))}
            </div>
          );

        /* CHECKBOX */
        case "checkbox":
          // Special handling for English Proficiency Test checkbox
          if (field.fieldName === "English Proficiency Test") {
            return (
              <div className="space-y-2">
                {field.options?.map((o: string) => (
                  <label key={o} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(value || []).includes(o)}
                      onChange={(e) => {
                        let updated = e.target.checked
                          ? [...(value || []), o]
                          : (value || []).filter((v: string) => v !== o);

                        // Remove "Not yet taken" if any other test is selected
                        if (e.target.checked && o !== "Not yet taken" && updated.includes("Not yet taken")) {
                          updated = updated.filter((v: string) => v !== "Not yet taken");
                        }

                        // If "Not yet taken" is selected, clear other selections
                        if (e.target.checked && o === "Not yet taken") {
                          updated = ["Not yet taken"];
                        }

                        setFormData(p => ({ ...p, [field.fieldName]: updated }));

                        // Clear errors for dynamic fields when selection changes
                        const allDynamicFieldNames = Object.values(testFields).flat().map(f => f.fieldName);
                        setFieldErrors(prev => {
                          const newErrors = { ...prev };
                          allDynamicFieldNames.forEach(name => {
                            delete newErrors[name];
                          });
                          newErrors[field.fieldName] = "";
                          return newErrors;
                        });
                      }}
                      onBlur={() => {
                        const err = validateField(field, value);
                        setFieldErrors(prev => ({ ...prev, [field.fieldName]: err }));
                      }}
                    />
                    {o}
                  </label>
                ))}
                {hasError && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
            );
          }

          // Default checkbox rendering
          return (
            <div className="space-y-1">
              {field.options?.map((o: string) => (
                <label key={o} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={(value || []).includes(o)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...value, o]
                        : value.filter((v: string) => v !== o);

                      setFormData(p => ({ ...p, [field.fieldName]: updated }));
                      setFieldErrors(prev => ({ ...prev, [field.fieldName]: "" }));
                    }}
                    onBlur={() => {
                      const err = validateField(field, value);
                      setFieldErrors(prev => ({ ...prev, [field.fieldName]: err }));
                    }}
                  />
                  {o}
                </label>
              ))}
            </div>
          );

        /* DECLARATION */
        case "declaration":
          return (
            <div>
              <textarea
                ref={(el) => {
                  if (el) {
                    el.style.height = "auto";
                    el.style.height = el.scrollHeight + "px";
                  }
                }}
                name={field.fieldName}
                value={field.declarationText || "No declaration text provided"}
                readOnly
                disabled
                className={`${inputClass} bg-gray-100 cursor-not-allowed ${hasError ? 'border-red-500' : ''}`}
                style={{ overflow: "hidden", resize: "none" }}
                rows={1}
              />
            </div>
          );

        /* NUMBER */
        case "number":
          return (
            <input
              type="text"
              name={field.fieldName}
              value={value}
              disabled={field.fieldName === "Contact Number"}
              className={`${inputClass} ${field.fieldName === "Contact Number"
                ? "bg-gray-100 cursor-not-allowed"
                : ""
                } ${hasError ? 'border-red-500' : ''}`}
              inputMode="numeric"
              maxLength={field.maxLength ?? 15}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/\D/g, "");

                // Don't allow 0 as first value
                if (numericValue === "0") return;

                const num = Number(numericValue);

                // Max value restriction while typing
                if (
                  numericValue &&
                  field.maxValue !== undefined &&
                  num > field.maxValue
                ) {
                  return;
                }

                setFormData((p) => ({ ...p, [field.fieldName]: numericValue }));
                setFieldErrors((prev) => ({ ...prev, [field.fieldName]: "" }));
              }}
              onBlur={(e) => {
                const val = e.target.value;

                if (val.length > 0 && val.startsWith("0")) {
                  setFieldErrors(prev => ({
                    ...prev,
                    [field.fieldName]: `${field.fieldName} cannot start with zero`
                  }));
                } else if (val.length > 0 && field.minLength && val.length < field.minLength) {
                  setFieldErrors(prev => ({
                    ...prev,
                    [field.fieldName]: `${field.fieldName} must be at least ${field.minLength} digits`
                  }));
                } else if (field.maxLength && val.length > field.maxLength) {
                  setFieldErrors(prev => ({
                    ...prev,
                    [field.fieldName]: `${field.fieldName} cannot exceed ${field.maxLength} digits`
                  }));
                } else {
                  handleBlur(e);
                }
              }}
            />
          );

        case "decimal":
          return (
            <input
              type="text"
              name={field.fieldName}
              value={value}
              className={`${inputClass} ${hasError ? 'border-red-500' : ''}`}
              inputMode="decimal"
              onChange={(e) => {
                let val = e.target.value;

                // Allow only number and dot
                val = val.replace(/[^0-9.]/g, "");

                // Only one decimal point
                const parts = val.split(".");
                if (parts.length > 2) {
                  val = parts[0] + "." + parts[1];
                }

                // Don't allow 0
                if (val === "0") return;

                const num = Number(val);

                // Max value restriction while typing
                if (
                  val &&
                  !isNaN(num) &&
                  field.maxValue !== undefined &&
                  num > field.maxValue
                ) {
                  return;
                }

                setFormData((p) => ({ ...p, [field.fieldName]: val }));
                setFieldErrors((prev) => ({ ...prev, [field.fieldName]: "" }));
              }}
              onBlur={handleBlur}
            />
          );

        /* TEXT ONLY */
        case "text":
          return (
            <input
              type="text"
              name={field.fieldName}
              value={value}
              className={`${inputClass} ${hasError ? 'border-red-500' : ''}`}
              minLength={field.minLength}
              maxLength={field.maxLength ?? 100}
              onChange={(e) => {
                const textValue = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                setFormData(p => ({ ...p, [field.fieldName]: textValue }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: "" }));
              }}
              onBlur={handleBlur}
            />
          );

        /* ALPHANUMERIC */
        case "alphanumeric":
          return (
            <input
              type="text"
              name={field.fieldName}
              value={value}
              className={`${inputClass} ${hasError ? 'border-red-500' : ''}`}
              minLength={field.minLength}
              maxLength={field.maxLength ?? 100}
              onChange={(e) => {
                const alphanumericValue = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                setFormData(p => ({ ...p, [field.fieldName]: alphanumericValue }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: "" }));
              }}
              onBlur={handleBlur}
            />
          );

        /* ANY */
        case "any":
          return (
            <input
              type="text"
              name={field.fieldName}
              value={value}
              className={`${inputClass} ${hasError ? 'border-red-500' : ''}`}
              minLength={field.minLength}
              maxLength={field.maxLength ?? 300}
              onChange={(e) => {
                setFormData(p => ({ ...p, [field.fieldName]: e.target.value }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: "" }));
              }}
              onBlur={handleBlur}
            />
          );

        /* FILE */
        case "file": {
          const getExt = (filename: string) => filename?.split(".").pop()?.toLowerCase() || "";
          const isImage = (filename: string) => ["jpg", "jpeg", "png", "webp"].includes(getExt(filename));
          const isPDF = (filename: string) => getExt(filename) === "pdf";
          const isDocument = (filename: string) => ["doc", "docx"].includes(getExt(filename));

          const getFileIcon = (filename: string) => {
            if (isPDF(filename)) return "📄";
            if (isDocument(filename)) return "📝";
            return "📎";
          };

          return (
            <div>
              <input
                type="file"
                name={field.fieldName}
                onChange={handleFileChange}
                onBlur={() => {
                  const err = validateField(field, files[field.fieldName]?.name || formData[field.fieldName]);
                  setFieldErrors(prev => ({ ...prev, [field.fieldName]: err }));
                }}
                className={`${inputClass} ${hasError ? 'border-red-500' : ''}`}
                accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
              />

              {/* Preview for newly uploaded files */}
              {files[field.fieldName] && (
                <div className="mt-2 p-2 border rounded bg-gray-50">
                  {isImage(files[field.fieldName].name) ? (
                    <img
                      src={URL.createObjectURL(files[field.fieldName])}
                      alt="Preview"
                      className="max-h-20 rounded border"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-2xl">{getFileIcon(files[field.fieldName].name)}</span>
                      <span className="text-gray-600 truncate max-w-[200px]">
                        {files[field.fieldName].name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(files[field.fieldName].size / 1024).toFixed(2)} KB)
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Existing file from server */}
              {formData[field.fieldName] && !files[field.fieldName] && (
                <div className="mt-2 p-2 border rounded bg-gray-50">
                  {isImage(formData[field.fieldName]) ? (
                    <img
                      src={`${BASE_URL}${formData[field.fieldName]}`}
                      alt="Current file"
                      className="max-h-20 rounded border"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getFileIcon(formData[field.fieldName])}</span>
                      <a
                        href={`${BASE_URL}${formData[field.fieldName]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 text-sm hover:underline truncate max-w-[200px]"
                      >
                        {formData[field.fieldName]}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        }

        default:
          return (
            <input
              type={field.type}
              name={field.fieldName}
              value={value}
              disabled={
                field.fieldName === "Email Address" ||
                field.fieldName === "Contact Number"
              }
              onChange={(e) => {
                setFormData(p => ({ ...p, [field.fieldName]: e.target.value }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: "" }));
              }}
              onBlur={handleBlur}
              className={`${inputClass} ${field.fieldName === "Email Address" ||
                field.fieldName === "Contact Number"
                ? "bg-gray-100 cursor-not-allowed"
                : ""
                } ${hasError ? 'border-red-500' : ''}`}
              maxLength={field.maxLength || undefined}
            />
          );
      }
    };

    return (
      <div>
        {renderInput()}
        {hasError && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  };

  const steps = ["program", "personal", "education"];

  return (
    <div className="w-full px-3 sm:px-6 lg:px-0 flex justify-center overflow-x-hidden ">
      {/* ✅ FIX 5: noValidate -> browser never blocks submit silently; our toast shows the errors */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-5xl bg-white rounded-2xl  border border-gray-100 
  p-4 sm:p-6 md:p-8 space-y-8 overflow-hidden"
      >
        <Toaster position="top-right" />

        {/* STEP PROGRESS */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {steps.map((step, index) => {

              const isActive = activeStep === step;
              const isCompleted = steps.indexOf(activeStep) > index;

              return (
                <div key={step} className="flex items-center w-full sm:flex-1">
                  {/* Step Circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all 
                  ${isCompleted ? "bg-indigo-600 text-white shadow-lg" : isActive ? "border-2 border-indigo-600 text-indigo-600 bg-white shadow-md" : "border border-gray-300 text-gray-400 bg-white"}
                `}
                  >
                    {isCompleted ? <CheckIcon className="h-6 w-6" /> : index + 1}
                  </div>

                  {/* Step Label */}
                  <div className="flex flex-col ml-4">
                    <span
                      className={`text-sm font-semibold tracking-wide capitalize transition-colors 
                    ${isActive ? "text-indigo-700" : isCompleted ? "text-gray-800" : "text-gray-400"}
                  `}
                    >
                      {step}
                    </span>
                    <span className="text-xs text-gray-400">
                      {step === "program" && "Choose your course"}
                      {step === "personal" && "Fill your details"}
                      {step === "education" && "Provide education info"}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-2 mx-4 rounded-full transition-all 
                    ${isCompleted ? "bg-indigo-600" : "bg-gray-200"}
                  `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1 — PROGRAM */}
        {activeStep === "program" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">Select Program</h2>
            <Select
              options={programOptions}
              value={programOptions.find((p) => p.value === programId) || null}
              onChange={(o) => setProgramId(o?.value || "")}
              placeholder="Choose your program"
              menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
              menuPosition="fixed"
            />
          </div>
        )}

        {/* STEP 2 — PERSONAL */}
        {activeStep === "personal" && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">Personal Details</h2>
            {formConfig?.personalDetails?.map((section: any) => {
              const visibleFields = section.fields.filter(isFieldVisible);

              if (visibleFields.length === 0) return null;

              return (
                <div key={section.sectionName} className="rounded-xl bg-gray-50/80 p-6">
                  {/* HEADER */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider">
                      {section.sectionName === "Personal Details"
                        ? "Student Details"
                        : section.sectionName}
                    </h3>

                    {section.sectionName === "Permanent Address Details" && (
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={sameAddress}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setSameAddress(checked);

                            if (checked) {
                              setFormData((prev) => ({
                                ...prev,
                                "Permanent  Country": prev["Country"] || "",
                                "Permanent  State": prev["State"] || "",
                                "Permanent City": prev["City"] || "",
                                "Permanent Pincode": prev["Pincode"] || "",
                                "Permanent Address": prev["Address"] || "",
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                "Permanent  Country": "",
                                "Permanent  State": "",
                                "Permanent City": "",
                                "Permanent Pincode": "",
                                "Permanent Address": "",
                              }));
                            }
                          }}
                        />
                        Same as Current Address
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleFields.map((f: any) => (
                      <div
                        key={f.fieldName}
                        data-field={f.fieldName}
                        className={`relative flex flex-col ${f.type === "declaration"
                          ? "col-span-1 sm:col-span-2 lg:col-span-3"
                          : ""
                          }`}
                      >
                        {f.isCustom && (
                          <button
                            type="button"
                            onClick={() =>
                              removeField("personal", section.sectionName, f.fieldName)
                            }
                            className="absolute top-1 right-1 text-red-500 text-sm"
                          >
                            ✕
                          </button>
                        )}

                        <label className="text-xs font-medium text-gray-600 mb-1">
                          {f.fieldName}
                          {f.required && <span className="text-red-500"> *</span>}
                        </label>

                        {renderField(f)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 3 — EDUCATION */}
        {activeStep === "education" && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">Education Details</h2>
            {formConfig?.educationDetails?.map((section: any) => {
              const visibleFields = section.fields.filter(isFieldVisible);

              if (visibleFields.length === 0) return null;

              return (
                <div
                  key={section.sectionName}
                  className="rounded-xl bg-gray-50/80 p-6"
                >
                  <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-5">
                    {section.sectionName}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleFields.map((f: any) => (
                      <div
                        key={f.fieldName}
                        data-field={f.fieldName}
                        className={`relative flex flex-col ${f.type === "declaration"
                          ? "col-span-1 sm:col-span-2 lg:col-span-3"
                          : ""
                          }`}
                      >
                        <label className="text-xs font-medium text-gray-600 mb-1">
                          {f.fieldName}
                          {f.required && <span className="text-red-500"> *</span>}
                        </label>

                        {renderField(f)}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-b from-[#003B73] to-[#0057A0] hover:bg-indigo-700 transition text-white py-3 rounded-xl font-medium disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="flex justify-between pt-8">
          {activeStep !== "program" && (
            <button type="button" onClick={handlePrev} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition">← Previous</button>
          )}
          {activeStep !== "education" && (
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="ml-auto px-6 py-2 rounded-lg bg-gradient-to-b from-[#003B73] to-[#0057A0] text-white hover:bg-indigo-700 transition"
            >
              {loading
                ? "Saving..."
                : activeStep === "personal"
                  ? "Save & Next →"
                  : "Next →"}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}