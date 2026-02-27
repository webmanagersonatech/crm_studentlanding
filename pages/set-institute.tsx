import { GetServerSideProps } from "next";
import { serialize } from "cookie";

export default function SetInstitute() {
    return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const instituteId = context.query.instituteId as string;

    if (!instituteId) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    const isProd = process.env.NODE_ENV === "production";

    context.res.setHeader(
        "Set-Cookie",
        serialize("instituteId", instituteId, {
            httpOnly: true,
            secure: isProd,                // ✅ HTTPS only in production
            sameSite: "lax",               // ✅ Works for redirect flow
            path: "/",
            maxAge: 60 * 60,               // 1 hour
        })
    );

    return {
        redirect: {
            destination: "/",
            permanent: false,
        },
    };
};