import React, { useEffect, useRef, useState } from 'react';
import { Platform, View, Text } from 'react-native';

// Simple web-only AdSense banner. On native platforms it renders nothing.
export default function AdBanner() {
  const insRef = useRef<any>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      // @ts-ignore
      (window.adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {}

    const timer = setTimeout(() => {
      const hasHeight = insRef.current && insRef.current.clientHeight > 0;
      setShowPlaceholder(!hasHeight);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (Platform.OS !== 'web') {
    return <View />;
  }

  return (
    <View style={{ position: 'relative', width: '100%', marginTop: 12 }}>
      {/* eslint-disable-next-line react/no-unknown-property */}
      <ins
        ref={insRef}
        className="adsbygoogle"
        // @ts-ignore style prop is fine for web
        style={{ display: 'block', minHeight: 90 }}
        data-ad-client="ca-pub-5712164996333384"
        data-ad-slot="9162563126"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      {showPlaceholder && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            inset: 0 as any,
            backgroundColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontFamily: 'Cairo-SemiBold' }}>مساحة إعلانية</Text>
        </View>
      )}
    </View>
  );
}


