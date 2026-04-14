import Link from "next/link";

import { EMAIL_LOCALES, EMAIL_TEMPLATES } from "./_registry";

export default function AdminEmailsPage() {
  const items = Object.entries(EMAIL_TEMPLATES);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Emails</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4 font-medium">Template</th>
              <th className="py-2 pr-4 font-medium">Trigger</th>
              <th className="py-2 pr-4 font-medium">Locales</th>
            </tr>
          </thead>
          <tbody>
            {items.map(([slug, t]) => (
              <tr
                key={slug}
                className="border-b hover:bg-muted/40 cursor-pointer"
              >
                <td className="py-3 pr-4">
                  <Link href={`/admin/emails/${slug}`} className="block">
                    <div className="font-medium">{t.label}</div>
                    <div className="text-muted-foreground text-xs">
                      {t.description}
                    </div>
                  </Link>
                </td>
                <td className="py-3 pr-4 text-muted-foreground font-mono text-xs">
                  {t.trigger}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {EMAIL_LOCALES.join(" · ")}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-8 text-center text-muted-foreground"
                >
                  No email templates registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
