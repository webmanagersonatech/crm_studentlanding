// "use client"

// import { useEffect, useState } from "react"
// import { useRouter } from "next/navigation"
// import Select from "react-select"
// import toast, { Toaster } from "react-hot-toast"
// import { getLoggedInStudent, createApplication } from "@/lib/api"

// interface OptionType {
//   value: string
//   label: string
// }

// type Tab = "personal" | "education"
// type Step = "program" | "personal" | "education" | "payment"


// export default function CourseApplication({

// }) {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)

//   const [selectedInstitute, setSelectedInstitute] = useState("")
//   const [programOptions, setProgramOptions] = useState<OptionType[]>([])
//   const [activeStep, setActiveStep] = useState<Step>("program")

//   const [program, setProgram] = useState("")
//   const [formConfig, setFormConfig] = useState<any>(null)
//   const [formData, setFormData] = useState<Record<string, any>>({})
//   const [files, setFiles] = useState<Record<string, File>>({})


//   const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
//   const BASE_URL = "http://localhost:4000/uploads/";
//   const inputClass =
//     "border border-gray-300 p-2 rounded bg-white focus:outline-none focus:ring-2 focus:ring-[#5667a8]"

//   useEffect(() => {
//     const count = Number(formData["Sibling Count"]) || 0
//     if (!formConfig) return

//     const siblingSection = formConfig.personalDetails.find(
//       (s: any) => s.sectionName === "Sibling Details"
//     )
//     if (!siblingSection) return

//     // 1️⃣ Base fields = everything EXCEPT Sibling Count and generated fields
//     const baseFields = siblingSection.fields.filter(
//       (f: any) =>
//         !f.isCustom &&
//         f.fieldName !== "Sibling Count"
//     )

//     // 2️⃣ Remove previously generated sibling fields
//     siblingSection.fields = siblingSection.fields.filter(
//       (f: any) => !f.isCustom
//     )

//     // 3️⃣ Generate siblings dynamically
//     for (let i = 2; i <= count; i++) {
//       baseFields.forEach((field: any) => {
//         siblingSection.fields.push({
//           ...field,
//           fieldName: `${field.fieldName} ${i}`,
//           label: `${field.label} ${i}`,
//           isCustom: true,
//         })
//       })
//     }

//     setFormConfig({ ...formConfig })
//   }, [formData["Sibling Count"]])







//   const removeField = (tab: Tab, sectionName: string, fieldName: string) => {
//     setFormConfig((prev: any) => {
//       const sections = prev?.[`${tab}Details`] || []

//       const updatedSections = sections.map((section: any) => {
//         if (section.sectionName !== sectionName) return section

//         return {
//           ...section,
//           fields: section.fields.filter(
//             (f: any) => f.fieldName !== fieldName
//           ),
//         }
//       })

//       return {
//         ...prev,
//         [`${tab}Details`]: updatedSections,
//       }
//     })
//   }

//   useEffect(() => {
//     const fetchStudent = async () => {
//       try {
//         const res = await getLoggedInStudent()

//         if (!res?.success) {
//           toast.error("Failed to fetch student")
//           return
//         }

//         const { student, settings, formManager } = res.data

//         /* ================= AUTO FILL STUDENT DATA ================= */
//         setSelectedInstitute(student?.instituteId || "")

//         setFormData((prev) => ({
//           ...prev,
//           "First Name": student?.firstname || "",
//           "Last Name": student?.lastname || "",
//           "Email Address": student?.email || "",
//           "Contact Number": student?.mobileNo || "",
//         }))

//         /* ================= PROGRAM OPTIONS ================= */
//         if (Array.isArray(settings?.courses)) {
//           setProgramOptions(
//             settings.courses.map((c: string) => ({
//               value: c,
//               label: c,
//             }))
//           )
//         }

//         /* ================= FORM CONFIG ================= */
//         if (!formManager) {
//           toast.error("No form configuration found")
//           return
//         }

//         setFormConfig(formManager)
//       } catch (err) {
//         console.error(err)
//         toast.error("Something went wrong")
//       }
//     }

//     fetchStudent()
//   }, [])



//   const validateProgram = () => {
//     if (!program) {
//       toast.error("Please select a program")
//       return false
//     }
//     return true
//   }

