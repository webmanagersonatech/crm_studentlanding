// src/pages/index.tsx
import LoginForm from "@/components/LoginForm";
import { GetServerSideProps } from "next";

type Props = {
  instituteId: string | null;
};

export default function LoginPage({ instituteId }: Props) {
  return (
    <div >
      <LoginForm instituteId={instituteId} />
    </div>
  );
}

// This function runs on the server
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // Read cookie from request
  const instituteId = req.cookies["instituteId"] || null;

  return {
    props: { instituteId },
  };
};
