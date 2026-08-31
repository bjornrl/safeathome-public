import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, isLocale, withLocale } from "@/lib/i18n/config";

export default async function AuthPage({ params }: PageProps<"/[lang]/auth">) {
  const { lang } = await params;
  redirect(withLocale(isLocale(lang) ? lang : DEFAULT_LOCALE, "/login"));
}
