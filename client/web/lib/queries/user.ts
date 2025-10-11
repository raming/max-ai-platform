import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/store/auth'
import type { UserProfile } from '@/types/user'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export function useUser() {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['user', user?.id],
    queryFn: async (): Promise<UserProfile> => {
      const res = await fetch(`${API_BASE}/user/profile`, {
        headers: {
          'x-correlation-id': `cid-${Date.now()}`,
        },
      })
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
    enabled: !!user?.id,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<UserProfile>) => {
      const res = await fetch(`${API_BASE}/user/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': `cid-${Date.now()}`,
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update user')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}