import React, { useEffect } from 'react';

export const AdBanner = ({ dataAdSlot, style, className }) => {
  useEffect(() => {
    try {
      // Push empty object to initialize the ad on mount
      if (window && typeof window !== 'undefined') {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense initialization error:', e);
    }
  }, []);

  return (
    <div 
      className={`ad-container ${className || ''}`} 
      style={{ 
        textAlign: 'center', 
        margin: '1.5rem 0',
        minHeight: '90px', // Prevent layout shift before ad loads
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.02)', // subtle placeholder background
        borderRadius: '8px',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        position: 'relative',
        ...style 
      }}
    >
      <span style={{ position: 'absolute', color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Demo Ad Space
      </span>
      {/* 
        This is a visual placeholder for dev. In production with a valid AdSense 
        publisher ID, Google's script will inject the actual ad inside this <ins> tag.
      */}
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', width: '100%' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // REPLACE WITH YOUR ADSENSE PUBLISHER ID
        data-ad-slot={dataAdSlot || "XXXXXXXXXX"}  // REPLACE WITH YOUR AD SLOT ID
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};
