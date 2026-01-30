
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



  const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"]
  // const BASE_URL = "http://localhost:4000/uploads/"
   const BASE_URL = "http://160.187.54.80:5000/uploads/";
  const inputClass =
    "border border-gray-300 p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#003B73]"

  // Auto-generate sibling fields
  const DEFAULT_COUNTRY_CODE = "IN";

  const hasPersonalField = (name: string) =>
    formConfig?.personalDetails?.some((section: any) =>
      section.fields.some(
        (f: any) => f.fieldName.toLowerCase() === name.toLowerCase()
      )
    );


  const countryOptions = Country.getAllCountries().map(c => ({
    value: c.isoCode,
    label: c.name,
  }));

  const getStateOptions = (countryCode: string) =>
    State.getStatesOfCountry(countryCode).map(s => ({
      value: s.isoCode,
      label: s.name,
    }));

  const getCityOptions = (countryCode: string, stateCode: string) =>
    City.getCitiesOfState(countryCode, stateCode).map(c => ({
      value: c.name,
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

    for (const section of sections) {
      for (const field of section.fields || []) {
        if (!field.required) continue

        if (field.type === "file") {
          if (!files[field.fieldName] && !formData[field.fieldName]) {
            toast.error(`${field.fieldName} is required`)
            return false
          }
          continue
        }

        const value = formData[field.fieldName]
        if (!value || value.toString().trim() === "") {
          toast.error(`${field.fieldName} is required`)
          return false
        }

        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          toast.error("Invalid email format")
          return false
        }
        if (field.fieldName === "Date of Birth" && field.type === "date") {
          const dob = new Date(value);
          const today = new Date();

          let age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          const dayDiff = today.getDate() - dob.getDate();

          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
          }

          const minAge = minApplicantAge ?? 16; // fallback safety

          if (age < minAge) {
            toast.error(`You must be at least ${minAge} years old`);
            return false;
          }
        }

      }
    }

    return true
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFiles((p) => ({ ...p, [e.target.name]: file }))
      setFormData((p) => ({ ...p, [e.target.name]: file.name }))
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.fieldName] || (field.type === "checkbox" ? [] : "")
    const isAutoDisabled =
      field.fieldName === "Email Address" || field.fieldName === "Contact Number"

    const commonProps = {
      name: field.fieldName,
      disabled: isAutoDisabled,
      className: `${inputClass} ${isAutoDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`,
    }


    if (field.fieldName === "Country") {
      return (
        <Select
          options={countryOptions}
          value={countryOptions.find(o => o.label === formData.Country) || null}
          onChange={(val) =>
            setFormData(p => ({
              ...p,
              Country: val?.label || "",
              State: "",
              City: "",
            }))
          }
          placeholder="Select Country"
        />
      );
    }
    if (field.fieldName === "State") {

      // CASE 1: Country exists → depend on country
      if (hasPersonalField("Country")) {
        const countryCode = Country.getAllCountries()
          .find(c => c.name === formData.Country)?.isoCode;

        const options = countryCode ? getStateOptions(countryCode) : [];

        return (
          <Select
            options={options}
            value={options.find(o => o.label === formData.State) || null}
            onChange={(val) =>
              setFormData(p => ({ ...p, State: val?.label || "", City: "" }))
            }
            isDisabled={!formData.Country}
            placeholder="Select State"
          />
        );
      }

      // CASE 2: NO Country → show all states
      const options = getStateOptions(DEFAULT_COUNTRY_CODE);

      return (
        <Select
          options={options}
          value={options.find(o => o.label === formData.State) || null}
          onChange={(val) =>
            setFormData(p => ({ ...p, State: val?.label || "", City: "" }))
          }
          placeholder="Select State"
        />
      );
    }
    if (field.fieldName === "City") {

      // CASE 1: Country + State
      if (hasPersonalField("Country") && hasPersonalField("State")) {
        const countryCode = Country.getAllCountries()
          .find(c => c.name === formData.Country)?.isoCode;

        const stateCode = State.getStatesOfCountry(countryCode || "")
          .find(s => s.name === formData.State)?.isoCode;

        const options =
          countryCode && stateCode
            ? getCityOptions(countryCode, stateCode)
            : [];

        return (
          <Select
            options={options}
            value={options.find(o => o.label === formData.City) || null}
            onChange={(val) =>
              setFormData(p => ({ ...p, City: val?.label || "" }))
            }
            isDisabled={!formData.State}
            placeholder="Select City"
          />
        );
      }

      // CASE 2: State + City (NO Country)
      if (hasPersonalField("State")) {
        const stateCode = State.getStatesOfCountry(DEFAULT_COUNTRY_CODE)
          .find(s => s.name === formData.State)?.isoCode;

        const options = stateCode
          ? getCityOptions(DEFAULT_COUNTRY_CODE, stateCode)
          : [];

        return (
          <Select
            options={options}
            value={options.find(o => o.label === formData.City) || null}
            onChange={(val) =>
              setFormData(p => ({ ...p, City: val?.label || "" }))
            }
            isDisabled={!formData.State}
            placeholder="Select City"
          />
        );
      }

      // CASE 3: ONLY City → show all cities
      const allCities = State.getStatesOfCountry(DEFAULT_COUNTRY_CODE)
        .flatMap(s =>
          City.getCitiesOfState(DEFAULT_COUNTRY_CODE, s.isoCode)
        )
        .map(c => ({ value: c.name, label: c.name }));

      return (
        <Select
          options={allCities}
          value={allCities.find(o => o.label === formData.City) || null}
          onChange={(val) =>
            setFormData(p => ({ ...p, City: val?.label || "" }))
          }
          placeholder="Select City"
        />
      );
    }


    switch (field.type) {
      case "textarea":
        return <textarea {...commonProps} value={value} onChange={handleChange} maxLength={field.maxLength ?? 500} />
      case "select":
        return (
          <select {...commonProps} value={value} onChange={handleChange}>
            <option value="">Select</option>
            {field.options?.map((o: string) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )
      case "radiobutton":
        return (
          <div className="space-y-1">
            {field.options?.map((o: string) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={field.fieldName}
                  value={o}
                  checked={formData[field.fieldName] === o}
                  disabled={isAutoDisabled}
                  onChange={() => setFormData(p => ({ ...p, [field.fieldName]: o }))}
                />
                {o}
              </label>
            ))}
          </div>
        )
      case "checkbox":
        return (
          <div className="space-y-1">
            {field.options?.map((o: string) => (
              <label key={o} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={isAutoDisabled}
                  checked={(formData[field.fieldName] || []).includes(o)}
                  onChange={(e) => {
                    const prev = formData[field.fieldName] || []
                    const updated = e.target.checked ? [...prev, o] : prev.filter((v: string) => v !== o)
                    setFormData(p => ({ ...p, [field.fieldName]: updated }))
                  }}
                />
                {o}
              </label>
            ))}
          </div>
        )
      case "number":
        return (
          <input
            {...commonProps}
            type="text"
            value={value}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={field.maxLength ?? 15}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "")
              setFormData(p => ({ ...p, [field.fieldName]: digits }))
            }}
          />
        )
      case "file":
        const fileValue = formData[field.fieldName]
        const selectedFile = files[field.fieldName]
        const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : `${BASE_URL}${fileValue}`
        const isImage =
          selectedFile ||
          (fileValue && IMAGE_EXTENSIONS.includes(fileValue.toString().split(".").pop()?.toLowerCase() || ""))
        return (
          <div className="flex flex-col gap-2">
            {isImage && previewUrl && <img src={previewUrl} alt={field.fieldName} className="w-32 h-32 object-cover border rounded" />}
            {!isImage && fileValue && (
              <a href={`${BASE_URL}${fileValue}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{fileValue}</a>
            )}
            <input type="file" name={field.fieldName} onChange={handleFileChange} />
          </div>
        )
      default:
        return (
          <input
            {...commonProps}
            type={field.type}
            value={value}
            onChange={(e) => {
              if (field.type === "text") {
                // Allow only letters and spaces
                const textOnly = e.target.value.replace(/[^a-zA-Z\s]/g, "");
                setFormData(p => ({ ...p, [field.fieldName]: textOnly }));
              } else {
                handleChange(e);
              }
            }}
            maxLength={field.maxLength || undefined}
          />
        );

    }
  }

  const handleNext = async () => {
    if (activeStep === "program") {
      if (!validateProgram()) return;

      // Always go to personal, no skipping
      setActiveStep("personal");
      return;
    }

    if (activeStep === "personal") {
      // Validate personal details before moving next
      if (!validateSection(formConfig?.personalDetails)) return;

      // Save personal details if applicationId does not exist
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
    if (activeStep === "education") setActiveStep("personal")
    else if (activeStep === "personal") setActiveStep("program")
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
    <div className="flex justify-center">
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-10">
        <Toaster position="top-right" />

        {/* STEP PROGRESS */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const stepIndex = steps.indexOf(step);
              const isActive = activeStep === step;
              const isCompleted = steps.indexOf(activeStep) > index;

              return (
                <div key={step} className="flex-1 flex items-center">
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
