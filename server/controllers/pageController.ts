import {Request, Response} from 'express'
import prisma from '../lib/prisma'
import { chatWithFallback } from '../lib/aiHelper'

function sanitizeGeneratedPage(html: string, homeCode: string): string {
  // 1. Fix broken image tags — replace any src="" or missing src
  //    with placehold.co URLs
  const fixedImages = html.replace(
    /<img([^>]*?)src=["'](?!https?:\/\/)([^"']*?)["']/gi,
    '<img$1src="https://placehold.co/600x400/333/fff"'
  )

  // 2. If no <style> block exists, extract from home and inject
  const hasStyle = /<style[\s\S]*?<\/style>/i.test(fixedImages)
  if (!hasStyle) {
    const homeStyleMatch = homeCode.match(/<style[\s\S]*?<\/style>/i)
    if (homeStyleMatch) {
      return fixedImages.replace('<head>', `<head>${homeStyleMatch[0]}`)
    }
  }

  return fixedImages
}

// Add Page
export const addPage = async(req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const { projectId } = req.params;
        const { name, slug } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!userId || !user) {
            return res.status(401).json({message: 'Unauthorized'});
        }

        if (user.credits < 10) {
            return res.status(403).json({message: 'Add more credits to create a page'});
        }

        const project = await prisma.websiteProject.findUnique({
            where: { id: String(projectId), userId: userId },
        })

        if (!project) {
            return res.status(404).json({message: 'Project not found'})
        }

        if (!name || !slug) {
            return res.status(400).json({message: 'Page name and slug are required'});
        }

        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 10 } }
        })

        // Generate page HTML
        console.log('Starting page generation...');
        const codeGenerationResponse = await chatWithFallback([
            {
                role: 'system',
                content: `
You are an elite frontend web developer specializing in pixel-perfect 
multi-page websites.

THE EXISTING HOME PAGE CODE IS PROVIDED BELOW.
You MUST extract and replicate its EXACT:
- Background colors and color scheme
- Font families and sizes  
- Navigation bar HTML structure and styling
- Button styles (colors, border-radius, padding)
- Card/section layouts
- Spacing patterns (padding, margin values)
- Any CSS custom properties (--variables)
- Header and footer structure

TASK: Generate the complete HTML for the "${name}" page.

CRITICAL RULES — VIOLATIONS WILL BREAK THE WEBSITE:
1. Start with <!DOCTYPE html> and end with </html>
2. Copy the ENTIRE <style> block from the home page and paste it 
   into this page — then ADD styles specific to this page
3. Copy the ENTIRE <nav> block from home page EXACTLY — 
   only change the active link class
4. Use https://placehold.co/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR 
   for every image — example: https://placehold.co/600x400/1a1a2e/ffffff
5. No markdown, no code fences, no explanations — HTML ONLY
6. Internal page links must use href="/page/${slug}" pattern
7. The page must look like it belongs to the SAME website as home

HOME PAGE CODE FOR STYLE REFERENCE:
${project.current_code}
`
            },
            {
                role: 'user',
                content: `Generate the complete "${name}" page HTML. 
Follow all rules. Match the home page design exactly.`
            }
        ])

        console.log('Page code generated. Saving...');
        const rawCode = codeGenerationResponse.choices[0].message.content || '';
        const cleanCode = rawCode.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim();

        const sanitizedCode = sanitizeGeneratedPage(cleanCode, project.current_code || '')

        const page = await prisma.page.create({
            data: {
                name,
                slug,
                current_code: sanitizedCode,
                projectId: String(projectId),
            }
        });

        const version = await prisma.pageVersion.create({
            data: {
                code: sanitizedCode,
                description: 'Initial Version',
                pageId: page.id
            }
        })

        await prisma.page.update({
            where: { id: page.id },
            data: {
                current_version_index: version.id
            }
        })

        const pageWithVersions = await prisma.page.findUnique({
            where: { id: page.id },
            include: { versions: { orderBy: { timestamp: 'asc' } } }
        })

        res.json({ page: pageWithVersions })

    } catch (error: any) {
        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 10 } }
            })
        }
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Get Pages
export const getPages = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const { projectId } = req.params;

        const project = await prisma.websiteProject.findUnique({
            where: { id: String(projectId), userId: userId },
        })

        if (!project) {
            return res.status(404).json({message: 'Project not found'})
        }

        const pages = await prisma.page.findMany({
            where: { projectId: String(projectId) },
            orderBy: { order: 'asc' },
            include: { versions: { orderBy: { timestamp: 'asc' } } }
        })

        res.json({ pages })
    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Delete Page
export const deletePage = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const { projectId, pageId } = req.params;

        const project = await prisma.websiteProject.findUnique({
            where: { id: String(projectId), userId: userId },
        })

        if (!project) {
            return res.status(404).json({message: 'Project not found'})
        }

        const page = await prisma.page.findUnique({
            where: { id: String(pageId), projectId: String(projectId) },
        })

        if (!page) {
            return res.status(404).json({message: 'Page not found'})
        }

        await prisma.page.delete({
            where: { id: String(pageId) }
        })

        res.json({message: 'Page deleted successfully'})

    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Make Page Revision
