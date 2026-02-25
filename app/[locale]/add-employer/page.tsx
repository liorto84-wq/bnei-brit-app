import { setRequestLocale } from "next-intl/server";
import AddEmployerContent from "./add-employer-content";

export default async function AddEmployerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AddEmployerContent />;
}
