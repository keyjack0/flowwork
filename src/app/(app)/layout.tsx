import Sidebar from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Role } from '@/types'

type ProfileWithRole = {
  full_name: string | null
  role_id: number | null
  roles: { role_name: Role } | { role_name: Role }[] | null
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ambil profile user
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role_id, roles!profiles_role_id_fkey(role_name)')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as ProfileWithRole | null
  const joinedRole = Array.isArray(typedProfile?.roles)
    ? typedProfile?.roles[0]?.role_name
    : typedProfile?.roles?.role_name

  const fallbackRoleById: Record<number, Role> = {
    1: 'Owner',
    2: 'Manager',
    3: 'Kasir',
  }

  const userName = typedProfile?.full_name || user.email || 'User'
  const userRole = joinedRole || fallbackRoleById[typedProfile?.role_id ?? 3] || 'Kasir'

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7FB]">
      <Sidebar userName={userName} userRole={userRole} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