export const makePageRevision = async(req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const { projectId, pageId } = req.params;
        const { message } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        })

        if (!userId || !user) {
            return res.status(401).json({message: 'Unauthorized'});
        }

        if (user.credits < 5) {
            return res.status(403).json({message: 'Add more credits to make changes'});
        }

        if (!message || message.trim() === '') {
            return res.status(400).json({message: 'Please enter a valid prompt'});
        }

        const project = await prisma.websiteProject.findUnique({
            where: { id: String(projectId), userId: userId },
        })

        if (!project) {
            return res.status(404).json({message: 'Project not found'})
        }

        const page = await prisma.page.findUnique({
            where: { id: String(pageId), projectId: String(projectId) },
            include: { versions: true }
        })

        if (!page) {
            return res.status(404).json({message: 'Page not found'})
        }

        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        })

        // Enhance User Prompt
        console.log('Starting page revision prompt enhancement...');
        const promptEnhanceResponse = await chatWithFallback([
            {
                role: 'system',
                content: `You are a prompt enhancement specialist. The user wants to make changes to their website page. Enhance their request to be more specific and actionable for a web developer.

                            Enhance this by:
                            1. Being specific about what elements to change
                            2. Mentioning design details (colors, spacing, sizes)
                            3. Clarifying the desired outcome
                            4. Using clear technical terms

                        Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).`
            },
            {
                role: 'user',
                content: `User's Request: "${message}"`
            }
        ])

        console.log('Page revision prompt enhanced. Generating updated code...');
        const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

        // Generate revised page code
        const codeGenerationResponse = await chatWithFallback([
            {
                role: 'system',
                content: `
You are editing the "${page.name}" page of a multi-page website.

THE HOME PAGE CODE IS: ${project.current_code}

RULES:
1. Keep ALL existing styles from the current page — do not remove CSS
2. Keep the navigation bar IDENTICAL to home page
3. Make ONLY the requested change
4. All images must use https://placehold.co/WIDTHxHEIGHT format
5. Return complete HTML from <!DOCTYPE html> to </html>
6. No markdown, no code fences

CURRENT PAGE CODE: ${page.current_code}
`
            },
            {
                role: 'user',
                content: `Apply this change: "${enhancedPrompt}"`
            }
        ])

        console.log('Page revision code generated. Saving...');
        const code = codeGenerationResponse.choices[0].message.content || '';
        const cleanCode = code.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim();

        const sanitizedCode = sanitizeGeneratedPage(cleanCode, project.current_code || '')

        const version = await prisma.pageVersion.create({
            data: {
                code: sanitizedCode,
                description: 'Changes made',
                pageId: String(pageId),
            }
        })

        await prisma.page.update({
            where: { id: String(pageId) },
            data: {
                current_code: sanitizedCode,
                current_version_index: version.id
            }
        })

        res.json({message: 'Page changes made successfully'})

    } catch (error: any) {
        if (userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } }
            })
        }
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Save Page Code
export const savePageCode = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const { projectId, pageId } = req.params;
        const { code } = req.body;

        const project = await prisma.websiteProject.findUnique({
            where: { id: String(projectId), userId: userId },
        })

        if (!project) {
            return res.status(404).json({message: 'Project not found'})
        }

        const page = await prisma.page.findUnique({
            where: { id: String(pageId), projectId: String(projectId) },
        })

        if (!page) {
            return res.status(404).json({message: 'Page not found'})
        }

        const sanitizedCode = sanitizeGeneratedPage(code, project.current_code || '')

        await prisma.page.update({
            where: { id: String(pageId) },
            data: { current_code: sanitizedCode }
        })

        res.json({message: 'Page code saved successfully'})

    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}

// Rollback Page Version
export const rollbackPageVersion = async(req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({message: 'Unauthorized'});
        }
        const { projectId, pageId, versionId } = req.params;

        const project = await prisma.websiteProject.findUnique({
            where: { id: String(projectId), userId: userId },
        })

        if (!project) {
            return res.status(404).json({message: 'Project not found'})
        }

        const page = await prisma.page.findUnique({
            where: { id: String(pageId), projectId: String(projectId) },
            include: { versions: true }
        })

        if (!page) {
            return res.status(404).json({message: 'Page not found'})
        }

        const version = page.versions.find((v: { id: string; code: string; description?: string | null; timestamp: Date; pageId: string }) => v.id === versionId);

        if (!version) {
            return res.status(404).json({message: 'Version not found'})
        }

        const sanitizedCode = sanitizeGeneratedPage(version.code, project.current_code || '')

        await prisma.page.update({
            where: { id: String(pageId) },
            data: {
                current_code: sanitizedCode,
                current_version_index: version.id
            }
        })

        res.json({message: 'Page rolled back successfully'})

    } catch (error: any) {
        console.log(error.code || error.message);
        res.status(500).json({message: error.message});
    }
}