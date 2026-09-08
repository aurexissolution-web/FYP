import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "@/lib/dictionaries";
import { ChatClient } from "@/components/chat/ChatClient";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const { session } = await searchParams;

  return <ChatClient lang={lang} dict={dict.chat} initialSessionId={session} />;
}
