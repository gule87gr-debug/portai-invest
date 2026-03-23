import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "PortAI"
const SITE_URL = "https://portai-invest.com"
const PRIMARY = "#2563eb"

interface WelcomeProps {
  displayName?: string
}

const WelcomeEmail = ({ displayName }: WelcomeProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — your AI-powered investment companion</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logoText}>📈 {SITE_NAME}</Text>
        </Section>

        <Heading style={h1}>
          {displayName ? `Welcome aboard, ${displayName}!` : 'Welcome to PortAI!'}
        </Heading>

        <Text style={text}>
          You've just unlocked access to an AI-powered investment platform designed to help you make smarter financial decisions.
        </Text>

        <Text style={featureHeading}>Here's what you can do:</Text>

        <Text style={featureItem}>🧠 <strong>AI Financial Advisor</strong> — Ask any investment question, anytime</Text>
        <Text style={featureItem}>📰 <strong>Smart Dashboard</strong> — AI-curated market news with trust scores</Text>
        <Text style={featureItem}>📊 <strong>Investment Quiz</strong> — Discover your investor profile in 5 questions</Text>
        <Text style={featureItem}>💬 <strong>Community Forum</strong> — Discuss ideas with AI fact-checking</Text>
        <Text style={featureItem}>👁️ <strong>Watchlists</strong> — Track 550+ stocks, ETFs, and crypto</Text>

        <Section style={buttonContainer}>
          <Button style={button} href={SITE_URL}>
            Explore Your Dashboard
          </Button>
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          This is a one-time welcome email. You're receiving this because you created a {SITE_NAME} account.
        </Text>
        <Text style={disclaimer}>
          {SITE_NAME} is for educational purposes only. Not financial advice.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: `Welcome to ${SITE_NAME} — let's get started`,
  displayName: 'Welcome email',
  previewData: { displayName: 'Sarah' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '520px', margin: '0 auto' }
const logoSection = { textAlign: 'center' as const, marginBottom: '20px' }
const logoText = { fontSize: '24px', fontWeight: '700', color: PRIMARY, margin: '0' }
const h1 = { fontSize: '22px', fontWeight: '700', color: '#111827', margin: '0 0 16px', lineHeight: '1.3' }
const text = { fontSize: '14px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 16px' }
const featureHeading = { fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 12px' }
const featureItem = { fontSize: '13px', color: '#4b5563', lineHeight: '1.6', margin: '0 0 8px' }
const buttonContainer = { textAlign: 'center' as const, margin: '28px 0' }
const button = { backgroundColor: PRIMARY, color: '#ffffff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', padding: '12px 28px', textDecoration: 'none' }
const hr = { borderColor: '#e5e7eb', margin: '28px 0 16px' }
const footer = { fontSize: '11px', color: '#9ca3af', lineHeight: '1.5', margin: '0 0 4px' }
const disclaimer = { fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' as const, margin: '0' }
