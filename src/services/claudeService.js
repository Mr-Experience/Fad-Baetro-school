import Anthropic from '@anthropic-ai/sdk';

const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

if (!API_KEY) {
    console.warn('Claude API key not found. Please set VITE_CLAUDE_API_KEY in your .env.local file.');
}

const anthropic = API_KEY ? new Anthropic({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true
}) : null;

export const refineDesignWithClaude = async (currentDesign, refinementRequest) => {
    if (!anthropic) {
        throw new Error('Claude API key not configured. Please set VITE_CLAUDE_API_KEY in your environment variables.');
    }

    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            temperature: 0.7,
            system: `You are a CSS design expert. Your task is to refine existing CSS code based on user requests.
            Focus on creating clean, modern designs with white backgrounds and subtle strokes/borders.
            Always maintain the functionality while improving the visual design.
            Return only the refined CSS code without explanations.`,
            messages: [
                {
                    role: 'user',
                    content: `Please refine this CSS design with the following request: "${refinementRequest}"

Current CSS:
${currentDesign}

Please provide the refined CSS that uses white backgrounds and clean stroke/border designs.`
                }
            ]
        });

        return message.content[0].text;
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error('Failed to refine design with Claude');
    }
};

export const generateDesignFromScratch = async (designDescription) => {
    if (!anthropic) {
        throw new Error('Claude API key not configured. Please set VITE_CLAUDE_API_KEY in your environment variables.');
    }

    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            temperature: 0.7,
            system: `You are a CSS design expert. Create modern, clean CSS designs with white backgrounds and subtle strokes.
            Focus on creating beautiful, functional designs that work well in web applications.
            Return only the CSS code without explanations.`,
            messages: [
                {
                    role: 'user',
                    content: `Create a modern CSS design for: ${designDescription}

Requirements:
- Use white backgrounds (#ffffff or similar)
- Clean borders and strokes
- Modern color palette
- Good spacing and typography
- Responsive design considerations
- Smooth transitions and hover effects`
                }
            ]
        });

        return message.content[0].text;
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error('Failed to generate design with Claude');
    }
};

export const optimizeCSS = async (cssCode) => {
    if (!anthropic) {
        throw new Error('Claude API key not configured. Please set VITE_CLAUDE_API_KEY in your environment variables.');
    }

    try {
        const message = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4000,
            temperature: 0.3,
            system: `You are a CSS optimization expert. Clean up and optimize CSS code while maintaining functionality.
            Focus on removing redundancy, improving readability, and ensuring modern best practices.
            Return only the optimized CSS code.`,
            messages: [
                {
                    role: 'user',
                    content: `Please optimize and clean up this CSS code:

${cssCode}

Make it more maintainable, remove any redundant styles, and ensure it follows modern CSS best practices.`
                }
            ]
        });

        return message.content[0].text;
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error('Failed to optimize CSS with Claude');
    }
};