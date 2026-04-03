export function buildImagePrompt(slotName: string, websiteContext: string): string {
	const slotPhrase = slotName.replace(/-/g, ' ').trim();
	return `${slotPhrase}, ${websiteContext}, professional photography, high resolution, natural lighting, realistic, website hero image quality`;
}

export function buildPollinationsUrl(
	prompt: string,
	width: number = 800,
	height: number = 500,
	seed?: number
): string {
	const encodedPrompt = encodeURIComponent(prompt);
	return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&model=flux${seed ? `&seed=${seed}` : ''}`;
}

export function extractImageDimensions(imgTag: string): { width: number; height: number } {
	const slotMatch = imgTag.match(/data-image-slot="([^"]*)"/i);
	const slotName = (slotMatch?.[1] || '').toLowerCase();

	if (/(portrait|avatar|profile|person)/i.test(slotName)) {
		return { width: 600, height: 700 };
	}

	if (/(hero|showcase|banner)/i.test(imgTag)) {
		return { width: 1200, height: 600 };
	}

	const widthAttrMatch = imgTag.match(/\bwidth="(\d+)"/i);
	const heightAttrMatch = imgTag.match(/\bheight="(\d+)"/i);
	if (widthAttrMatch && heightAttrMatch) {
		return {
			width: Number(widthAttrMatch[1]) || 800,
			height: Number(heightAttrMatch[1]) || 500,
		};
	}

	const styleMatch = imgTag.match(/style="([^"]*)"/i);
	if (styleMatch) {
		const style = styleMatch[1];
		const styleWidthMatch = style.match(/width\s*:\s*(\d+)px/i);
		const styleHeightMatch = style.match(/height\s*:\s*(\d+)px/i);
		if (styleWidthMatch && styleHeightMatch) {
			return {
				width: Number(styleWidthMatch[1]) || 800,
				height: Number(styleHeightMatch[1]) || 500,
			};
		}
	}

	return { width: 800, height: 500 };
}

export async function injectAIImages(html: string, websiteContext: string): Promise<string> {
	try {
		const imgTagRegex = /<img\s[^>]*?data-image-slot="([^"]*)"[^>]*?>/gis;
		const matches = Array.from(html.matchAll(imgTagRegex));

		if (!matches.length) {
			return html;
		}

		let resultHtml = html;

		for (const match of matches) {
			const fullImgTag = match[0];
			const slotName = (match[1] || '').trim();

			if (!slotName) {
				continue;
			}

			// Only replace placeholder SVG sources; keep already-real URLs unchanged.
			if (!/src="data:image\/svg\+xml/i.test(fullImgTag)) {
				continue;
			}

			const altMatch = fullImgTag.match(/alt="([^"]*)"/i);
			const fallbackSlotPhrase = slotName.replace(/-/g, ' ').trim();
			const altText = (altMatch?.[1] || fallbackSlotPhrase).trim();
			const hasDescriptiveAlt = altText.split(/\s+/).filter(Boolean).length > 3;
			const primaryDescriptor = hasDescriptiveAlt ? altText : fallbackSlotPhrase;

			const prompt = buildImagePrompt(primaryDescriptor.replace(/\s+/g, '-'), websiteContext);
			const seed = slotName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

			const tagStartIndex = match.index ?? -1;
			const contextStart = Math.max(0, tagStartIndex - 200);
			const surroundingContext = tagStartIndex >= 0 ? html.slice(contextStart, tagStartIndex) : '';
			const { width, height } = extractImageDimensions(`${surroundingContext}${fullImgTag}`);
			const pollinationsUrl = buildPollinationsUrl(prompt, width, height, seed);

			const newImgTag = fullImgTag.replace(/src="[^"]*"/i, `src="${pollinationsUrl}"`);
			resultHtml = resultHtml.replace(fullImgTag, newImgTag);
		}

		return resultHtml;
	} catch (error) {
		console.error('injectAIImages failed:', error);
		return html;
	}
}
