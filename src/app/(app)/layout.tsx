// Shared layout for the signed-in screens: side menu + page content.
import { Suspense } from "react";
import { connection } from "next/server";
import { CircleUser } from "lucide-react";
import { SideMenu } from "@/components/nav/side-menu";
import { createClient } from "@/lib/supabase/server";

async function SignedInUser() {
  // Per-user data: always render at request time.
  await connection();
  let username: string | null = null;
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", userData.user.id)
        .maybeSingle();
      username = data?.username ?? null;
    }
  } catch {
    username = null;
  }
  return <UserLine name={username} />;
}

function UserLine({ name }: { name: string | null }) {
  return (
    <span className="flex items-center gap-2">
      <CircleUser aria-hidden size={18} className="shrink-0" />
      <span className="truncate">
        Signed in{name ? " as " : ""}
        {name && <span className="text-white">{name}</span>}
      </span>
    </span>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  const isDev = process.env.NEXT_PUBLIC_APP_ENV !== "production";
  return (
    <div className="flex w-full flex-1 flex-col md:flex-row">
      <SideMenu
        isDev={isDev}
        user={
          <Suspense fallback={<UserLine name={null} />}>
            <SignedInUser />
          </Suspense>
        }
      />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
