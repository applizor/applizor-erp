(()=>{var e={};e.id=1592,e.ids=[1592],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},85158:e=>{"use strict";e.exports=require("http2")},95687:e=>{"use strict";e.exports=require("https")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},12781:e=>{"use strict";e.exports=require("stream")},76224:e=>{"use strict";e.exports=require("tty")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},1820:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>d,routeModule:()=>y,tree:()=>c});var r=s(50482),a=s(69108),n=s(62563),l=s.n(n),i=s(68300),o={};for(let e in i)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>i[e]);s.d(t,o);let c=["",{children:["(main)",{children:["payroll",{children:["components",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,17506)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/payroll/components/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,22758)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,12962)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/payroll/components/page.tsx"],p="/(main)/payroll/components/page",u={require:s,loadChunk:()=>Promise.resolve()},y=new r.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/(main)/payroll/components/page",pathname:"/payroll/components",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},31:(e,t,s)=>{Promise.resolve().then(s.bind(s,25850))},25850:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>m});var r=s(95344),a=s(43989),n=s(3729),l=s(22254),i=s(51838),o=s(48411),c=s(69224);/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let d=(0,c.Z)("Percent",[["line",{x1:"19",x2:"5",y1:"5",y2:"19",key:"1x9vlm"}],["circle",{cx:"6.5",cy:"6.5",r:"2.5",key:"4mh3h7"}],["circle",{cx:"17.5",cy:"17.5",r:"2.5",key:"1mdrzq"}]]);var p=s(7060);/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let u=(0,c.Z)("Archive",[["rect",{width:"20",height:"5",x:"2",y:"3",rx:"1",key:"1wp1u1"}],["path",{d:"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",key:"1s80jp"}],["path",{d:"M10 12h4",key:"a56b0p"}]]);var y=s(26075),x=s(38271),h=s(53689);function m(){let e=(0,a.p)();(0,l.useRouter)();let[t,s]=(0,n.useState)([]),[c,m]=(0,n.useState)(!0),[g,f]=(0,n.useState)(!1),[b,k]=(0,n.useState)(null),[v,j]=(0,n.useState)({name:"",type:"earning",calculationType:"flat",defaultValue:0,isActive:!0});(0,n.useEffect)(()=>{Z()},[]);let Z=async()=>{try{let e=await h.v.getComponents();s(e)}catch(e){console.error("Failed to fetch components",e)}finally{m(!1)}},w=e=>{e?(k(e),j(e)):(k(null),j({name:"",type:"earning",calculationType:"flat",defaultValue:0,isActive:!0})),f(!0)},N=async t=>{t.preventDefault();try{b?await h.v.updateComponent(b.id,v):await h.v.createComponent(v),f(!1),Z()}catch(t){console.error("Failed to save component",t),e.error("Failed to save component")}},C=async t=>{if(confirm("Are you sure you want to delete this component?"))try{await h.v.deleteComponent(t),Z()}catch(t){e.error(t.response?.data?.error||"Failed to delete component")}};return c?r.jsx("div",{className:"p-8 text-center",children:"Loading Payroll Settings..."}):(0,r.jsxs)("div",{className:"p-6",children:[(0,r.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h1",{className:"text-2xl font-bold text-gray-800",children:"Salary Components"}),r.jsx("p",{className:"text-gray-500",children:"Define global earnings and deductions structure"})]}),(0,r.jsxs)("button",{onClick:()=>w(),className:"flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors",children:[r.jsx(i.Z,{size:20}),"Add Component"]})]}),r.jsx("div",{className:"bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",children:(0,r.jsxs)("table",{className:"w-full text-left border-collapse",children:[r.jsx("thead",{children:(0,r.jsxs)("tr",{className:"bg-gray-50 border-b border-gray-200",children:[r.jsx("th",{className:"p-4 font-semibold text-gray-600",children:"Name"}),r.jsx("th",{className:"p-4 font-semibold text-gray-600",children:"Type"}),r.jsx("th",{className:"p-4 font-semibold text-gray-600",children:"Calculation"}),r.jsx("th",{className:"p-4 font-semibold text-gray-600",children:"Default Value"}),r.jsx("th",{className:"p-4 font-semibold text-gray-600",children:"Status"}),r.jsx("th",{className:"p-4 font-semibold text-gray-600 text-right",children:"Actions"})]})}),r.jsx("tbody",{children:0===t.length?r.jsx("tr",{children:r.jsx("td",{colSpan:6,className:"p-8 text-center text-gray-400",children:"No salary components defined yet."})}):t.map(e=>(0,r.jsxs)("tr",{className:"border-b border-gray-100 last:border-0 hover:bg-gray-50",children:[r.jsx("td",{className:"p-4 font-medium text-gray-800",children:e.name}),r.jsx("td",{className:"p-4",children:r.jsx("span",{className:`px-2 py-1 rounded-full text-xs font-semibold ${"earning"===e.type?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`,children:e.type.toUpperCase()})}),(0,r.jsxs)("td",{className:"p-4 text-gray-600 flex items-center gap-2",children:["flat"===e.calculationType?r.jsx(o.Z,{size:16}):r.jsx(d,{size:16}),"flat"===e.calculationType?"Flat Amount":"% of Basic"]}),(0,r.jsxs)("td",{className:"p-4 text-gray-800 font-mono",children:[e.defaultValue,"percentage_basic"===e.calculationType&&"%"]}),r.jsx("td",{className:"p-4",children:e.isActive?(0,r.jsxs)("span",{className:"flex items-center gap-1 text-green-600 text-sm",children:[r.jsx(p.Z,{size:14})," Active"]}):(0,r.jsxs)("span",{className:"flex items-center gap-1 text-gray-400 text-sm",children:[r.jsx(u,{size:14})," Inactive"]})}),r.jsx("td",{className:"p-4 text-right",children:(0,r.jsxs)("div",{className:"flex items-center justify-end gap-2",children:[r.jsx("button",{onClick:()=>w(e),className:"p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors",children:r.jsx(y.Z,{size:18})}),r.jsx("button",{onClick:()=>C(e.id),className:"p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors",children:r.jsx(x.Z,{size:18})})]})})]},e.id))})]})}),g&&r.jsx("div",{className:"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",children:(0,r.jsxs)("div",{className:"bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-scale-in",children:[r.jsx("h2",{className:"text-xl font-bold mb-4",children:b?"Edit Component":"New Component"}),(0,r.jsxs)("form",{onSubmit:N,className:"space-y-4",children:[(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Component Name"}),r.jsx("input",{type:"text",required:!0,className:"w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",placeholder:"e.g. Basic Salary, HRA",value:v.name,onChange:e=>j({...v,name:e.target.value})})]}),(0,r.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Type"}),(0,r.jsxs)("select",{className:"w-full p-2 border border-gray-300 rounded-lg outline-none",value:v.type,onChange:e=>j({...v,type:e.target.value}),children:[r.jsx("option",{value:"earning",children:"Earning (+)"}),r.jsx("option",{value:"deduction",children:"Deduction (-)"})]})]}),(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Calculation"}),(0,r.jsxs)("select",{className:"w-full p-2 border border-gray-300 rounded-lg outline-none",value:v.calculationType,onChange:e=>j({...v,calculationType:e.target.value}),children:[r.jsx("option",{value:"flat",children:"Flat Amount"}),r.jsx("option",{value:"percentage_basic",children:"% of Basic"})]})]})]}),(0,r.jsxs)("div",{children:[r.jsx("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"percentage_basic"===v.calculationType?"Default Percentage (%)":"Default Amount"}),r.jsx("input",{type:"number",min:"0",step:"0.01",required:!0,className:"w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none",value:v.defaultValue,onChange:e=>j({...v,defaultValue:parseFloat(e.target.value)})})]}),(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[r.jsx("input",{type:"checkbox",id:"isActive",checked:v.isActive,onChange:e=>j({...v,isActive:e.target.checked}),className:"w-4 h-4 text-blue-600 rounded focus:ring-blue-500"}),r.jsx("label",{htmlFor:"isActive",className:"text-sm text-gray-700",children:"Active"})]}),(0,r.jsxs)("div",{className:"flex justify-end gap-3 mt-6",children:[r.jsx("button",{type:"button",onClick:()=>f(!1),className:"px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg",children:"Cancel"}),r.jsx("button",{type:"submit",className:"px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700",children:"Save Component"})]})]})]})})]})}},43989:(e,t,s)=>{"use strict";s.d(t,{p:()=>a});var r=s(92373);function a(){let{showToast:e}=(0,r.useToastContext)();return{success:t=>e("success",t),error:t=>e("error",t),warning:t=>e("warning",t),info:t=>e("info",t)}}},53689:(e,t,s)=>{"use strict";s.d(t,{v:()=>a});var r=s(18117);let a={getComponents:async()=>(await r.Z.get("/payroll/components")).data,createComponent:async e=>(await r.Z.post("/payroll/components",e)).data,updateComponent:async(e,t)=>(await r.Z.put(`/payroll/components/${e}`,t)).data,deleteComponent:async e=>(await r.Z.delete(`/payroll/components/${e}`)).data,getEmployeeStructure:async e=>(await r.Z.get(`/payroll/structure/${e}`)).data,updateEmployeeStructure:async(e,t)=>(await r.Z.put(`/payroll/structure/${e}`,t)).data,process:async e=>(await r.Z.post("/payroll/process",e)).data}},88534:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
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
 */let r=(0,s(69224).Z)("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]])},48411:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]])},83606:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
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
 */let r=(0,s(69224).Z)("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]])},26075:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Pen",[["path",{d:"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",key:"5qss01"}]])},21096:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("PieChart",[["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}],["path",{d:"M22 12A10 10 0 0 0 12 2v10z",key:"1rfc4y"}]])},51838:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]])},15786:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},38271:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]])},89895:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},22254:(e,t,s)=>{e.exports=s(14767)},17506:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>n,__esModule:()=>a,default:()=>l});let r=(0,s(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/payroll/components/page.tsx`),{__esModule:a,$$typeof:n}=r,l=r.default}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[6291,1934,783,7316,2841],()=>s(1820));module.exports=r})();