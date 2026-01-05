import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import RegisterForm from "@/components/RegisterForm"

export default function RegisterPage() {
  const [instituteId, setInstituteId] = useState<string | null>(null)

  useEffect(() => {
    const id = Cookies.get("instituteId") || null
    setInstituteId(id)
  }, [])

  return (
    <div>
      <RegisterForm instituteId={instituteId} />
    </div>
  )
}
