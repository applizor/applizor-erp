(()=>{var e={};e.id=4123,e.ids=[4123],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},85158:e=>{"use strict";e.exports=require("http2")},95687:e=>{"use strict";e.exports=require("https")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},12781:e=>{"use strict";e.exports=require("stream")},76224:e=>{"use strict";e.exports=require("tty")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},63985:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>x,pages:()=>l,routeModule:()=>y,tree:()=>o});var r=s(50482),i=s(69108),a=s(62563),n=s.n(a),c=s(68300),d={};for(let e in c)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>c[e]);s.d(t,d);let o=["",{children:["(main)",{children:["invoices",{children:["[id]",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,46398)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/invoices/[id]/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,22758)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,12962)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}],l=["/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/invoices/[id]/page.tsx"],x="/(main)/invoices/[id]/page",p={require:s,loadChunk:()=>Promise.resolve()},y=new r.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/(main)/invoices/[id]/page",pathname:"/invoices/[id]",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:o}})},11542:(e,t,s)=>{Promise.resolve().then(s.bind(s,60339))},60339:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>d});var r=s(95344),i=s(43989),a=s(3729),n=s(22254),c=s(25045);function d({params:e}){let t=(0,i.p)();(0,n.useRouter)();let[s,d]=(0,a.useState)(null),[o,l]=(0,a.useState)(!0),[x,p]=(0,a.useState)(!1);(0,a.useEffect)(()=>{y()},[e.id]);let y=async()=>{try{let t=await c.i.getById(e.id);d(t)}catch(e){console.error("Failed to load invoice")}finally{l(!1)}},u=async()=>{if(confirm("Send this document to the client via email?")){p(!0);try{await c.i.sendEmail(e.id),t.success("Email sent successfully!"),y()}catch(e){t.error("Failed to send email")}finally{p(!1)}}},h=async()=>{if(confirm("Convert this quotation to an invoice?"))try{await c.i.updateStatus(e.id,"draft"),t.success("Converted successfully (Status updated)"),y()}catch(e){t.error("Failed to convert")}};return o?r.jsx("div",{children:"Loading..."}):s?r.jsx("div",{className:"max-w-4xl mx-auto py-8 px-4",children:r.jsx("div",{className:"max-w-5xl mx-auto px-4 py-8",children:(0,r.jsxs)("div",{className:"bg-white shadow rounded-lg overflow-hidden",children:[(0,r.jsxs)("div",{className:"bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center",children:[(0,r.jsxs)("div",{children:[(0,r.jsxs)("h1",{className:"text-2xl font-bold text-gray-900",children:["quotation"===s.type?"Quotation":"Invoice"," #",s.invoiceNumber]}),r.jsx("p",{className:"text-sm text-gray-500",children:new Date(s.invoiceDate).toLocaleDateString()})]}),(0,r.jsxs)("div",{className:"space-x-3",children:[r.jsx("button",{onClick:()=>{if(!s||!s.client.phone){t.info("Client phone number is missing.");return}let e=`Hello ${s.client.name}, here is your ${s.type} #${s.invoiceNumber} for ${s.currency} ${s.total}. Please review it.`,r=`https://wa.me/${s.client.phone}?text=${encodeURIComponent(e)}`;window.open(r,"_blank")},className:"inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",children:"WhatsApp"}),r.jsx("button",{onClick:u,disabled:x,className:"inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50",children:x?"Sending...":"Send Email"}),"quotation"===s.type&&r.jsx("button",{onClick:h,className:"inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700",children:"Convert to Invoice"})]})]}),(0,r.jsxs)("div",{className:"p-6",children:[(0,r.jsxs)("div",{className:"grid grid-cols-2 gap-6 mb-8",children:[(0,r.jsxs)("div",{children:[r.jsx("h3",{className:"text-gray-500 text-xs uppercase font-wide",children:"Bill To"}),r.jsx("p",{className:"font-bold text-lg",children:s.client.name}),r.jsx("p",{className:"text-gray-600",children:s.client.email}),r.jsx("p",{className:"text-gray-600",children:s.client.phone})]}),(0,r.jsxs)("div",{className:"text-right",children:[r.jsx("h3",{className:"text-gray-500 text-xs uppercase font-wide",children:"Status"}),r.jsx("span",{className:`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${"paid"===s.status?"bg-green-100 text-green-800":"sent"===s.status?"bg-blue-100 text-blue-800":"bg-gray-100 text-gray-800"}`,children:s.status}),(0,r.jsxs)("div",{className:"mt-2",children:[r.jsx("span",{className:"text-gray-500 text-sm",children:"Amount Due:"}),(0,r.jsxs)("span",{className:"text-2xl font-bold ml-2",children:[s.currency," ",s.total]})]})]})]}),(0,r.jsxs)("table",{className:"min-w-full divide-y divide-gray-200 mb-8",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{children:[r.jsx("th",{className:"px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Item"}),r.jsx("th",{className:"px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Qty"}),r.jsx("th",{className:"px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Rate"}),r.jsx("th",{className:"px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider",children:"Amount"})]})}),r.jsx("tbody",{className:"bg-white divide-y divide-gray-200",children:s.items.map(e=>(0,r.jsxs)("tr",{children:[r.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900",children:e.description}),r.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right",children:e.quantity}),r.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right",children:e.rate}),r.jsx("td",{className:"px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right",children:e.amount})]},e.id))})]})]})]})})}):r.jsx("div",{children:"Document not found"})}},43989:(e,t,s)=>{"use strict";s.d(t,{p:()=>i});var r=s(92373);function i(){let{showToast:e}=(0,r.useToastContext)();return{success:t=>e("success",t),error:t=>e("error",t),warning:t=>e("warning",t),info:t=>e("info",t)}}},25045:(e,t,s)=>{"use strict";s.d(t,{i:()=>i});var r=s(18117);let i={getAll:async e=>(await r.Z.get("/invoices",{params:e})).data,getById:async e=>(await r.Z.get(`/invoices/${e}`)).data,create:async e=>(await r.Z.post("/invoices",e)).data,generatePDF:async(e,t)=>(await r.Z.get(`/invoices/${e}/pdf`,{params:{letterheadMode:t},responseType:"blob"})).data,updateStatus:async(e,t)=>(await r.Z.patch(`/invoices/${e}/status`,{status:t})).data,sendEmail:async e=>(await r.Z.post(`/invoices/${e}/send`)).data}},88534:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
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
 */let r=(0,s(69224).Z)("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]])},33517:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
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
 */let r=(0,s(69224).Z)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]])},98200:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]])},21096:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("PieChart",[["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}],["path",{d:"M22 12A10 10 0 0 0 12 2v10z",key:"1rfc4y"}]])},15786:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},89895:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},22254:(e,t,s)=>{e.exports=s(14767)},46398:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>a,__esModule:()=>i,default:()=>n});let r=(0,s(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/invoices/[id]/page.tsx`),{__esModule:i,$$typeof:a}=r,n=r.default}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[6291,1934,783,7316,2841],()=>s(63985));module.exports=r})();