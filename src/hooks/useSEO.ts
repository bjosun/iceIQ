import { useEffect } from 'react';

// index.html ships one shared <title>/<meta description>/<link canonical> for
// the whole SPA (see the comment there) since every route rewrites to the
// same file. That's fine for the homepage, but a keyword landing page needs
// its own values or Google canonicalizes it straight back to "/" and never
// indexes it separately. This patches those tags in on mount and restores
// the homepage's own values on unmount so "/" is unaffected by having been
// visited via a landing page first.
let defaultTitle: string | null = null;
let defaultDescription: string | null = null;
let defaultCanonical: string | null = null;

interface SEOOptions {
  title: string;
  description: string;
  /** Path this page should canonicalize to, e.g. "/hockey-tracking-app". */
  path: string;
}

export function useSEO({ title, description, path }: SEOOptions) {
  useEffect(() => {
    const descTag = document.querySelector('meta[name="description"]:not([lang])');
    const canonicalTag = document.querySelector('link[rel="canonical"]');

    if (defaultTitle === null) defaultTitle = document.title;
    if (defaultDescription === null) defaultDescription = descTag?.getAttribute('content') ?? null;
    if (defaultCanonical === null) defaultCanonical = canonicalTag?.getAttribute('href') ?? null;

    document.title = title;
    descTag?.setAttribute('content', description);
    canonicalTag?.setAttribute('href', `https://www.iceiq.app${path}`);

    return () => {
      if (defaultTitle !== null) document.title = defaultTitle;
      if (descTag && defaultDescription !== null) descTag.setAttribute('content', defaultDescription);
      if (canonicalTag && defaultCanonical !== null) canonicalTag.setAttribute('href', defaultCanonical);
    };
  }, [title, description, path]);
}
