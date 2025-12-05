'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import Layout from '@/components/Layout'
import CampaignEditor from '@/pages/CampaignEditor'

export default function CampaignEditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = searchParams?.get('id')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleNavigate = (page: string) => {
    router.push(`/${page}`)
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
      <CampaignEditor onNavigate={handleNavigate} campaignId={campaignId || undefined} />
    </Layout>
  )
}
