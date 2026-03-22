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

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user && user.credits < 5) {
            return res.status(403).json({ message: 'Add credits to create more projects' });
        }

        const project = await prisma.websiteProject.create({
            data: {
                name: initial_prompt.length > 50 ? initial_prompt.substring(0, 47) + '...' : initial_prompt,
                initial_prompt,
                userId
            }
        });

        await prisma.user.update({
            where: { id: userId },
            data: { totalCreation: { increment: 1 } }
        });

        await prisma.conversation.create({
            data: { role: 'user', content: initial_prompt, projectId: project.id }
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
            { role: 'user', content: initial_prompt }
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
                            - Footer: links, copyright, social icons

                            ABSOLUTE RULES:
                            1. Start DIRECTLY with <!DOCTYPE html> — no preamble
                            2. NO markdown, NO code fences, NO explanations
                            3. End with </html>`
            },
            { role: 'user', content: enhancedPrompt || initial_prompt }
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