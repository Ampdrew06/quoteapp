import {isAdminUser} from './userRole';
// Remember only an identity that has passed the Schedule's server-side check.
// A device's local admin flag alone never creates database credentials.
export const SCHEDULE_ADMIN_SESSION_KEY='quoteapp_verified_schedule_admin_v1';
export function clearScheduleAdminSession(){try{localStorage.removeItem(SCHEDULE_ADMIN_SESSION_KEY);}catch{}}
export function rememberScheduleAdmin(current,code){
 if(!isAdminUser()||!current?.id||current.role!=='admin'||!code)return;
 try{localStorage.setItem(SCHEDULE_ADMIN_SESSION_KEY,JSON.stringify({id:current.id,loginCode:code}));}catch{}
}
export function scheduleAdminCredentials(current){
 if(!isAdminUser())throw new Error('Administrator access is required to use Schedule.');
 if(current?.id&&current.role==='admin'&&current.loginCode)return {current,code:current.loginCode};
 try{const saved=JSON.parse(localStorage.getItem(SCHEDULE_ADMIN_SESSION_KEY)||'null');if(saved?.id&&saved.loginCode)return {current:{id:saved.id,role:'admin'},code:saved.loginCode};}catch{}
 throw new Error('Sign in once with your saved administrator account. Schedule will remember it on this admin device until you sign out.');
}
