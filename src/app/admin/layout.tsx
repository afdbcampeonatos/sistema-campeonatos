import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      {session.user.mustChangePassword && <ChangePasswordModal />}
      {children}
    </>
  );
}
