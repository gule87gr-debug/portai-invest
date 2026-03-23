import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "PortAI"
const SITE_URL = "https://portai-invest.com"
const PRIMARY = "#2563eb"

interface ForumNotificationProps {
  type?: 'like' | 'comment'
  fromUser?: string
  threadTitle?: string
}

const ForumNotificationEmail = ({ type = 'comment', fromUser = 'Someone', threadTitle = 'a discussion' }: ForumNotificationProps) => {
  const isLike = type === 'like'
  const action = isLike ? 'liked your post' : 'commented on your post'
  const emoji = isLike ? '👍' : '💬'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{fromUser} {action} on {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>📈 {SITE_NAME}</Text>
          </Section>

          <Heading style={h1}>
            {emoji} {fromUser} {action}
          </Heading>

          <Section style={threadBox}>
            <Text style={threadLabel}>Thread</Text>
            <Text style={threadTitle_style}>"{threadTitle}"</Text>
          </Section>

          <Text style={text}>
            {isLike
              ? `${fromUser} appreciated your contribution to the community forum.`
              : `${fromUser} replied to your thread. Head over to the forum to continue the conversation.`
            }
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={`${SITE_URL}/forum`}>
              View on Forum
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You're receiving this because someone interacted with your {SITE_NAME} forum post.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ForumNotificationEmail,
  subject: (data: Record<string, any>) => {
    const from = data?.fromUser || 'Someone'
    const action = data?.type === 'like' ? 'liked your post' : 'commented on your post'
    return `${from} ${action} on ${SITE_NAME}`
  },
  displayName: 'Forum notification',
  previewData: { type: 'comment', fromUser: 'Alex', threadTitle: 'Is AAPL a good buy right now?' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '20px' }
const logoText = { fontSize: '24px', fontWeight: '700', color: PRIMARY, margin: '0' }
const h1 = { fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 20px', lineHeight: '1.3' }
const text = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 20px' }
const threadBox = { backgroundColor: '#f3f4f6', borderRadius: '10px', padding: '16px', margin: '0 0 20px' }
const threadLabel = { fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 4px' }
const threadTitle_style = { fontSize: '14px', color: '#111827', fontWeight: '500', margin: '0', fontStyle: 'italic' as const }
const buttonContainer = { textAlign: 'center' as const, margin: '24px 0' }
const button = { backgroundColor: PRIMARY, color: '#ffffff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', padding: '12px 28px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0 16px' }
const footer = { fontSize: '11px', color: '#9ca3af', lineHeight: '1.5', margin: '0' }
