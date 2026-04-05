// Vercel Edge Function: Dynamic OG card image for shared drink links.
// Renders a branded drink card matching the app's dark theme design.
// Used as og:image so WhatsApp, Twitter/X, Facebook, etc. show the card.

import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const SUPABASE_URL = 'https://oyerthppmxvcgtldljwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZXJ0aHBwbXh2Y2d0bGRsandpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NjkxMTcsImV4cCI6MjA1MzI0NTExN30.P_NMCpiGrNBPBMud9mh9GjfKJOIyhtNRV_2qJA_Mmz0';

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  // Default values
  let drinkName = 'A Drink';
  let detailLine = 'Shared via Libations';
  let tastingNotes = '';
  let flavorTags = [];
  let recipe = '';
  let rating = null;

  if (id) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/shared_drinks?id=eq.${id}&select=drink_name,category,drink_style,brewery,winery,distillery,encoded_payload`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const drink = data[0];
        drinkName = drink.drink_name || 'A Drink';

        // Build detail line
        const parts = [];
        if (drink.brewery) parts.push(drink.brewery);
        else if (drink.winery) parts.push(drink.winery);
        else if (drink.distillery) parts.push(drink.distillery);
        if (drink.category) parts.push(drink.category);
        if (drink.drink_style) parts.push(drink.drink_style);
        detailLine = parts.join(' · ');

        // Decode the payload for tasting notes, flavor tags, recipe
        if (drink.encoded_payload) {
          try {
            let b64 = drink.encoded_payload
              .replace(/-/g, '+')
              .replace(/_/g, '/');
            const remainder = b64.length % 4;
            if (remainder > 0) b64 += '='.repeat(4 - remainder);
            const decoded = JSON.parse(atob(b64));
            tastingNotes = decoded.tastingNotes || '';
            flavorTags = decoded.flavorTags || [];
            recipe = decoded.recipe || '';
          } catch (e) {
            // Payload decode failed — continue with basic info
          }
        }
      }
    } catch (e) {
      // Fetch failed — use defaults
    }
  }

  // Colors matching the app
  const bg = '#0d1117';
  const surface = '#161e28';
  const amber = '#c8913a';
  const text = '#e8e0d4';
  const muted = 'rgba(232, 224, 212, 0.5)';

  // Build the card — detailed version for social media
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: bg,
          padding: '48px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '540px',
            background: surface,
            borderRadius: '16px',
            border: `1px solid rgba(200, 145, 58, 0.15)`,
            padding: '40px 36px',
          }}
        >
          {/* Brand */}
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '22px',
              color: amber,
              opacity: 0.8,
              marginBottom: '16px',
            }}
          >
            Libations
          </div>

          {/* Divider */}
          <div
            style={{
              width: '120px',
              height: '1px',
              background: 'rgba(200, 145, 58, 0.25)',
              marginBottom: '24px',
            }}
          />

          {/* Drink name */}
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: drinkName.length > 30 ? '32px' : '40px',
              color: text,
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: '12px',
            }}
          >
            {drinkName}
          </div>

          {/* Detail line */}
          <div
            style={{
              fontSize: '16px',
              color: muted,
              textAlign: 'center',
              marginBottom: tastingNotes || flavorTags.length > 0 ? '24px' : '8px',
            }}
          >
            {detailLine}
          </div>

          {/* Tasting notes */}
          {tastingNotes ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: amber,
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                TASTING NOTES
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: 'rgba(232, 224, 212, 0.85)',
                  lineHeight: 1.6,
                  background: bg,
                  borderRadius: '8px',
                  padding: '12px 14px',
                }}
              >
                {tastingNotes.length > 200 ? tastingNotes.slice(0, 200) + '...' : tastingNotes}
              </div>
            </div>
          ) : null}

          {/* Flavor tags */}
          {flavorTags.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: amber,
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                FLAVOR PROFILE
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {flavorTags.slice(0, 5).map((tag) => (
                  <div
                    key={tag}
                    style={{
                      fontSize: '12px',
                      color: amber,
                      background: 'rgba(200, 145, 58, 0.12)',
                      border: '1px solid rgba(200, 145, 58, 0.3)',
                      borderRadius: '12px',
                      padding: '4px 12px',
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Footer divider */}
          <div
            style={{
              width: '100%',
              height: '1px',
              background: 'rgba(200, 145, 58, 0.12)',
              marginTop: '8px',
              marginBottom: '12px',
            }}
          />

          {/* Footer */}
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(232, 224, 212, 0.3)',
            }}
          >
            Shared from Libations · therainyday.co
          </div>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 630,
    }
  );
}
