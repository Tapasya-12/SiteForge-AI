import {Request, Response} from 'express'
import prisma from '../lib/prisma';
import { chatWithFallback } from '../lib/aiHelper'

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
                versions: {orderBy: {timestamp: 'asc'}}
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

        // Extract style prefix if present e.g. "[Style: Dark & Luxe] user prompt"
        const styleMatch = initial_prompt.match(/^\[Style: ([^\]]+)\]\s*/);
        const styleDirective = styleMatch ? styleMatch[1] : null;
        const cleanPrompt = styleMatch ? initial_prompt.replace(styleMatch[0], '') : initial_prompt;

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
                content: `You are an elite web developer and UI/UX designer. Create a stunning, production-ready single-page website that looks like it was built by a top-tier agency.

                            DESIGN STANDARDS:
                            - Create a VISUALLY IMPRESSIVE design — not generic or plain
                            - Use beautiful color combinations with proper contrast
                            - Add depth with shadows, gradients, and layering
                            - Include smooth CSS animations (fade-in, slide-up, hover effects)
                            - Use modern design patterns: glassmorphism, gradient text, animated backgrounds where appropriate
                            - Pick 1-2 Google Fonts that match the brand (include the link tag)
                            - Every section must look polished and intentional

                            TECHNICAL REQUIREMENTS:
                            - Output ONLY raw HTML starting with <!DOCTYPE html>
                            - Include in <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                            - Use Tailwind CSS classes extensively for layout and base styling
                            - Add a <style> tag with custom CSS for: animations, gradients, glassmorphism, hover effects, and anything Tailwind can't handle
                            - Add JavaScript in a <script> tag before </body> for: smooth scroll, intersection observer animations, interactive elements
                            - Use placeholder images from https://placehold.co/
                            - Make it fully responsive — mobile-first

                            SECTION REQUIREMENTS (include all that are relevant):
                            - Navigation: sticky, with logo, links, and a CTA button
                            - Hero: full-viewport, bold headline, subtext, CTA buttons, visual element
                            - Features/Benefits: icon cards with hover effects
                            - Social proof: testimonials or stats section
                            - CTA section: compelling call-to-action
                            - Contact/Footer: form inputs must be full-width (w-full), stacked vertically, inside a centered max-w-lg container. Footer must have proper padding (py-12) and centered or grid layout — never let footer links float without a flex or grid container

                            CRITICAL RULE: The website topic, purpose, and content MUST stay exactly as the user described. If they said "portfolio for a photographer", the website must be about photography. If they said "landing page for a dog grooming business", it must be about dog grooming. Never replace their topic with something generic.

                            Enhance the prompt by ADDING these details around the user's core idea:
                            1. Specific sections with RELEVANT content for their exact topic (e.g. for a bakery: menu section, about the baker, gallery of pastries, order form)
                            2. Visual design: color palette with hex codes that FITS their topic and industry
                            3. Typography: specific Google Font names that match the mood
                            4. Animations and interactions relevant to their use case
                            5. Overall aesthetic that makes sense for their specific business or project

                            Return ONLY the enhanced prompt as 2-3 paragraphs. Start directly with the website description. No preamble, no labels.

                            LAYOUT RULES — NEVER VIOLATE THESE:
                            - Every card/item in a grid MUST be wrapped in its own <div> with padding
                            - NEVER place text directly next to another element without a containing div
                            - Product/feature cards must use: display grid or flexbox with proper gap
                            - Each card must have: padding (at least p-6), its own background or border, and all content (title + description + button) inside ONE parent div
                            - Buttons must NEVER float outside their card's div
                            - Use CSS Grid for product/service cards: grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))

                            ABSOLUTE RULES:
                            1. Start DIRECTLY with <!DOCTYPE html> — no preamble, no explanation
                            2. NO markdown, NO code fences, NO comments explaining what you did
                            3. End with </html>
                            4. Make it look like a 10000 dollar custom website — not a template
                            5. VALIDATE your layout mentally before outputting — every element must be inside a proper container`
            },
            { role: 'user', content: (enhancedPrompt || cleanPrompt) + stylePromptAddition }
        ]);

        console.log('Code generated. Saving to DB...');
        const rawCode = codeGenerationResponse.choices[0].message.content || '';
        const cleanCode = rawCode.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim();

        const version = await prisma.version.create({
            data: {
                code: cleanCode,
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
                current_code: cleanCode,
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