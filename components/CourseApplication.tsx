
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import Select from "react-select"
import toast, { Toaster } from "react-hot-toast"
import { getLoggedInStudent, createApplication, getStudentApplicationById } from "@/lib/api"

import { Country, State, City } from "country-state-city"

import { CheckIcon } from "@heroicons/react/24/solid";

interface OptionType {
  value: string
  label: string
}

type Tab = "personal" | "education"
type Step = "program" | "personal" | "education"

export default function CourseApplication() {

  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [selectedInstitute, setSelectedInstitute] = useState("")
  const [programOptions, setProgramOptions] = useState<OptionType[]>([])
  const [activeStep, setActiveStep] = useState<Step>("program")
  const [student, setStudent] = useState<any>(null);
  const [program, setProgram] = useState("")
  const [formConfig, setFormConfig] = useState<any>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [files, setFiles] = useState<Record<string, File>>({})
  const [minApplicantAge, setMinApplicantAge] = useState<number | null>(null)
  const [academicYear, setAcademicYear] = useState<string>("")
  const [applicationSource, setApplicationSource] = useState<"online" | "offline" | "lead">("online");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // const BASE_URL = "http://localhost:4000/uploads/"
  const BASE_URL = "https://hikabackend.sonastar.com/uploads/";
  const inputClass =
    "border border-gray-300 w-full p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#003B73]"

  // Auto-generate sibling fields
  const DEFAULT_COUNTRY_CODE = "IN";

  const hasPersonalField = (name: string) =>
    formConfig?.personalDetails?.some((section: any) =>
      section.fields.some(
        (f: any) => f.fieldName.toLowerCase() === name.toLowerCase()
      )
    );
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
  const validateField = (field: any, value: any): string => {
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
    }

    return "";
  };
  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Find the field configuration
    let fieldConfig = null;
    ['personal', 'education'].forEach(tab => {
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
  const countryOptions = Country.getAllCountries().map(c => ({
    value: c.isoCode,
    label: c.name,
  }));

 

  useEffect(() => {
    const count = Number(formData["Sibling Count"]) || 0
    if (!formConfig) return

    const siblingSection = formConfig.personalDetails.find(
      (s: any) => s.sectionName === "Sibling Details"
    )
    if (!siblingSection) return

    const baseFields = siblingSection.fields.filter(
      (f: any) => !f.isCustom && f.fieldName !== "Sibling Count"
    )

    siblingSection.fields = siblingSection.fields.filter(
      (f: any) => !f.isCustom
    )

    for (let i = 2; i <= count; i++) {
      baseFields.forEach((field: any) => {
        siblingSection.fields.push({
          ...field,
          fieldName: `${field.fieldName} ${i}`,
          label: `${field.label} ${i}`,
          isCustom: true,
        })
      })
    }

    setFormConfig({ ...formConfig })
  }, [formData["Sibling Count"]])

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

  // Fetch logged-in student and form config

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

      setMinApplicantAge(settings.applicantAge ?? 16)


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
        setProgramOptions(settings.courses.map((c: string) => ({ value: c, label: c })));
      }

      // Form configuration
      if (!formManager) {
        toast.error("No form configuration found");
        return;
      }
      setFormConfig(formManager);

      // ✅ Fetch existing application if applicationId exists
      if (student.applicationId) {
        const appRes = await getStudentApplicationById(student.applicationId);

        if (appRes.success && appRes.data) {
          finalAcademicYear = appRes.data.academicYear || finalAcademicYear

          const appData = appRes.data;

          const source: "online" | "offline" | "lead" = appData.applicationSource || "online";

          setApplicationSource(source);

          const newFormData: Record<string, any> = {};
          const newFiles: Record<string, File | string> = {};

          // Map personalDetails
          appData.personalDetails?.forEach((section: any) => {
            Object.entries(section.fields).forEach(([key, value]) => {
              newFormData[key] = value;

              // If the field is a file, keep string for preview
              if (typeof value === "string" && value.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
                newFiles[key] = value;
              }
            });
          });

          // Map educationDetails
          appData.educationDetails?.forEach((section: any) => {
            Object.entries(section.fields).forEach(([key, value]) => {
              newFormData[key] = value;

              if (typeof value === "string" && value.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
                newFiles[key] = value;
              }
            });
          });

          setFormData((prev) => ({ ...prev, ...newFormData }));

          // seet program
          setProgram(appData.program || "");
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





  const validateProgram = () => {
    if (!program) {
      toast.error("Please select a program")
      return false
    }
    return true
  }

  const validateSection = (sections?: any[]) => {
    if (!Array.isArray(sections)) return true

    let isValid = true;
    const newErrors: Record<string, string> = {};

    for (const section of sections) {
      for (const field of section.fields || []) {
        const value = formData[field.fieldName];
        const error = validateField(field, value);

        if (error) {
          newErrors[field.fieldName] = error;
          isValid = false;
        }
      }
    }

    setFieldErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    const newValue = type === "checkbox" ? checked : value

    setFormData(p => ({ ...p, [name]: newValue }))

    // Clear error when user starts typing
    setFieldErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles((p) => ({ ...p, [e.target.name]: file }))
      setFormData((p) => ({ ...p, [e.target.name]: file.name }))

      // Clear error on file selection
      setFieldErrors(prev => ({
        ...prev,
        [e.target.name]: ''
      }));
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.fieldName] ?? (field.type === "checkbox" ? [] : "");
    const error = fieldErrors[field.fieldName];
    const hasError = !!error;

    /* =========================
       COUNTRY
    ========================= */
    if (field.fieldName === "Country") {
      return (
        <div>
          <Select
            options={countryOptions}
            value={countryOptions.find(o => o.label === formData.Country) || null}
            onChange={(val) => {
              setFormData(p => ({
                ...p,
                Country: val?.label || "",
                State: "",
                City: "",
              }));
              setFieldErrors(prev => ({ ...prev, Country: '' }));
            }}
            onBlur={() => {
              const error = validateField(field, formData.Country);
              setFieldErrors(prev => ({ ...prev, Country: error }));
            }}
            placeholder="Select Country"
            styles={{
              control: (base) => ({
                ...base,
                borderColor: hasError ? '#ef4444' : base.borderColor,
                '&:hover': {
                  borderColor: hasError ? '#ef4444' : base.borderColor,
                }
              })
            }}
          />
          {hasError && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    }

    /* =========================
       STATE
    ========================= */
    if (field.fieldName === "State") {
      let options: any[] = [];

      if (hasPersonalField("Country") && formData.Country) {
        const countryCode = Country.getAllCountries()
          .find(c => c.name === formData.Country)?.isoCode;

        options = countryCode
          ? State.getStatesOfCountry(countryCode).map(s => ({
            value: s.isoCode,
            label: s.name,
          }))
          : [];
      } else {
        options = State.getStatesOfCountry(DEFAULT_COUNTRY_CODE).map(s => ({
          value: s.isoCode,
          label: s.name,
        }));
      }

      return (
        <div>
          <Select
            options={options}
            value={options.find(o => o.label === formData.State) || null}
            onChange={(val) => {
              setFormData(p => ({ ...p, State: val?.label || "", City: "" }));
              setFieldErrors(prev => ({ ...prev, State: '' }));
            }}
            onBlur={() => {
              const error = validateField(field, formData.State);
              setFieldErrors(prev => ({ ...prev, State: error }));
            }}
            isDisabled={hasPersonalField("Country") && !formData.Country}
            placeholder="Select State"
            styles={{
              control: (base) => ({
                ...base,
                borderColor: hasError ? '#ef4444' : base.borderColor,
                '&:hover': {
                  borderColor: hasError ? '#ef4444' : base.borderColor,
                }
              })
            }}
          />
          {hasError && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
    }

    /* =========================
       CITY
    ========================= */
    if (field.fieldName === "City") {
      let options: any[] = [];

      const countryCode =
        Country.getAllCountries().find(c => c.name === formData.Country)
          ?.isoCode || DEFAULT_COUNTRY_CODE;

      const stateCode =
        State.getStatesOfCountry(countryCode)
          .find(s => s.name === formData.State)?.isoCode;

      if (stateCode) {
        options = City.getCitiesOfState(countryCode, stateCode).map(c => ({
          value: c.name,
          label: c.name,
        }));
      }

      return (
        <div>
          <Select
            options={options}
            value={options.find(o => o.label === formData.City) || null}
            onChange={(val) => {
              setFormData(p => ({ ...p, City: val?.label || "" }));
              setFieldErrors(prev => ({ ...prev, City: '' }));
            }}
            onBlur={() => {
              const error = validateField(field, formData.City);
              setFieldErrors(prev => ({ ...prev, City: error }));
            }}
            isDisabled={!formData.State}
            placeholder="Select City"
            styles={{
              control: (base) => ({
                ...base,
                borderColor: hasError ? '#ef4444' : base.borderColor,
                '&:hover': {
                  borderColor: hasError ? '#ef4444' : base.borderColor,
                }
              })
            }}
          />
          {hasError && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      );
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
              maxLength={field.maxLength ?? 500}
            />
          );

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
                      setFormData(p => ({
                        ...p,
                        [field.fieldName]: o,
                      }));
                      setFieldErrors(prev => ({ ...prev, [field.fieldName]: '' }));
                    }}
                    onBlur={() => {
                      const error = validateField(field, value);
                      setFieldErrors(prev => ({ ...prev, [field.fieldName]: error }));
                    }}
                  />
                  {o}
                </label>
              ))}
            </div>
          );

        /* CHECKBOX */
        case "checkbox":
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

                      setFormData(p => ({
                        ...p,
                        [field.fieldName]: updated,
                      }));
                      setFieldErrors(prev => ({ ...prev, [field.fieldName]: '' }));
                    }}
                    onBlur={() => {
                      const error = validateField(field, value);
                      setFieldErrors(prev => ({ ...prev, [field.fieldName]: error }));
                    }}
                  />
                  {o}
                </label>
              ))}
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
                setFormData(p => ({ ...p, [field.fieldName]: numericValue }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: '' }));
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
              maxLength={field.maxLength ?? 100}
              onChange={(e) => {
                const textValue = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                setFormData(p => ({ ...p, [field.fieldName]: textValue }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: '' }));
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
              maxLength={field.maxLength ?? 100}
              onChange={(e) => {
                const alphanumericValue = e.target.value.replace(/[^a-zA-Z0-9\s]/g, "");
                setFormData(p => ({ ...p, [field.fieldName]: alphanumericValue }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: '' }));
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
              maxLength={field.maxLength ?? 300}
              onChange={(e) => {
                setFormData(p => ({ ...p, [field.fieldName]: e.target.value }));
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: '' }));
              }}
              onBlur={handleBlur}
            />
          );

        /* FILE */
        case "file":
          const isImage = (filename: string) => {
            const ext = filename?.split('.').pop()?.toLowerCase();
            return ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '');
          };

          const isPDF = (filename: string) => {
            const ext = filename?.split('.').pop()?.toLowerCase();
            return ext === 'pdf';
          };

          const isDocument = (filename: string) => {
            const ext = filename?.split('.').pop()?.toLowerCase();
            return ['doc', 'docx'].includes(ext || '');
          };

          const getFileIcon = (filename: string) => {
            if (isPDF(filename)) return '📄';
            if (isDocument(filename)) return '📝';
            return '📎';
          };

          const currentFile = files[field.fieldName]?.name || formData[field.fieldName];

          return (
            <div>
              <input
                type="file"
                name={field.fieldName}
                onChange={handleFileChange}
                onBlur={() => {
                  const error = validateField(field, files[field.fieldName]?.name || formData[field.fieldName]);
                  setFieldErrors(prev => ({ ...prev, [field.fieldName]: error }));
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
                      onLoad={() => URL.revokeObjectURL(URL.createObjectURL(files[field.fieldName]))}
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
                setFieldErrors(prev => ({ ...prev, [field.fieldName]: '' }));
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


  useEffect(() => {
    const savedStep = localStorage.getItem("courseApplicationStep") as Step | null

    if (savedStep) {
      setActiveStep(savedStep)
      localStorage.removeItem("courseApplicationStep")
    }
  }, [])



  const handlePrev = () => {
    if (activeStep === "education") {
      setFieldErrors({}); // Clear errors when moving back
      setActiveStep("personal")
    }
    else if (activeStep === "personal") {
      setFieldErrors({}); // Clear errors when moving back
      setActiveStep("program")
    }
  }

  const mapSectionData = (sections?: any[]) => {
    if (!Array.isArray(sections)) return []
    return sections.map((section) => {
      const sectionObj: any = { sectionName: section.sectionName, fields: {} }
      section.fields.forEach((field: any) => {
        sectionObj.fields[field.fieldName] =
          field.type === "file" ? files[field.fieldName]?.name || formData[field.fieldName] || "" : formData[field.fieldName] || ""
      })
      return sectionObj
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      fd.append("program", program)
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

  const savePersonalDetails = async () => {
    if (!validateSection(formConfig?.personalDetails)) return false
    try {
      setLoading(true)

      const fd = new FormData()
      fd.append("instituteId", selectedInstitute)
      fd.append("program", program)
      fd.append("academicYear", academicYear)
      fd.append("applicationSource", applicationSource);
      fd.append(
        "personalDetails",
        JSON.stringify(mapSectionData(formConfig?.personalDetails))
      )

      // only personal files
      formConfig?.personalDetails?.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.type === "file" && files[field.fieldName]) {
            fd.append(field.fieldName, files[field.fieldName])
          }
        })
      })

      await createApplication(fd, true)
      toast.success("Personal details saved")
      localStorage.setItem("courseApplicationStep", "education")

      window.location.reload()

      return true
    } catch (err: any) {
      toast.error(err?.message || "Failed to save personal details")
      return false
    } finally {
      setLoading(false)
    }
  }

  const steps = ["program", "personal", "education"];

  return (
    <div className="w-full px-3 sm:px-6 lg:px-0 flex justify-center overflow-x-hidden ">
      <form onSubmit={handleSubmit} className="w-full max-w-5xl bg-white rounded-2xl  border border-gray-100 
  p-4 sm:p-6 md:p-8 space-y-8 overflow-hidden">
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
                    {/* Optional subtitle for a “royal feel” */}
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
            <Select options={programOptions} value={programOptions.find((p) => p.value === program) || null} onChange={(o) => setProgram(o?.value || "")} placeholder="Choose your program" />
          </div>
        )}

        {/* STEP 2 — PERSONAL */}
        {activeStep === "personal" && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">Personal Details</h2>
            {formConfig?.personalDetails?.map((section: any) => (
              <div key={section.sectionName} className="rounded-xl bg-gray-50/80 p-6">
                <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-5">{section.sectionName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.fields.map((f: any) => (
                    <div key={f.fieldName} className="relative flex flex-col">
                      {f.isCustom && (
                        <button type="button" onClick={() => removeField("personal", section.sectionName, f.fieldName)} className="absolute top-1 right-1 text-red-500 text-sm">✕</button>
                      )}
                      <label className="text-xs font-medium text-gray-600 mb-1">
                        {f.fieldName}{f.required && <span className="text-red-500"> *</span>}
                      </label>
                      {renderField(f)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 3 — EDUCATION */}
        {activeStep === "education" && (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-gray-800 tracking-wide">Education Details</h2>
            {formConfig?.educationDetails?.map((section: any) => (
              <div key={section.sectionName} className="rounded-xl bg-gray-50/80 p-6">
                <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-5">{section.sectionName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {section.fields.map((f: any) => (
                    <div key={f.fieldName} className="flex flex-col">
                      <label className="text-xs font-medium text-gray-600 mb-1">
                        {f.fieldName}{f.required && <span className="text-red-500"> *</span>}
                      </label>
                      {renderField(f)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading} className="w-full bg-gradient-to-b from-[#003B73] to-[#0057A0] hover:bg-indigo-700 transition text-white py-3 rounded-xl font-medium">
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
