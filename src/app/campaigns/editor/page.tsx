'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import Layout from '@/components/Layout'
import CampaignEditor from '@/page-components/CampaignEditor'

export const dynamic = 'force-dynamic'

function CampaignEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const campaignId = searchParams?.get('id')

  const handleNavigate = (page: string) => {
    router.push(`/${page}`)
  }

  return <CampaignEditor onNavigate={handleNavigate} campaignId={campaignId || undefined} />
}

export default function CampaignEditorPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

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
      <Suspense fallback={<div className="p-8 text-white">Loading...</div>}>
        <CampaignEditorContent />
      </Suspense>
    </Layout>
  )
}
