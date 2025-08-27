import React from 'react';

const SiteStructuredData: React.FC = () => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ImpexDeals',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://www.impexdeals.example',
    logo: typeof window !== 'undefined' ? window.location.origin + '/impex-logo.svg' : '/impex-logo.svg',
    description: 'ImpexDeals platform voor handel in partijen goederen: kopen, verkopen en beheren van bulkpartijen.',
    sameAs: [
      'https://www.linkedin.com/',
      'https://twitter.com/',
      'https://www.facebook.com/'
    ]
  };
  return (
    <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify(data)}</script>
  );
};
export default SiteStructuredData;