//   // Validation for each section
//   const validateSection = (sections?: any[]) => {
//     if (!Array.isArray(sections)) return true

//     for (const section of sections) {
//       for (const field of section.fields || []) {
//         if (!field.required) continue

//         // File validation
//         if (field.type === "file") {
//           // Check if a new file is uploaded OR existing value exists
//           if (!files[field.fieldName] && !formData[field.fieldName]) {
//             toast.error(`${field.fieldName} is required`)
//             return false
//           }
//           continue
//         }


//         const value = formData[field.fieldName]

//         if (!value || value.toString().trim() === "") {
//           toast.error(`${field.fieldName} is required`)
//           return false
//         }

//         if (
//           field.type === "email" &&
//           !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
//         ) {
//           toast.error("Invalid email format")
//           return false
//         }
//       }
//     }
//     return true
//   }

//   // Input handlers
//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type, checked } = e.target as HTMLInputElement
//     setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }))
//   }

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (file) {
//       setFiles((p) => ({ ...p, [e.target.name]: file }))
//       setFormData((p) => ({ ...p, [e.target.name]: file.name }))
//     }
//   }


//   const renderField = (field: any) => {
//     const value =
//       formData[field.fieldName] ||
//       (field.type === "checkbox" ? [] : "");

//     const isAutoDisabled =
//       field.fieldName === "Email Address" ||
//       field.fieldName === "Contact Number";

//     const commonProps = {
//       name: field.fieldName,
//       disabled: isAutoDisabled,
//       className: `${inputClass} ${isAutoDisabled ? "bg-gray-100 cursor-not-allowed" : ""
//         }`,
//     };

//     switch (field.type) {
//       case "textarea":
//         return (
//           <textarea
//             {...commonProps}
//             value={value}
//             onChange={handleChange}
//             maxLength={field.maxLength ?? 500}
//           />
//         );

//       case "select":
//         return (
//           <select
//             {...commonProps}
//             value={value}
//             onChange={handleChange}
//           >
//             <option value="">Select</option>
//             {field.options?.map((o: string) => (
//               <option key={o} value={o}>{o}</option>
//             ))}
//           </select>
//         );

//       case "radiobutton":
//         return (
//           <div className="space-y-1">
//             {field.options?.map((o: string) => (
//               <label key={o} className="flex items-center gap-2 text-sm">
//                 <input
//                   type="radio"
//                   name={field.fieldName}
//                   value={o}
//                   checked={formData[field.fieldName] === o}
//                   disabled={isAutoDisabled}
//                   onChange={() =>
//                     setFormData(p => ({ ...p, [field.fieldName]: o }))
//                   }
//                 />
//                 {o}
//               </label>
//             ))}
//           </div>
//         );

//       case "checkbox":
//         return (
//           <div className="space-y-1">
//             {field.options?.map((o: string) => (
//               <label key={o} className="flex items-center gap-2 text-sm">
//                 <input
//                   type="checkbox"
//                   disabled={isAutoDisabled}
//                   checked={(formData[field.fieldName] || []).includes(o)}
//                   onChange={(e) => {
//                     const prev = formData[field.fieldName] || [];
//                     const updated = e.target.checked
//                       ? [...prev, o]
//                       : prev.filter((v: string) => v !== o);

//                     setFormData(p => ({
//                       ...p,
//                       [field.fieldName]: updated,
//                     }));
//                   }}
//                 />
//                 {o}
//               </label>
//             ))}
//           </div>
//         );

//       case "number":
//         return (
//           <input
//             {...commonProps}
//             type="text"
//             value={value}
//             inputMode="numeric"
//             pattern="[0-9]*"
//             maxLength={field.maxLength ?? 15}
//             onChange={(e) => {
//               const digits = e.target.value.replace(/\D/g, "");
//               setFormData(p => ({
//                 ...p,
//                 [field.fieldName]: digits,
//               }));
//             }}
//           />
//         );

//       case "file": {
//         const fileValue = formData[field.fieldName];
//         const selectedFile = files[field.fieldName];
//         const previewUrl = selectedFile
//           ? URL.createObjectURL(selectedFile)
//           : `${BASE_URL}${fileValue}`;

//         const isImage =
//           selectedFile ||
//           (fileValue &&
//             IMAGE_EXTENSIONS.includes(
//               fileValue.toString().split(".").pop()?.toLowerCase() || ""
//             ));

//         return (
//           <div className="flex flex-col gap-2">
//             {isImage && previewUrl && (
//               <img
//                 src={previewUrl}
//                 alt={field.fieldName}
//                 className="w-32 h-32 object-cover border rounded"
//               />
//             )}

//             {!isImage && fileValue && (
//               <a
//                 href={`${BASE_URL}${fileValue}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="text-blue-600 underline"
//               >
//                 {fileValue}
//               </a>
//             )}

//             <input
//               type="file"
//               name={field.fieldName}
//               onChange={handleFileChange}
//             />
//           </div>
//         );
//       }

//       default:
//         return (
//           <input
//             {...commonProps}
//             type={field.type}
//             value={value}
//             onChange={handleChange}
//             maxLength={field.maxLength || undefined}
//           />
//         );
//     }
//   };



//   const handleNext = () => {
//     if (activeStep === "program") {
//       if (!validateProgram()) return
//       setActiveStep("personal")
//     }

//     if (activeStep === "personal") {
//       if (!validateSection(formConfig?.personalDetails)) return
//       setActiveStep("education")
//     }

//     if (activeStep === "education") {
//       if (!validateSection(formConfig?.educationDetails)) return
//       setActiveStep("payment")
//     }
//   }

//   const handlePrev = () => {
//     if (activeStep === "payment") setActiveStep("education")
//     else if (activeStep === "education") setActiveStep("personal")
//     else if (activeStep === "personal") setActiveStep("program")
//   }


//   const mapSectionData = (sections?: any[]) => {
//     if (!Array.isArray(sections)) return []

//     return sections.map((section) => {
//       const sectionObj: any = {
//         sectionName: section.sectionName,
//         fields: {},
//       }

//       section.fields.forEach((field: any) => {
//         if (field.type === "file") {
//           // Preserve old file if no new file uploaded
//           sectionObj.fields[field.fieldName] =
//             files[field.fieldName]?.name || formData[field.fieldName] || ""
//         } else {
//           sectionObj.fields[field.fieldName] = formData[field.fieldName] || ""
//         }
//       })

//       return sectionObj
//     })
//   }


//   // Submit
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     if (!selectedInstitute) {
//       toast.error("Institute is required");
//       return;
//     }

//     if (!validateProgram()) return;
//     if (!validateSection(formConfig?.educationDetails)) return;

//     try {
//       setLoading(true);

//       const fd = new FormData();

//       fd.append("instituteId", selectedInstitute);
//       fd.append("program", program);
//       fd.append("academicYear", "2025-2026");

//       fd.append(
//         "personalDetails",
//         JSON.stringify(mapSectionData(formConfig?.personalDetails))
//       );

//       fd.append(
//         "educationDetails",
//         JSON.stringify(mapSectionData(formConfig?.educationDetails))
//       );

//       // Attach files
//       Object.entries(files).forEach(([key, file]) => {
//         fd.append(key, file);
//       });

//       // ✅ Send to API
//       const res = await createApplication(fd, true); // true for multipart
//       console.log(res);

//       toast.success("Application submitted successfully");
//       router.push("/thank-you"); // optional: redirect after success
//     } catch (err: any) {
//       toast.error(err?.message || "Submission failed");
//     } finally {
//       setLoading(false);
//     }
//   };





//   return (
//     <div className="flex justify-center ">

//       <form
//         onSubmit={handleSubmit}
//         className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-10"
//       >
//         <Toaster position="top-right" />

//         {/* ================= STEP PROGRESS ================= */}
//         <div className="mb-12">
//           <div className="flex items-center justify-between">
//             {["program", "personal", "education", "payment"].map((step, index) => {
//               const isActive = activeStep === step
//               const isCompleted =
//                 ["program", "personal", "education", "payment"].indexOf(activeStep) >
//                 index

//               return (
//                 <div key={step} className="flex-1 flex items-center">
//                   {/* Circle */}
//                   <div
//                     className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
//                 ${isCompleted
//                         ? "bg-indigo-600 text-white"
//                         : isActive
//                           ? "border-2 border-indigo-600 text-indigo-600 bg-white"
//                           : "border border-gray-300 text-gray-400 bg-white"
//                       }
//               `}
//                   >
//                     {index + 1}
//                   </div>

//                   {/* Label */}
//                   <span
//                     className={`ml-3 text-sm font-medium capitalize tracking-wide
//                 ${isActive || isCompleted
//                         ? "text-indigo-700"
//                         : "text-gray-400"
//                       }
//               `}
//                   >
//                     {step}
//                   </span>

//                   {/* Line */}
//                   {index < 3 && (
//                     <div
//                       className={`flex-1 h-[2px] mx-4
//                   ${isCompleted ? "bg-indigo-600" : "bg-gray-200"}
//                 `}
//                     />
//                   )}
//                 </div>
//               )
//             })}
//           </div>
//         </div>

//         {/* ================= STEP 1 — PROGRAM ================= */}
//         {activeStep === "program" && (
//           <div className="space-y-6">
//             <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
//               Select Program
//             </h2>

//             <Select
//               options={programOptions}
//               value={programOptions.find((p) => p.value === program) || null}
//               onChange={(o) => setProgram(o?.value || "")}
//               placeholder="Choose your program"
//             />
//           </div>
//         )}

//         {/* ================= STEP 2 — PERSONAL ================= */}
//         {activeStep === "personal" && (
//           <div className="space-y-8">
//             <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
//               Personal Details
//             </h2>

//             {formConfig?.personalDetails?.map((section: any) => (
//               <div
//                 key={section.sectionName}
//                 className="rounded-xl bg-gray-50/80 p-6"
//               >
//                 <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-5">
//                   {section.sectionName}
//                 </h3>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {section.fields.map((f: any) => (
//                     <div key={f.fieldName} className="relative flex flex-col">
//                       {f.isCustom && (
//                         <button
//                           type="button"
//                           onClick={() =>
//                             removeField(
//                               "personal",
//                               section.sectionName,
//                               f.fieldName
//                             )
//                           }
//                           className="absolute top-1 right-1 text-red-500 text-sm"
//                         >
//                           ✕
//                         </button>
//                       )}

//                       <label className="text-xs font-medium text-gray-600 mb-1">
//                         {f.fieldName}
//                         {f.required && (
//                           <span className="text-red-500"> *</span>
//                         )}
//                       </label>

//                       {renderField(f)}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* ================= STEP 3 — EDUCATION ================= */}
//         {activeStep === "education" && (
//           <div className="space-y-8">
//             <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
//               Education Details
//             </h2>

//             {formConfig?.educationDetails?.map((section: any) => (
//               <div
//                 key={section.sectionName}
//                 className="rounded-xl bg-gray-50/80 p-6"
//               >
//                 <h3 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider mb-5">
//                   {section.sectionName}
//                 </h3>

//                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {section.fields.map((f: any) => (
//                     <div key={f.fieldName} className="flex flex-col">
//                       <label className="text-xs font-medium text-gray-600 mb-1">
//                         {f.fieldName}
//                         {f.required && (
//                           <span className="text-red-500"> *</span>
//                         )}
//                       </label>

//                       {renderField(f)}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* ================= STEP 4 — PAYMENT ================= */}
//         {activeStep === "payment" && (
//           <div className="space-y-6">
//             <h2 className="text-xl font-semibold text-gray-800 tracking-wide">
//               Payment
//             </h2>

//             <div className="rounded-xl bg-indigo-50 p-6 text-sm space-y-3">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Program</span>
//                 <span className="font-medium text-gray-900">{program}</span>
//               </div>

//               <div className="flex justify-between">
//                 <span className="text-gray-600">Application Fee</span>
//                 <span className="font-semibold text-indigo-700">₹1,000</span>
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white py-3 rounded-xl font-medium"
//             >
//               {loading ? "Processing..." : "Pay & Submit"}
//             </button>
//           </div>
//         )}

//         {/* ================= NAVIGATION ================= */}
//         <div className="flex justify-between pt-8">
//           {activeStep !== "program" && (
//             <button
//               type="button"
//               onClick={handlePrev}
//               className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
//             >
//               ← Previous
//             </button>
//           )}

//           {activeStep !== "payment" && (
//             <button
//               type="button"
//               onClick={handleNext}
//               className="ml-auto px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
//             >
//               Next →
//             </button>
//           )}
//         </div>
//       </form>

//     </div>
//   )

// }
