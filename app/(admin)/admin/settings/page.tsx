import type { Metadata } from 'next'
import SettingsView from '@/components/admin/views/SettingsView'
import { getIntegrations, getWebhookUrls, getEnvironment } from '@/lib/server/integrations'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Integration status and environment.',
}

/**
 * Server component on purpose: the env is read here and only booleans cross to
 * the client, so no secret is ever serialised into the page.
 */
export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <SettingsView
      integrations={getIntegrations()}
      webhookUrl={getWebhookUrls().cashfree}
      environment={getEnvironment()}
    />
  )
}
