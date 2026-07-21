const IMAGE_INTENT_RE = /\b(?:image|pic(?:ture)?|photo|draw|sketch|logo|wallpaper|avatar|minecraft|anime|realistic|portrait|illustration|pixel\s+art|render|banner|thumbnail|icon|art|generate\s+(?:an?\s+)?(?:image|pic|photo|portrait|art|illustration|sketch|logo|wallpaper|banner|thumbnail|icon|avatar|minecraft|anime|realistic|pixel\s+art|render|picture)|create\s+(?:an?\s+)?(?:image|pic|photo|portrait|art|illustration|sketch|logo|wallpaper|banner|thumbnail|icon|avatar|minecraft|anime|realistic|pixel\s+art|render|picture)|make\s+(?:a\s+)?(?:logo|wallpaper|image|pic|photo|portrait|art|illustration|sketch|banner|thumbnail|icon|avatar|minecraft|anime|realistic|pixel\s+art|render|picture)|photo\s+bana|pic\s+bana|bana|banado)\b/i

export function hasImageIntent(text) {
  return IMAGE_INTENT_RE.test(text)
}
