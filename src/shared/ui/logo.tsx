type LogoProps = {
  size?: number;
};

// Contorno do logo: hexágono com ponta para cima, num viewBox de 32x32.
const LOGO_OUTLINE = "16,2 28.1,9 28.1,23 16,30 3.9,23 3.9,9";

// Hexágono sólido em ardósia com a face em mel (identidade visual do produto): um d20 visto de cima.
export function Logo({ size = 32 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <polygon points={LOGO_OUTLINE} fill="#334155" />
      <polygon points="16,9 22.1,12.5 22.1,19.5 16,23 9.9,19.5 9.9,12.5" fill="#F59E0B" />
    </svg>
  );
}

type NumberHexagonProps = {
  value: number;
  size?: number;
};

// O hexágono do logo com um número na face, como a face de um dado. A face é maior que a do
// logo para o número caber. Decorativo (aria-hidden): quem usa expõe o número de outro jeito,
// por exemplo como item de uma <ol>. Número em quase preto sobre mel: contraste de 8,3:1.
export function NumberHexagon({ value, size = 64 }: NumberHexagonProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <polygon points={LOGO_OUTLINE} fill="#334155" />
      <polygon points="16,6.5 24.2,11.25 24.2,20.75 16,25.5 7.8,20.75 7.8,11.25" fill="#F59E0B" />
      <text
        x="16"
        y="16.6"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="700"
        fill="#1c1917"
      >
        {value}
      </text>
    </svg>
  );
}
