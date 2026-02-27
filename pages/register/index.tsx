import { GetServerSideProps } from "next";
import RegisterForm from "@/components/RegisterForm";

type Props = {
  instituteId: string | null;
};

export default function RegisterPage({ instituteId }: Props) {
  return (
    <div>
      <RegisterForm instituteId={instituteId} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const instituteId = req.cookies["instituteId"] || null;

  return {
    props: {
      instituteId,
    },
  };
};