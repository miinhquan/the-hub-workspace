import type { Metadata } from 'next';
import PolicyPage from '../privacy-content';

export const metadata: Metadata = {title:'Privacy Policy | The Hub',description:'How The Hub handles WhatsApp messages and service enquiries, and how to request deletion.'};

export default function PrivacyPage(){return <PolicyPage/>;}
