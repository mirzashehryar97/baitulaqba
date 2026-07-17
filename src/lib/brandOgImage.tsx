import { ImageResponse } from 'next/og';

import { OG_IMAGE_SIZE } from '@/lib/seo';
import { SOCIAL_CARDS, type SocialCardVariant } from '@/lib/socialCards';

/**
 * Shared renderer for the site's route-specific social share cards. Colours
 * mirror the `@theme` tokens in `globals.css` (emerald-deepest/emerald, gold,
 * cream). Text uses the bundled default font to keep generation deterministic
 * and dependency-free.
 *
 * Kept separate from `@/lib/seo` so that pulling metadata helpers into a page
 * does not also pull in the `next/og` image runtime.
 */
export function renderBrandOgImage(variant: SocialCardVariant): ImageResponse {
  const card = SOCIAL_CARDS[variant];

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#07271d',
        backgroundImage: 'linear-gradient(135deg, #07271d 0%, #0e3b2e 100%)',
        padding: '54px 64px 46px',
        color: '#faf5ea',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-210px',
          right: '-130px',
          width: '520px',
          height: '520px',
          display: 'flex',
          borderRadius: '9999px',
          border: '2px solid rgba(200, 163, 91, 0.16)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '70px',
          bottom: '-250px',
          width: '510px',
          height: '510px',
          display: 'flex',
          borderRadius: '9999px',
          backgroundColor: 'rgba(200, 163, 91, 0.06)',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{
              width: '76px',
              height: '76px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '20px',
              backgroundColor: '#faf5ea',
              border: '1px solid rgba(216, 189, 134, 0.72)',
            }}
          >
            <svg width="57" height="61" viewBox="0 0 160 170">
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path
                  d="M80 10C54 36 37 58 37 92c0 25 18 45 43 52 25-7 43-27 43-52 0-34-17-56-43-82Z"
                  stroke="#ad7a22"
                  strokeWidth="5"
                />
                <path
                  d="M44 135c23 0 34 7 36 16 2-9 13-16 36-16"
                  stroke="#083f2b"
                  strokeWidth="5"
                />
                <path
                  d="M28 123c24 2 42 11 52 28 10-17 28-26 52-28"
                  stroke="#083f2b"
                  strokeWidth="5"
                />
                <path d="M57 99h46v30H57z" fill="#083f2b" stroke="#083f2b" strokeWidth="3" />
                <path
                  d="M66 99V82c0-9 6-16 14-16s14 7 14 16v17"
                  fill="#083f2b"
                  stroke="#083f2b"
                  strokeWidth="3"
                />
                <path d="M80 57V45" stroke="#083f2b" strokeWidth="4" />
                <path
                  d="M74 45c3-8 11-8 14 0-4-3-9-3-14 0Z"
                  fill="#083f2b"
                  stroke="#083f2b"
                  strokeWidth="2"
                />
                <path d="M51 129V88m58 41V88" stroke="#083f2b" strokeWidth="4" />
                <path
                  d="M47 88c5-11 13-11 18 0m30 0c5-11 13-11 18 0"
                  stroke="#083f2b"
                  strokeWidth="4"
                />
                <circle cx="99" cy="58" r="7" fill="#083f2b" stroke="none" />
                <path d="M105 55c-5 2-8 6-8 11 5-1 9-5 11-10" fill="#faf5ea" stroke="none" />
              </g>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div
              style={{
                fontSize: '29px',
                fontWeight: 700,
                letterSpacing: '4px',
                color: '#faf5ea',
              }}
            >
              BAIT UL AQBA
            </div>
            <div style={{ fontSize: '16px', letterSpacing: '2.4px', color: '#d8bd86' }}>
              HUMANITARIAN SUPPORT FOR GAZA
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(216, 189, 134, 0.48)',
            borderRadius: '9999px',
            padding: '13px 20px',
            fontSize: '17px',
            fontWeight: 600,
            letterSpacing: '2.8px',
            color: '#ead7ad',
          }}
        >
          {card.eyebrow}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flex: 1,
          position: 'relative',
          paddingTop: '22px',
        }}
      >
        <div style={{ width: '790px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {card.headline.map((line) => (
              <div
                key={line}
                style={{
                  fontSize: '68px',
                  fontWeight: 700,
                  lineHeight: 1.02,
                  letterSpacing: '-1.5px',
                  color: '#faf5ea',
                }}
              >
                {line}
              </div>
            ))}
            {card.accent.map((line) => (
              <div
                key={line}
                style={{
                  fontSize: '68px',
                  fontWeight: 700,
                  lineHeight: 1.02,
                  letterSpacing: '-1.5px',
                  color: '#c8a35b',
                }}
              >
                {line}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '20px',
              fontSize: '25px',
              lineHeight: 1.35,
              color: 'rgba(246, 239, 225, 0.78)',
            }}
          >
            {card.supporting}
          </div>
        </div>

        <div
          style={{
            width: '246px',
            height: '246px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            borderRadius: '9999px',
            border: '1px solid rgba(216, 189, 134, 0.52)',
            backgroundColor: 'rgba(250, 245, 234, 0.045)',
            boxShadow: 'inset 0 0 0 13px rgba(200, 163, 91, 0.035)',
          }}
        >
          <div
            style={{ display: 'flex', fontSize: '21px', letterSpacing: '5px', color: '#d8bd86' }}
          >
            INITIATIVE
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: '-4px',
              fontSize: '94px',
              fontWeight: 700,
              lineHeight: 1,
              color: '#faf5ea',
            }}
          >
            {card.number}
          </div>
          <div
            style={{
              display: 'flex',
              maxWidth: '190px',
              textAlign: 'center',
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '2px',
              color: '#c8a35b',
            }}
          >
            {card.focus}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(200, 163, 91, 0.35)',
          paddingTop: '20px',
          position: 'relative',
        }}
      >
        <div
          style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '2.8px', color: '#faf5ea' }}
        >
          BAITULAQBA.ORG
        </div>
        <div style={{ fontSize: '20px', letterSpacing: '1.6px', color: '#d8bd86' }}>
          CARE · EDUCATION · RELIEF
        </div>
      </div>
    </div>,
    OG_IMAGE_SIZE,
  );
}
