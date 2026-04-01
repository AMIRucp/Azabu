import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
});

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generatePalette(seed: string): { primary: string; secondary: string; accent: string; bg: string } {
  const h = hashString(seed);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + (h % 60)) % 360;
  const hue3 = (hue1 + 180 + (h % 40)) % 360;
  return {
    primary: `hsl(${hue1}, 75%, 60%)`,
    secondary: `hsl(${hue2}, 65%, 50%)`,
    accent: `hsl(${hue3}, 80%, 70%)`,
    bg: `hsl(${hue1}, 30%, 12%)`,
  };
}

export async function generateTokenLogo(
  tokenName: string,
  tokenSymbol: string,
  description?: string
): Promise<string> {
  const palette = generatePalette(tokenSymbol + tokenName);

  const prompt = `Generate a clean, professional SVG logo for a cryptocurrency token.

Token details:
- Name: ${tokenName}
- Symbol: ${tokenSymbol}
${description ? `- Description: ${description}` : ''}

Color palette to use:
- Primary: ${palette.primary}
- Secondary: ${palette.secondary}
- Accent: ${palette.accent}
- Background: ${palette.bg}

Requirements:
- Output ONLY the raw SVG code, nothing else. No markdown, no explanation.
- The SVG must be exactly 512x512 pixels with viewBox="0 0 512 512"
- Use a circular or rounded shape as the base
- Include a gradient background using the provided colors
- Feature the token symbol "${tokenSymbol}" prominently in the center using a bold, clean font
- Add subtle geometric shapes or patterns that relate to the token name for visual interest
- Keep it minimal and professional - think modern crypto/fintech branding
- Use only inline styles, no external CSS or fonts
- Do not use any <text> elements that reference external fonts. Use font-family="Arial, Helvetica, sans-serif"
- Make sure the design looks good at small sizes (48x48) as well as large
- No external references or links`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let svg = textBlock.text.trim();

    const svgMatch = svg.match(/<svg[\s\S]*<\/svg>/i);
    if (!svgMatch) {
      throw new Error('No valid SVG found in response');
    }
    svg = svgMatch[0];

    if (!svg.includes('viewBox')) {
      svg = svg.replace('<svg', '<svg viewBox="0 0 512 512"');
    }

    const svgBase64 = Buffer.from(svg).toString('base64');
    return `data:image/svg+xml;base64,${svgBase64}`;
  } catch (err: any) {
    console.error('Logo generation failed, using fallback:', err.message);
    return generateFallbackLogo(tokenSymbol, palette);
  }
}

function generateFallbackLogo(
  symbol: string,
  palette: { primary: string; secondary: string; accent: string; bg: string }
): string {
  const displaySymbol = symbol.slice(0, 4);
  const fontSize = displaySymbol.length <= 2 ? 180 : displaySymbol.length === 3 ? 140 : 110;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.primary};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${palette.secondary};stop-opacity:1"/>
    </linearGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${palette.accent};stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0.1"/>
    </linearGradient>
  </defs>
  <circle cx="256" cy="256" r="256" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="230" fill="none" stroke="url(#ring)" stroke-width="3"/>
  <circle cx="256" cy="256" r="200" fill="none" stroke="url(#ring)" stroke-width="1.5"/>
  <text x="256" y="256" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${fontSize}" fill="white" text-anchor="middle" dominant-baseline="central" style="letter-spacing:0.05em">${displaySymbol}</text>
</svg>`;

  const svgBase64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${svgBase64}`;
}
