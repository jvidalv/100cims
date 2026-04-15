import { redirect } from "next/navigation";

import { routing } from "@/i18n/routing";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ShopSlugRootRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/${routing.defaultLocale}/shop/${slug}`);
}
