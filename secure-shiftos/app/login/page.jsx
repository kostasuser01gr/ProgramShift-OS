'use client';
import {signIn} from 'next-auth/react';
export default function Login(){return <main className="loginWrap"><section className="loginCard">
  <div className="brandIcon">E</div><p className="eyebrow">PRIVATE OPERATIONS PORTAL</p>
  <h1>Europcar ShiftOS</h1><p>Η πρόσβαση επιτρέπεται αποκλειστικά στους εγκεκριμένους προϊσταμένους και editors.</p>
  <button className="primary" onClick={()=>signIn('azure-ad',{callbackUrl:'/'})}>Σύνδεση με εταιρικό Microsoft 365</button>
  <p className="fine">Δεν υπάρχει δημόσια εγγραφή ή δυνατότητα πρόσβασης με τον κοινό λογαριασμό σταθμού.</p>
</section></main>}
