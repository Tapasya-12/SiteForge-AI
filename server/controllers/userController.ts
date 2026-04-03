import {Request, Response} from 'express'
import prisma from '../lib/prisma';
import { chatWithFallback } from '../lib/aiHelper'
import { getPalettePromptBlock } from '../lib/colorPalette'
import { injectAIImages } from '../lib/imageHelper'

// Get User Credits
export const getUserCredits = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const user = await prisma.user.findUnique({
            where: {id: userId}
        })
        res.json({credits: user?.credits})
    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Purchase Credits
export const purchaseCredits = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        res.status(200).json({ message: 'Purchase credits coming soon' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

// Get Single User Project
export const getUserProject = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const projectId = req.params.projectId as string;
        const project = await prisma.websiteProject.findUnique({
            where: {id: projectId, userId},
            include: {
                conversation: {
                    orderBy: {timestamp: 'asc'}
                },
                versions: {orderBy: {timestamp: 'asc'}},
                pages: {
                    orderBy: { order: 'asc' },
                    include: { versions: { orderBy: { timestamp: 'asc' } } }
                }
            }
        })
        if (!project) {
            return res.status(404).json({message: 'Project not found'});
        }
        res.json({project})
    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Get All User Projects
export const getUserProjects = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const projects = await prisma.websiteProject.findMany({
            where: {userId},
            orderBy: {updatedAt: 'desc'}
        })
        res.json({projects})
    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Toggle Publish
export const togglePublish = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const projectId = req.params.projectId as string;
        const project = await prisma.websiteProject.findUnique({
            where: {id: projectId, userId}
        })
        if (!project) {
            return res.status(404).json({message: 'Project not found'});
        }
        await prisma.websiteProject.update({
            where: {id: projectId},
            data: {isPublished: !project.isPublished}
        })
        res.json({message: project.isPublished ? 'Project Unpublished' : 'Project Published Successfully'})
    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Create User Project
export const createUserProject = async(req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const { initial_prompt } = req.body;

                // Extract style prefix if present e.g. "[STYLE:dark-luxe]" or "[Style: Dark & Luxe]"
                const styleMatch = initial_prompt.match(/^\[(?:style|STYLE):\s*([^\]]+)\]\s*/i);
        const styleDirective = styleMatch ? styleMatch[1] : null;
        const cleanPrompt = styleMatch ? initial_prompt.replace(styleMatch[0], '') : initial_prompt;

                const presetLabelToKey: Record<string, string> = {
                    'dark & luxe': 'dark-luxe',
                    'bold agency': 'bold-agency',
                    'clean saas': 'clean-saas',
                    'minimalist': 'minimalist',
                    'neon future': 'neon-future',
                    'warm & earthy': 'warm-earthy',
                }
                const stylePreset = styleDirective
                    ? (presetLabelToKey[styleDirective.trim().toLowerCase()] || styleDirective.trim().toLowerCase())
                    : 'clean-saas'
                const palettePromptBlock = getPalettePromptBlock(stylePreset)

        const styleInstructions: Record<string, string> = {
          'Dark & Luxe':      'Use a dark background (#0a0a0a or #0f0f0f), gold/amber accent colors (#d4af37, #f59e0b), elegant serif display font, premium glassmorphism cards, subtle gold gradient borders.',
          'Bold Agency':      'Use oversized bold typography as a design element, vibrant unexpected color combinations (e.g. electric blue + hot pink, or lime + purple), asymmetric layouts, large whitespace, creative hover animations.',
          'Clean SaaS':       'Use a clean white background with indigo/violet as primary color (#6366f1), plenty of whitespace, subtle shadows, rounded corners, professional Inter or Plus Jakarta Sans font, gradient CTAs.',
          'Minimalist':       'Use strictly black and white with maximum whitespace, typography-driven layout, thin elegant fonts (Cormorant Garamond or Playfair Display), no decorative elements, let spacing do the work.',
          'Neon Future':      'Use a very dark background (#050510), bright neon accent colors (cyan #00f5ff, purple #bf00ff), glowing box-shadows, monospace or tech fonts (Space Grotesk), grid/circuit patterns.',
          'Warm & Earthy':    'Use warm cream/beige backgrounds (#faf7f2, #f5efe6), terracotta and sage green accents (#c17f5a, #6b8f71), organic shapes with border-radius, serif fonts, natural textures via CSS gradients.',
        }

        const stylePromptAddition = styleDirective && styleInstructions[styleDirective]
          ? `\n\nSTYLE DIRECTIVE — Apply this specific visual style: ${styleInstructions[styleDirective]}`
          : ''

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user && user.credits < 5) {
            return res.status(403).json({ message: 'Add credits to create more projects' });
        }

        const project = await prisma.websiteProject.create({
            data: {
                name: cleanPrompt.length > 50 ? cleanPrompt.substring(0, 47) + '...' : cleanPrompt,
                initial_prompt: cleanPrompt,
                userId
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { totalCreation: { increment: 1 } }
        });

        await prisma.conversation.create({
            data: { role: 'user', content: cleanPrompt, projectId: project.id }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        });

        // Enhance User Prompt
        console.log('Starting prompt enhancement...');
        const promptEnhanceResponse = await chatWithFallback([
            {
                role: 'system',
                content: `You are an expert web designer and prompt engineer. Transform the user's website request into a detailed, vivid design brief that will produce a stunning, professional website.

Enhance the prompt by specifying:
1. Visual design: color palette (give specific hex codes), typography (specific font names), spacing and layout style
2. Key sections needed with specific content for each
3. UI components: buttons, cards, navigation style, hero section details
4. Animations and interactions to include
5. Overall mood and aesthetic (e.g. "luxurious dark theme", "clean minimal SaaS", "vibrant creative agency")
6. Responsive behavior on mobile

Return ONLY the enhanced prompt as 2-3 detailed paragraphs. No preamble, no labels, just the prompt itself.`
            },
            { role: 'user', content: cleanPrompt }
        ]);

        console.log('Prompt enhanced. Starting code generation...');
        const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I've enhanced your prompt to: "${enhancedPrompt}"`,
                projectId: project.id
            }
        });

        await prisma.conversation.create({
            data: { role: 'assistant', content: `Now generating your website..`, projectId: project.id }
        });

        // Generate Website Code
        const codeGenerationResponse = await chatWithFallback([
            {
                role: 'system',
                                content: `${palettePromptBlock}

SECTION 1 - Output format rules:
- Return ONLY raw HTML. No markdown, no code fences, no explanation text.
- The entire output must be a single complete HTML file starting with <!DOCTYPE html>.
- All CSS must be in a <style> block inside <head>. No external CSS files.
- All JS must be in a <script> block before </body>. No external JS files.
- Do not include any comments in the output HTML.

SECTION 2 - Layout structure rules:
- Every website must have all of these sections in order:
    1. A <nav> with the site logo/name on the left and navigation links on the right, with a CTA button. Use position: sticky; top: 0; with a solid background and box-shadow so it stays visible while scrolling.
    2. A full-width hero section with a large headline (h1), a 2-sentence subheadline (p), a primary CTA button, and a secondary ghost button. The hero must have a minimum height of 80vh and use a background color from the CSS variables, not an image.
    3. A features or benefits section using a 3-column CSS grid of cards. Each card must have an icon (use a relevant Unicode emoji as the icon, styled large), a bold heading, and 2 sentences of descriptive body text. Never write "Feature 1" or "Benefit 1" - write real descriptive headings and text based on the website topic from the prompt.
    4. An image showcase section with a 2-column layout: text content on one side, an image on the other. See SECTION 4 for how to handle the image.
    5. A content-rich section relevant to the website topic - for example: a pricing table, a stats row, a testimonials section, a how-it-works steps section, or a FAQ accordion. Choose the most appropriate one based on the prompt.
    6. A CTA banner section with a contrasting background color, a bold headline, a subheadline, and a button.
    7. A <footer> with the site name, 3 columns of links, and a copyright line.
- All sections must have generous padding: minimum 80px top and bottom.
- The page must be fully responsive. Use CSS Grid and Flexbox. At screen widths below 768px, all multi-column layouts must stack to a single column.

SECTION 3 - Content quality rules:
- Every piece of text content must be real, specific, and relevant to the website topic in the user prompt. Never use placeholder text like: "Lorem ipsum", "Alert 1", "Alert 2", "Feature 1", "Item 1", "Coming soon", "Title here", "Description here", "Your text here", or any similar filler.
- Write real headings, real body copy, real button labels, real nav link names, real footer link names - all matching the topic and purpose of the website.
- The hero h1 must be a compelling, specific headline for the site's topic.
- Card headings in the features section must be named after real features or benefits, not generic labels.

SECTION 4 - Image handling rules (critical - read carefully):
- Do NOT generate <img> tags with empty src="" or src="#". These produce gray boxes.
- Do NOT use external image URLs from unsplash.com, picsum.photos, placeholder.com, via.placeholder.com, or any other external source. These may fail to load.
- For EVERY image in the layout, generate an inline SVG placeholder using this exact pattern as the src value (URL-encoded):
    src="data:image/svg+xml,%3Csvg xmlns='http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e8e8e8'/%3E%3Ctext x='400' y='250' font-family='sans-serif' font-size='18' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3E[descriptive label for this image]%3C%2Ftext%3E%3C%2Fsvg%3E"
    Replace [descriptive label for this image] with a short label describing what image should go here, e.g. "Farmer inspecting crops" or "Dashboard screenshot".
- Every <img> tag must also have:
    - a descriptive alt attribute matching the image label
    - width="100%" style="border-radius: 12px; display: block;"
    - a data-image-slot attribute with a kebab-case description of the image, e.g. data-image-slot="hero-farmer-crops"
- The data-image-slot attribute will be used later to replace these with real AI-generated images.
- Use a maximum of 3 images per page to keep the layout clean.
- Every data-image-slot value must be unique within the page. No two img tags may share the same data-image-slot value.
- The data-image-slot value must be descriptive and specific to the content, not generic. Use values like "wheat-harvest-sunset", "farmer-using-tablet", "crop-disease-closeup" rather than "image-1", "hero-image", "photo".

SECTION 5 - Visual design rules:
- Use the CSS custom properties provided in the palette block for ALL colors. Never hardcode hex values outside of the :root { } block.
- Buttons must have: padding 12px 28px, border-radius 6px, font-weight 600, cursor pointer, and a hover state that darkens or lightens by using opacity.
- Cards must have: background var(--color-secondary), border-radius 12px, padding 32px, and a subtle box-shadow: 0 2px 12px rgba(0,0,0,0.07).
- The navbar, hero, and footer must each have a visually distinct background color using the palette variables so the page has clear visual separation between sections.
- Body font: system-ui, -apple-system, sans-serif. Base font size 16px. Line height 1.7 on body text.
- Headings: h1 = 3.5rem, h2 = 2.2rem, h3 = 1.3rem. All headings font-weight 700.
- Max content width: 1100px centered with margin: 0 auto on inner containers.

SECTION 6 - Strictly forbidden:
- No empty sections (a section tag with no visible content).
- No "coming soon" text anywhere.
- No external font imports (Google Fonts etc.) that require a network request.
- No images with broken or empty src attributes.
- No generic filler text of any kind.
- The output must be a website that looks professionally designed and content-complete the moment it renders, even without any real images or data.

The user's prompt describing the website will follow this system prompt.
Generate the complete HTML now.`
            },
            { role: 'user', content: (enhancedPrompt || cleanPrompt) + stylePromptAddition }
        ]);

        console.log('Code generated. Saving to DB...');
        const rawCode = codeGenerationResponse.choices[0].message.content || '';
        const cleanCode = rawCode.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim();
        const websiteContext = `${project.initial_prompt}, website`;
        const htmlWithImages = await injectAIImages(cleanCode, websiteContext);

        const version = await prisma.version.create({
            data: {
                code: htmlWithImages,
                description: 'Initial Version',
                projectId: project.id
            }
        });

        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've created your website! You can now preview it and request any changes.",
                projectId: project.id
            }
        });

        await prisma.websiteProject.update({
            where: { id: project.id },
            data: {
                current_code: htmlWithImages,
                current_version_index: version.id
            }
        });

        res.json({ projectId: project.id });

    } catch (error: any) {
        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } }
            });
        }
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
}