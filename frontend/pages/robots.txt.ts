import type { GetServerSideProps } from 'next'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tenantguard.net').replace(/\/$/, '')

function buildRobotsTxt(): string {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
  ].join('\n')
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.write(buildRobotsTxt())
  res.end()

  return { props: {} }
}

export default function RobotsTxt() {
  return null
}
