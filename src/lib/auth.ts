import supabase from "@/lib/db";

const ADMIN_EMAILS = ["ericluuu07@gmail.com"];

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return {
    id: user.id,
    email: user.email!,
    isAdmin: ADMIN_EMAILS.includes(user.email!),
  };
}
