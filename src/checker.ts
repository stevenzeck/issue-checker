function hasUncheckedCheckboxes(text: string): boolean {
  const uncheckedCheckboxRegex = /-\s\[\s]/g
  return uncheckedCheckboxRegex.test(text)
}

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lowercaseContent = text.toLowerCase()
  return keywords.every(keyword =>
    lowercaseContent.includes(keyword.toLowerCase())
  )
}

export async function isBodyValid(
  body?: string,
  checkCheckboxes = false,
  keywords?: string[]
): Promise<boolean> {
  if (!body) {
    return false
  }

  if (checkCheckboxes && hasUncheckedCheckboxes(body)) {
    return false
  }

  return keywords ? matchesKeywords(body, keywords) : true
}
