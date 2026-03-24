import { GetServerSideProps } from "next";
import ForgotPasswordPage from "./forgotpassword";

type Props = {
    instituteId: string | null;
};

export default function forgotspasswordPage({ instituteId }: Props) {
    return (
        <div>
            <ForgotPasswordPage instituteId={instituteId} />
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