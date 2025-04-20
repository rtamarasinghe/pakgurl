export function getAssetsPath(): string {
    const href = window.location.href;
    if (href.includes('github.io')) {
        return '/pakgurl/assets/';
    } else if (href.startsWith('http://localhost:8080')) {
        // Development server - assets are served from root
        return '/assets/';
    } else {
        // Locally hotsed in development env
        return '/public/assets/';
    }
} 