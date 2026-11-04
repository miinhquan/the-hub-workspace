import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'The Hub Workspace',description:'Private operations console for The Hub Hanoi',robots:{index:false,follow:false},icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
