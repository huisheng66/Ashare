import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** 与 components/Logo.tsx 的 SealMark 同一图形：朱砂印章里镂空的「A」。 */
export default function Icon() {
  return new ImageResponse(
    (
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="#cc2c05" />
        <path
          fill="#fffaf5"
          fillRule="evenodd"
          d="M13.6 7h4.8L25 25h-4.3l-1.28-3.5h-6.84L11.3 25H7L13.6 7Zm.16 11.3h4.48L16 12.2l-2.24 6.1Z"
        />
      </svg>
    ),
    { ...size },
  );
}
