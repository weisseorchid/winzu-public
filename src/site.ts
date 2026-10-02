/** Live demo contacts and labels (shore CTAs in MapHud). */
export const site = {
  name: 'Winzu',
  email: 'weisseorchid@gmail.com',
  mailtoSubject: 'Winzu',
  calendlyUrl: 'https://calendly.com/weisseorchid/30min',
  fictionalBar: {
    id: 'wine-club',
    name: 'Winzu Wine Club',
    neighborhood: 'Chamberí',
    city: 'Madrid',
  },
} as const

export function mailtoHref(): string {
  const subject = encodeURIComponent(site.mailtoSubject)
  return `mailto:${site.email}?subject=${subject}`
}
