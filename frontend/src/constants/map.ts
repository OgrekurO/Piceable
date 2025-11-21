export const MAP_STYLES = [
    {
        id: 'streets',
        name: '标准 (Streets)',
        type: 'm',
        filter: '',
        previewColor: '#f8f9fa',
    },
    {
        id: 'satellite',
        name: '卫星 (Satellite)',
        type: 'y',
        filter: '',
        previewColor: '#0f172a',
    },
    {
        id: 'terrain',
        name: '地形 (Terrain)',
        type: 'p',
        filter: '',
        previewColor: '#ecfccb',
    },
    {
        id: 'light',
        name: '淡色 (Light)',
        type: 'm',
        filter: 'grayscale(100%) contrast(90%) brightness(105%)',
        previewColor: '#ffffff',
    },
    {
        id: 'dark',
        name: '深色 (Dark)',
        type: 'm',
        filter: 'invert(100%) hue-rotate(180deg) brightness(90%) contrast(90%) grayscale(20%)',
        previewColor: '#171717',
    }
];

export const LANGUAGES = [
    { code: 'zh-CN', label: '中文 (简体)' },
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'fr', label: 'Français' },
];
