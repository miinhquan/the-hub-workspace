import type { Metadata } from 'next';
import PolicyPage from '../privacy-content';

export const metadata: Metadata = {title:'Data Deletion Instructions | The Hub',description:'Contact The Hub to request access, correction or deletion of your service enquiry data.'};

export default function DataDeletionPage(){return <PolicyPage deletion/>;}
