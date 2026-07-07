import {ImageResponse} from 'next/og';

export const size = {width: 180, height: 180};
export const contentType = 'image/png';

// devora "< • >" mark as a data URI (Satori renders it inside the ImageResponse).
const MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none"><g stroke="#f4c542" stroke-width="46" stroke-linecap="round" stroke-linejoin="round"><path d="M214 156 L150 256 L214 356"/><path d="M298 156 L362 256 L298 356"/></g><circle cx="256" cy="256" r="40" fill="#ffce4d"/></svg>';

export default function AppleIcon() {
  const src = 'data:image/svg+xml,' + encodeURIComponent(MARK);
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f0f0f',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={128} height={128} src={src} alt="" />
      </div>
    ),
    {...size}
  );
}
