import { useEffect, useRef } from 'react';

const client = import.meta.env.VITE_ADSENSE_CLIENT;
const slots = {
  HOME_PAGE_TOP_SLOT: import.meta.env.VITE_ADSENSE_HOME_SLOT,
  RESULT_PAGE_MID_SLOT: import.meta.env.VITE_ADSENSE_RESULT_SLOT,
  LEFT_SIDE_AD: import.meta.env.VITE_ADSENSE_LEFT_SLOT,
  RIGHT_SIDE_AD: import.meta.env.VITE_ADSENSE_RIGHT_SLOT,
};
const validClient = /^ca-pub-\d{16}$/.test(client ?? '');
// eslint-disable-next-line react/only-export-components
export const hasSideAds = validClient && /^\d+$/.test(slots.LEFT_SIDE_AD ?? '') && /^\d+$/.test(slots.RIGHT_SIDE_AD ?? '');

export const AdBanner = ({ dataAdSlot, style, className = '' }) => {
  const slot = slots[dataAdSlot];
  const enabled = validClient && /^\d+$/.test(slot ?? '');
  const initialized = useRef(false);
  useEffect(() => {
    if (!enabled || initialized.current) return;
    // Load the publisher script only after a configured ad is mounted.
    if (!document.querySelector('script[data-adsense]')) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.adsense = 'true';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
      document.head.appendChild(script);
    }
    initialized.current = true;
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* Ad blockers must not interrupt practice. */ }
  }, [enabled]);
  if (!enabled) return null;
  return <aside aria-label="Advertisement" className={`ad-container ${className}`} style={{ minHeight: 90, ...style }}><ins className="adsbygoogle" style={{ display: 'block', width: '100%' }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" /></aside>;
};
