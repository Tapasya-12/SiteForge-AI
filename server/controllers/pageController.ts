import {Request, Response} from 'express'
import prisma from '../lib/prisma'
import { chatWithFallback } from '../lib/aiHelper'
import { getPalettePromptBlock } from '../lib/colorPalette'

const getStylePresetFromPrompt = (initialPrompt?: string | null): string => {
    if (!initialPrompt) return 'clean-saas'

    const styleMatch = initialPrompt.match(/^\[(?:style|STYLE):\s*([^\]]+)\]\s*/i)
    const styleDirective = styleMatch ? styleMatch[1] : null

    const presetLabelToKey: Record<string, string> = {
        'dark & luxe': 'dark-luxe',
        'bold agency': 'bold-agency',
        'clean saas': 'clean-saas',
        'minimalist': 'minimalist',
        'neon future': 'neon-future',
        'warm & earthy': 'warm-earthy',
    }

    if (!styleDirective) return 'clean-saas'

    return presetLabelToKey[styleDirective.trim().toLowerCase()] || styleDirective.trim().toLowerCase()
}

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

        const stylePreset = getStylePresetFromPrompt(project.initial_prompt)
        const palettePromptBlock = getPalettePromptBlock(stylePreset)

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
        const stylePreset = getStylePresetFromPrompt(project.initial_prompt)
        const palettePromptBlock = getPalettePromptBlock(stylePreset)

        // Generate revised page code
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