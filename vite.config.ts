import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import vue from '@vitejs/plugin-vue2';
import path from 'path';

const homepageURL = 'https://github.com/seiuneko/JandanTopSnapshot';
const downloadBaseURL = `${homepageURL}/releases/latest/jandan-top-snapshot.`;

const jandanIcon = 'data:image/webp;base64,UklGRnoAAABXRUJQVlA4TG4AAAAv/8A/EC+gkG0E6PxzcOfxKZwGmbRNPNb/Nx9T0LYN0zdE48/szX8A+H2AivbegKK2jaShMBSGwlJYCsMfzbXXs9uI/k+AHDtDeTYOq/N4dl3cpsfjM1t+j3PxldL//4Je3s/LfB39v3Asp/8AGw==';

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
    const namePrefix = mode === 'development' ? 'dev: ' : '';

    return {
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src')
            }
        },
        build: {
            cssMinify: true,
        },
        plugins: [
            vue(),
            monkey({
                entry: 'src/main.ts',
                build: {
                    metaFileName: true,
                },
                userscript: {
                    name: {
                        '': `${namePrefix}Jandan Top Snapshot`,
                        'zh-CN': `${namePrefix}煎蛋热榜快照`,
                    },
                    description: {
                        'zh-CN': '为煎蛋热榜添加快照功能，还有其他一些小功能',
                    },
                    namespace: 'https://github.com/seiuneko/JandanTopSnapshot',
                    icon: jandanIcon,
                    downloadURL: `${downloadBaseURL}user.js`,
                    supportURL: `${homepageURL}/issues`,
                    homepageURL: `${homepageURL}`,
                    updateURL: `${downloadBaseURL}meta.js`,
                    match: ['https://jandan.net/top*'],
                },
            }),
        ],
    };
});
