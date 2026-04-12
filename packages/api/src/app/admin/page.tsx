import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Admin</h1>
      <ul className="space-y-2">
        <li>
          <Link href="/admin/crons" className="text-primary hover:underline">
            Crons
          </Link>
        </li>
      </ul>
    </div>
  );
}
