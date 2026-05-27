/** Always use root-relative anchors so /blog + #about does not break. */
export const navLinks = [
	{ href: '/#about', label: 'About' },
	{ href: '/#projects', label: 'Projects' },
	{ href: '/#stack', label: 'Stack' },
	{ href: '/#github', label: 'GitHub' },
	{ href: '/#contact', label: 'Contact' },
	{ href: '/blog', label: 'Notes' },
] as const;
