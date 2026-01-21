(()=>{var e={};e.id=9989,e.ids=[9989],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},85158:e=>{"use strict";e.exports=require("http2")},95687:e=>{"use strict";e.exports=require("https")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},12781:e=>{"use strict";e.exports=require("stream")},76224:e=>{"use strict";e.exports=require("tty")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},25429:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>u,originalPathname:()=>y,pages:()=>o,routeModule:()=>x,tree:()=>c});var s=r(50482),a=r(69108),i=r(62563),n=r.n(i),l=r(68300),d={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>l[e]);r.d(t,d);let c=["",{children:["(main)",{children:["attendance",{children:["settings",{children:["holidays",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,66697)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/settings/holidays/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,84308)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,22758)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,69361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,12962)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,69361,23)),"next/dist/client/components/not-found-error"]}],o=["/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/settings/holidays/page.tsx"],y="/(main)/attendance/settings/holidays/page",u={require:r,loadChunk:()=>Promise.resolve()},x=new s.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/(main)/attendance/settings/holidays/page",pathname:"/attendance/settings/holidays",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},7816:(e,t,r)=>{Promise.resolve().then(r.bind(r,91847))},12232:(e,t,r)=>{Promise.resolve().then(r.bind(r,21256))},91847:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>a});var s=r(95344);function a({children:e}){return s.jsx("div",{className:"min-h-screen bg-gray-50 pb-12",children:e})}},21256:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>o});var s=r(95344),a=r(3729),i=r(18117),n=r(51838),l=r(55794),d=r(26075),c=r(38271);function o(){let[e,t]=(0,a.useState)([]),[r,o]=(0,a.useState)(!0),[y,u]=(0,a.useState)(!1),[x,h]=(0,a.useState)(null),[p,m]=(0,a.useState)({name:"",date:new Date().toISOString().split("T")[0],isRecurring:!1}),g=new Date().getFullYear();(0,a.useEffect)(()=>{k()},[]);let k=async()=>{try{o(!0);let e=await i.Z.get(`/attendance/holidays?year=${g}`);t(e.data)}catch(e){console.error("Failed to load holidays:",e)}finally{o(!1)}},f=async e=>{e.preventDefault();try{x?await i.Z.put(`/attendance/holidays/${x.id}`,p):await i.Z.post("/attendance/holidays",p),u(!1),h(null),m({name:"",date:"",isRecurring:!1}),k()}catch(e){console.error("Failed to save holiday:",e)}};return(0,s.jsxs)("div",{className:"p-6 max-w-4xl mx-auto",children:[(0,s.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[(0,s.jsxs)("div",{children:[(0,s.jsxs)("h2",{className:"text-2xl font-bold text-gray-800",children:["Holiday Calendar ",g]}),s.jsx("p",{className:"text-sm text-gray-500",children:"Manage public and company holidays"})]}),(0,s.jsxs)("button",{onClick:()=>{h(null),m({name:"",date:"",isRecurring:!1}),u(!0)},className:"flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700",children:[s.jsx(n.Z,{size:18}),s.jsx("span",{children:"Add Holiday"})]})]}),s.jsx("div",{className:"bg-white shadow overflow-hidden sm:rounded-md",children:s.jsx("ul",{className:"divide-y divide-gray-200",children:0===e.length?s.jsx("li",{className:"px-6 py-8 text-center text-gray-500",children:"No holidays added for this year."}):e.map(e=>(0,s.jsxs)("li",{className:"px-6 py-4 hover:bg-gray-50 flex justify-between items-center",children:[(0,s.jsxs)("div",{className:"flex items-center",children:[s.jsx("div",{className:"flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600",children:s.jsx(l.Z,{size:20})}),(0,s.jsxs)("div",{className:"ml-4",children:[s.jsx("div",{className:"text-sm font-medium text-gray-900",children:e.name}),(0,s.jsxs)("div",{className:"text-sm text-gray-500",children:[new Date(e.date).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}),e.isRecurring&&s.jsx("span",{className:"ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600",children:"Recurring"})]})]})]}),(0,s.jsxs)("div",{className:"flex items-center space-x-3",children:[s.jsx("button",{onClick:()=>{h(e),m({name:e.name,date:new Date(e.date).toISOString().split("T")[0],isRecurring:e.isRecurring}),u(!0)},className:"text-gray-400 hover:text-blue-600",children:s.jsx(d.Z,{size:18})}),s.jsx("button",{onClick:async()=>{confirm("Delete holiday?")&&(await i.Z.delete(`/attendance/holidays/${e.id}`),k())},className:"text-gray-400 hover:text-red-600",children:s.jsx(c.Z,{size:18})})]})]},e.id))})}),y&&s.jsx("div",{className:"fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50",children:(0,s.jsxs)("div",{className:"bg-white rounded-lg shadow-xl max-w-md w-full p-6",children:[s.jsx("h3",{className:"text-lg font-bold mb-4",children:x?"Edit Holiday":"Add New Holiday"}),(0,s.jsxs)("form",{onSubmit:f,className:"space-y-4",children:[(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Name"}),s.jsx("input",{type:"text",required:!0,value:p.name,onChange:e=>m({...p,name:e.target.value}),className:"mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"})]}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Date"}),s.jsx("input",{type:"date",required:!0,value:p.date,onChange:e=>m({...p,date:e.target.value}),className:"mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"})]}),(0,s.jsxs)("div",{className:"flex items-center",children:[s.jsx("input",{type:"checkbox",id:"recurring",checked:p.isRecurring,onChange:e=>m({...p,isRecurring:e.target.checked}),className:"h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"}),s.jsx("label",{htmlFor:"recurring",className:"ml-2 block text-sm text-gray-900",children:"Repeat Yearly?"})]}),(0,s.jsxs)("div",{className:"flex justify-end space-x-3 pt-4 border-t",children:[s.jsx("button",{type:"button",onClick:()=>u(!1),className:"px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50",children:"Cancel"}),s.jsx("button",{type:"submit",className:"px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700",children:"Save"})]})]})]})})]})}},88534:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Activity",[["path",{d:"M22 12h-4l-3 9L9 3l-3 9H2",key:"d5dnw9"}]])},16469:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Banknote",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"2",key:"9lu3g6"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M6 12h.01M18 12h.01",key:"113zkx"}]])},98026:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Briefcase",[["rect",{width:"20",height:"14",x:"2",y:"7",rx:"2",ry:"2",key:"eto64e"}],["path",{d:"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"zwj3tp"}]])},38330:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("CalendarCheck",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}],["path",{d:"m9 16 2 2 4-4",key:"19s6y9"}]])},55794:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Calendar",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}]])},45777:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("CircleUser",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}],["path",{d:"M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662",key:"154egf"}]])},1960:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},85674:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]])},83606:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("FileSpreadsheet",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M14 17h2",key:"10kma7"}]])},37121:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]])},33517:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]])},2273:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]])},56857:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("LineChart",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"m19 9-5 5-4-4-3 3",key:"2osh9i"}]])},48120:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]])},98200:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]])},26075:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Pen",[["path",{d:"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",key:"5qss01"}]])},21096:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("PieChart",[["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}],["path",{d:"M22 12A10 10 0 0 0 12 2v10z",key:"1rfc4y"}]])},51838:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]])},15786:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},38271:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]])},89895:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},22254:(e,t,r)=>{e.exports=r(14767)},84308:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>n});let s=(0,r(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/layout.tsx`),{__esModule:a,$$typeof:i}=s,n=s.default},66697:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>n});let s=(0,r(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/settings/holidays/page.tsx`),{__esModule:a,$$typeof:i}=s,n=s.default}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[6291,1934,783,7316,2841],()=>r(25429));module.exports=s})();