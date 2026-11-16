type LogoProps = {
  size?: number;
};

// Hexágono sólido em ardósia com a face em mel (identidade visual do produto).
export function Logo({ size = 32 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <polygon points="16,2 28.1,9 28.1,23 16,30 3.9,23 3.9,9" fill="#334155" />
      <polygon points="16,9 22.1,12.5 22.1,19.5 16,23 9.9,19.5 9.9,12.5" fill="#F59E0B" />
    </svg>
  );
}
