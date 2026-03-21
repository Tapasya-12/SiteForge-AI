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
                content: `You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.
                        Enhance this prompt by:
                        1. Adding specific design details (layout, color scheme, typography)
                        2. Specifying key sections and features
                        3. Describing the user experience and interactions
                        4. Including modern web design best practices
                        5. Mentioning responsive design requirements
                        6. Adding any missing but important elements
                        Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).`
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
                content: `You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}"

                        CRITICAL REQUIREMENTS:
                        - Output valid HTML ONLY
                        - Use Tailwind CSS for ALL styling
                        - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                        - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
                        - Use modern, beautiful design with great UX using Tailwind classes
                        - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
                        - Include all necessary meta tags
                        - Use placeholder images from https://placehold.co/600x400

                        CRITICAL HARD RULES:
                        1. Output ONLY raw HTML into message.content — no markdown, no code fences, no explanations
                        2. Do NOT wrap in \`\`\`html or any backticks
                        3. Start your response directly with <!DOCTYPE html>`
            },
            { role: 'user', content: enhancedPrompt || '' }
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