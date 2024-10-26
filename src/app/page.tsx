import type { Metadata } from "next";

type HomeProps = Readonly<{}>
export const metadata: Metadata = { title: "Home" };
export default function Home({}: HomeProps) {
  return (
    <div className="container">Home</div>
  );
}
