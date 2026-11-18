type LogoProps = {
  size?: number;
};

// Contorno do logo: hexágono com ponta para cima, num viewBox de 32x32.
const LOGO_OUTLINE = "16,2 28.1,9 28.1,23 16,30 3.9,23 3.9,9";

// O d20 visto de frente (identidade visual do produto): hexágono sólido em azul-tinta com a
// face de cima, um triângulo, em mel. O triângulo é o que diz "dado" e não "favo de mel".
export function Logo({ size = 32 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <polygon points={LOGO_OUTLINE} fill="#2F3D8F" />
      <polygon points="16,7 24,20.5 8,20.5" fill="#F5A524" />
    </svg>
  );
}

type NumberHexagonProps = {
  value: number;
  size?: number;
};

// O d20 do logo com um número na face, como um dado rolado. A face é maior que a do logo para o
// número caber na parte larga do triângulo. Decorativo (aria-hidden): quem usa expõe o número de
// outro jeito, por exemplo como item de uma <ol>. Número em quase preto sobre mel: 8,3:1.
export function NumberHexagon({ value, size = 64 }: NumberHexagonProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <polygon points={LOGO_OUTLINE} fill="#2F3D8F" />
      <polygon points="16,4.5 26.4,22.5 5.6,22.5" fill="#F5A524" />
      <text
        x="16"
        y="17.4"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="9.5"
        fontWeight="700"
        fill="#191c2e"
      >
        {value}
      </text>
    </svg>
  );
}
