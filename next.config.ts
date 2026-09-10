import type {NextConfig} from 'next';
const config:NextConfig={
 basePath:process.env.NEXT_PUBLIC_LIBRARY_BASE_PATH||'',
 devIndicators:false,
 turbopack:{root:__dirname},
 experimental:{turbopackFileSystemCacheForDev:false},
 async headers(){return [{source:'/models/optimized/shared/:path*',headers:[{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}];},
};
export default config;
