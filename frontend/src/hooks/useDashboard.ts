import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats } from '../services/dashboard.service'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60_000 // 60 segundos
  })
}