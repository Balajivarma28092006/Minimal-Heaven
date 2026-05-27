export const site = {
	name: 'Balaji K.',
	title: 'Backend & Systems Engineering Student',
	lead: 'Building concurrent systems, network services, and low-level tooling with an emphasis on correctness and performance.',
	description:
		'Computer science student focused on backend engineering, systems programming, networking, and concurrent applications.',
	url: 'https://example.com',
	email: 'hello@example.com',
	github: 'https://github.com/yourusername',
	linkedin: 'https://linkedin.com/in/yourusername',
	resume: '/resume.pdf',
	location: 'India',
	/** Add `public/images/portrait.jpg` and set path here. Shown in grayscale. */
	portrait: '/images/portrait.svg',
	portraitAlt: 'Portrait of Balaji K.',
	about: [
		'I work on systems where correctness and latency matter — thread pools, socket I/O, process synchronization, and service boundaries.',
		'Most of my time goes into C/C++, Go, and Python for backend services, with a growing focus on Linux internals and network programming.',
		'I prefer small, well-tested components over large abstractions. If it cannot be reasoned about under load, it is not done.',
	],
	interests: [
		'Network programming & socket APIs',
		'Operating systems & process models',
		'Backend service architecture',
		'Concurrent & parallel systems',
		'Linux tooling & debugging',
	],
	pinnedRepos: [
		{
			name: 'tcp-proxy-server',
			description: 'Multithreaded TCP proxy with connection pooling and graceful shutdown.',
			language: 'C++',
			stars: 12,
			url: 'https://github.com/yourusername/tcp-proxy-server',
		},
		{
			name: 'macos-ui-sim',
			description: 'Browser-based macOS desktop environment with window management.',
			language: 'TypeScript',
			stars: 8,
			url: 'https://github.com/yourusername/macos-ui-sim',
		},
		{
			name: 'stock-visualizer',
			description: 'Real-time market data pipeline with WebSocket ingestion.',
			language: 'Python',
			stars: 5,
			url: 'https://github.com/yourusername/stock-visualizer',
		},
	],
	recentCommits: [
		{ repo: 'tcp-proxy-server', message: 'fix: race condition in worker thread shutdown', time: '2h ago' },
		{ repo: 'macos-ui-sim', message: 'refactor: extract window manager state machine', time: '1d ago' },
		{ repo: 'stock-visualizer', message: 'feat: add rolling OHLC aggregation', time: '3d ago' },
	],
} as const;

export type SiteConfig = typeof site;
