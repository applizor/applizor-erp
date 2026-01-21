(()=>{var e={};e.id=1234,e.ids=[1234],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},85158:e=>{"use strict";e.exports=require("http2")},95687:e=>{"use strict";e.exports=require("https")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},12781:e=>{"use strict";e.exports=require("stream")},76224:e=>{"use strict";e.exports=require("tty")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},27066:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>l.a,__next_app__:()=>x,originalPathname:()=>p,pages:()=>c,routeModule:()=>u,tree:()=>o});var s=r(50482),a=r(69108),i=r(62563),l=r.n(i),n=r(68300),d={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>n[e]);r.d(t,d);let o=["",{children:["(main)",{children:["documents",{children:["templates",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,4678)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/documents/templates/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,22758)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,69361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,12962)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,69361,23)),"next/dist/client/components/not-found-error"]}],c=["/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/documents/templates/page.tsx"],p="/(main)/documents/templates/page",x={require:r,loadChunk:()=>Promise.resolve()},u=new s.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/(main)/documents/templates/page",pathname:"/documents/templates",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:o}})},58612:(e,t,r)=>{Promise.resolve().then(r.bind(r,83390))},83390:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>d});var s=r(95344),a=r(43989),i=r(3729),l=r(18117);let n={getAll:async()=>(await l.Z.get("/document-templates")).data,upload:async e=>(await l.Z.post("/document-templates",e,{headers:{"Content-Type":"multipart/form-data"}})).data,delete:async e=>(await l.Z.delete(`/document-templates/${e}`)).data};function d(){let e=(0,a.p)(),[t,r]=(0,i.useState)([]),[l,d]=(0,i.useState)(!0),[o,c]=(0,i.useState)(!1),[p,x]=(0,i.useState)(!1),[u,y]=(0,i.useState)(""),[m,h]=(0,i.useState)("OfferLetter"),[g,f]=(0,i.useState)("NONE"),[k,b]=(0,i.useState)(null);(0,i.useEffect)(()=>{v()},[]);let v=async()=>{try{d(!0);let e=await n.getAll();r(e)}catch(e){console.error("Failed to load templates",e)}finally{d(!1)}},w=async t=>{if(t.preventDefault(),!k)return e.warning("Please select a file");try{c(!0);let e=new FormData;e.append("name",u),e.append("type",m),e.append("letterheadMode",g),e.append("file",k),await n.upload(e),y(""),b(null),x(!1),v()}catch(t){e.error(t.response?.data?.error||"Failed to upload template")}finally{c(!1)}},j=async t=>{if(confirm("Delete this template?"))try{await n.delete(t),v()}catch(t){e.error("Failed to delete")}};return(0,s.jsxs)("div",{className:"max-w-6xl mx-auto px-4 py-8",children:[(0,s.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[s.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:"Document Templates"}),s.jsx("button",{onClick:()=>x(!p),className:"bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700",children:p?"Cancel":"+ Add Template"})]}),p&&(0,s.jsxs)("div",{className:"bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200",children:[s.jsx("h2",{className:"text-lg font-medium mb-4",children:"Upload New Template"}),(0,s.jsxs)("form",{onSubmit:w,className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:[(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Template Name"}),s.jsx("input",{type:"text",required:!0,value:u,onChange:e=>y(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md",placeholder:"e.g. Standard Offer Letter 2024"})]}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Type"}),(0,s.jsxs)("select",{value:m,onChange:e=>h(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md",children:[s.jsx("option",{value:"OfferLetter",children:"Offer Letter"}),s.jsx("option",{value:"Payslip",children:"Payslip"}),s.jsx("option",{value:"Contract",children:"Contract"}),s.jsx("option",{value:"Invoice",children:"Invoice"})]})]}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Letterhead Overlay"}),(0,s.jsxs)("select",{value:g,onChange:e=>f(e.target.value),className:"mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md",children:[s.jsx("option",{value:"NONE",children:"None (Use Template Design)"}),s.jsx("option",{value:"FIRST_PAGE",children:"First Page Only"}),s.jsx("option",{value:"ALL_PAGES",children:"All Pages"})]}),s.jsx("p",{className:"text-xs text-gray-500 mt-1",children:"Requires Company Letterhead PDF to be configured in Settings."})]}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"DOCX File"}),s.jsx("input",{type:"file",accept:".docx",required:!0,onChange:e=>b(e.target.files?.[0]||null),className:"mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"})]}),s.jsx("div",{className:"md:col-span-2 flex justify-end",children:s.jsx("button",{type:"submit",disabled:o,className:"bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50",children:o?"Uploading...":"Save Template"})})]})]}),l?s.jsx("div",{className:"text-center py-8",children:"Loading..."}):0===t.length?s.jsx("div",{className:"text-center py-12 bg-white rounded-lg border border-dashed border-gray-300 text-gray-500",children:"No templates found. Upload your first DOCX template."}):s.jsx("div",{className:"bg-white shadow overflow-hidden sm:rounded-md border border-gray-200",children:(0,s.jsxs)("table",{className:"min-w-full divide-y divide-gray-200",children:[s.jsx("thead",{className:"bg-gray-50",children:(0,s.jsxs)("tr",{children:[s.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Name"}),s.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Type"}),s.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Mode"}),s.jsx("th",{className:"px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Created"}),s.jsx("th",{className:"px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Actions"})]})}),s.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:t.map(e=>(0,s.jsxs)("tr",{children:[s.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900",children:e.name}),s.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:e.type}),s.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:e.letterheadMode}),s.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500",children:new Date(e.createdAt).toLocaleDateString()}),s.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-right text-sm font-medium",children:s.jsx("button",{onClick:()=>j(e.id),className:"text-red-600 hover:text-red-900",children:"Delete"})})]},e.id))})]})})]})}},43989:(e,t,r)=>{"use strict";r.d(t,{p:()=>a});var s=r(92373);function a(){let{showToast:e}=(0,s.useToastContext)();return{success:t=>e("success",t),error:t=>e("error",t),warning:t=>e("warning",t),info:t=>e("info",t)}}},88534:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
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
 */let s=(0,r(69224).Z)("CalendarCheck",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}],["path",{d:"m9 16 2 2 4-4",key:"19s6y9"}]])},45777:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
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
 */let s=(0,r(69224).Z)("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]])},21096:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("PieChart",[["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}],["path",{d:"M22 12A10 10 0 0 0 12 2v10z",key:"1rfc4y"}]])},15786:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},89895:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,r(69224).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},22254:(e,t,r)=>{e.exports=r(14767)},4678:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>l});let s=(0,r(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/documents/templates/page.tsx`),{__esModule:a,$$typeof:i}=s,l=s.default}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[6291,1934,783,7316,2841],()=>r(27066));module.exports=s})();