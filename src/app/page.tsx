import { redirect } from 'next/navigation';

export default function Page() {
  // Server-side redirect avoids loading any client JS on the root route
  redirect('/home');
}
