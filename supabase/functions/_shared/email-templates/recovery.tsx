/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  token?: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
  token,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          We received a request to reset your password for {siteName}. Enter
          the recovery code below in the app to continue.
        </Text>
        {token ? <Text style={codeStyle}>{token}</Text> : null}
        <Text style={helperText}>
          If you prefer, you can also use the button below to continue from
          your browser.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Open Password Reset
        </Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const codeStyle = {
  fontFamily: 'JetBrains Mono, Courier, monospace',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.12em',
  textAlign: 'center' as const,
  color: '#2ecc8f',
  backgroundColor: '#f4fbf7',
  border: '1px solid #b9e8d0',
  borderRadius: '12px',
  padding: '18px 20px',
  margin: '0 0 20px',
}
const helperText = {
  fontSize: '13px',
  color: '#6b7a99',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#2ecc8f',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
