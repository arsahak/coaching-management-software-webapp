import SignupPage from "@/component/auth/SignupPage";

export const metadata = {
  title: "GyneClinics – Expertise Professionalism and Excellence",
  description:
    "We uphold the highest standards of medical ethics, ensuring total confidentiality, safety, and respect for every patient.",
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en-USA",
    },
  },
  openGraph: {
    images: "/opengraph-image.jpg",
  },
};

const page = () => {
  return <SignupPage />;
};

export default page;
