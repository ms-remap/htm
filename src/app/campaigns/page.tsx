'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import Campaigns from '@/page-components/Campaigns'

export const dynamic = 'force-dynamic'

export default function CampaignsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleNavigate = (page: string, data?: any) => {
    if (page === 'campaign-editor') {
      if (data?.campaignId) {
        router.push(`/campaigns/editor?id=${data.campaignId}`)
      } else {
        router.push('/campaigns/editor')
      }
    } else {
      router.push(`/${page}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Layout currentPage="campaigns">
      <Campaigns onNavigate={handleNavigate} />
    </Layout>
  )
}
