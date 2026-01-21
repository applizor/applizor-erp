(()=>{var e={};e.id=7012,e.ids=[7012],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},85158:e=>{"use strict";e.exports=require("http2")},95687:e=>{"use strict";e.exports=require("https")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},12781:e=>{"use strict";e.exports=require("stream")},76224:e=>{"use strict";e.exports=require("tty")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},73615:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>d,routeModule:()=>y,tree:()=>c});var r=s(50482),a=s(69108),i=s(62563),n=s.n(i),o=s(68300),l={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);s.d(t,l);let c=["",{children:["(main)",{children:["attendance",{children:["settings",{children:["config",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,12301)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/settings/config/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,84308)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/layout.tsx"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,22758)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,12962)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/settings/config/page.tsx"],u="/(main)/attendance/settings/config/page",p={require:s,loadChunk:()=>Promise.resolve()},y=new r.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/(main)/attendance/settings/config/page",pathname:"/attendance/settings/config",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},7816:(e,t,s)=>{Promise.resolve().then(s.bind(s,91847))},73312:(e,t,s)=>{Promise.resolve().then(s.bind(s,59599))},91847:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>a});var r=s(95344);function a({children:e}){return r.jsx("div",{className:"min-h-screen bg-gray-50 pb-12",children:e})}},59599:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>d});var r=s(95344),a=s(43989),i=s(3729),n=s(18117),o=s(30304),l=s(80508),c=s(31498);function d(){let e=(0,a.p)(),[t,s]=(0,i.useState)(!0),[d,u]=(0,i.useState)({allowedIPs:"",latitude:"",longitude:"",radius:100});(0,i.useEffect)(()=>{p()},[]);let p=async()=>{try{s(!0);let e=(await n.Z.get("/company/profile")).data;u({allowedIPs:e.allowedIPs||"",latitude:e.latitude||"",longitude:e.longitude||"",radius:e.radius||100})}catch(e){console.error("Failed to load settings:",e)}finally{s(!1)}},y=async t=>{t.preventDefault();try{await n.Z.put("/company/profile",{allowedIPs:d.allowedIPs,latitude:parseFloat(d.latitude)||null,longitude:parseFloat(d.longitude)||null,radius:parseInt(d.radius.toString())||100}),e.success("Settings saved successfully")}catch(t){console.error("Failed to save settings:",t),e.error("Failed to save settings")}};return(0,r.jsxs)("div",{className:"p-6 max-w-4xl mx-auto",children:[r.jsx("h2",{className:"text-2xl font-bold text-gray-800 mb-6",children:"Attendance Settings"}),r.jsx("div",{className:"bg-white shadow rounded-lg p-6",children:(0,r.jsxs)("form",{onSubmit:y,className:"space-y-8",children:[(0,r.jsxs)("div",{className:"border-b pb-6",children:[(0,r.jsxs)("div",{className:"flex items-center mb-4",children:[r.jsx(o.Z,{className:"text-primary-600 mr-2",size:24}),r.jsx("h3",{className:"text-lg font-medium text-gray-900",children:"IP Restrictions"})]}),r.jsx("p",{className:"text-sm text-gray-500 mb-4",children:"Restrict check-in/out to specific IP addresses (e.g., Office WiFi). Leave blank to allow all."}),(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Allowed IPs (Comma separated)"}),r.jsx("input",{type:"text",value:d.allowedIPs,onChange:e=>u({...d,allowedIPs:e.target.value}),className:"mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",placeholder:"192.168.1.1, 203.0.113.5"})]})]}),(0,r.jsxs)("div",{children:[(0,r.jsxs)("div",{className:"flex items-center mb-4",children:[r.jsx(l.Z,{className:"text-primary-600 mr-2",size:24}),r.jsx("h3",{className:"text-lg font-medium text-gray-900",children:"Geofencing"})]}),r.jsx("p",{className:"text-sm text-gray-500 mb-4",children:"Restrict check-in/out to a specific geographic location."}),(0,r.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Latitude"}),r.jsx("input",{type:"text",value:d.latitude,onChange:e=>u({...d,latitude:e.target.value}),className:"mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",placeholder:"e.g. 28.6139"})]}),(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Longitude"}),r.jsx("input",{type:"text",value:d.longitude,onChange:e=>u({...d,longitude:e.target.value}),className:"mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",placeholder:"e.g. 77.2090"})]})]}),r.jsx("div",{className:"mt-2",children:r.jsx("button",{type:"button",onClick:()=>{navigator.geolocation&&navigator.geolocation.getCurrentPosition(e=>{u({...d,latitude:e.coords.latitude.toString(),longitude:e.coords.longitude.toString()})},t=>e.info("Location access denied"))},className:"text-sm text-primary-600 hover:text-primary-800 font-medium",children:"Use Current Location"})}),(0,r.jsxs)("div",{className:"mt-4",children:[r.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Allowed Radius (meters)"}),r.jsx("input",{type:"number",value:d.radius,onChange:e=>u({...d,radius:parseInt(e.target.value)}),className:"mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"})]})]}),r.jsx("div",{className:"flex justify-end pt-4",children:(0,r.jsxs)("button",{type:"submit",className:"flex items-center space-x-2 bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 shadow-sm",children:[r.jsx(c.Z,{size:18}),r.jsx("span",{children:"Save Settings"})]})})]})})]})}},43989:(e,t,s)=>{"use strict";s.d(t,{p:()=>a});var r=s(92373);function a(){let{showToast:e}=(0,r.useToastContext)();return{success:t=>e("success",t),error:t=>e("error",t),warning:t=>e("warning",t),info:t=>e("info",t)}}},88534:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Activity",[["path",{d:"M22 12h-4l-3 9L9 3l-3 9H2",key:"d5dnw9"}]])},16469:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Banknote",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"2",key:"9lu3g6"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M6 12h.01M18 12h.01",key:"113zkx"}]])},98026:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Briefcase",[["rect",{width:"20",height:"14",x:"2",y:"7",rx:"2",ry:"2",key:"eto64e"}],["path",{d:"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"zwj3tp"}]])},38330:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("CalendarCheck",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}],["path",{d:"m9 16 2 2 4-4",key:"19s6y9"}]])},45777:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("CircleUser",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}],["path",{d:"M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662",key:"154egf"}]])},1960:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},85674:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]])},83606:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("FileSpreadsheet",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M14 17h2",key:"10kma7"}]])},37121:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]])},30304:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]])},33517:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]])},2273:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]])},56857:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("LineChart",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"m19 9-5 5-4-4-3 3",key:"2osh9i"}]])},48120:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]])},80508:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]])},98200:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]])},21096:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("PieChart",[["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}],["path",{d:"M22 12A10 10 0 0 0 12 2v10z",key:"1rfc4y"}]])},31498:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]])},15786:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},89895:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},22254:(e,t,s)=>{e.exports=s(14767)},84308:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>n});let r=(0,s(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/layout.tsx`),{__esModule:a,$$typeof:i}=r,n=r.default},12301:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>n});let r=(0,s(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/settings/config/page.tsx`),{__esModule:a,$$typeof:i}=r,n=r.default}};var t=require("../../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[6291,1934,783,7316,2841],()=>s(73615));module.exports=r})();