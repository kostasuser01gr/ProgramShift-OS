import {notFound} from 'next/navigation';
import SyntheticDemo from './synthetic.jsx';
export const dynamic='force-dynamic';
export default function DemoPage(){
  if(process.env.ENABLE_SYNTHETIC_DEMO!=='true')notFound();
  return <SyntheticDemo/>;
}
