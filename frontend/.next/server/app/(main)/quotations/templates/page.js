(()=>{var e={};e.id=5178,e.ids=[5178],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},85158:e=>{"use strict";e.exports=require("http2")},95687:e=>{"use strict";e.exports=require("https")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},12781:e=>{"use strict";e.exports=require("stream")},76224:e=>{"use strict";e.exports=require("tty")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},80379:(e,t,s)=>{"use strict";s.r(t),s.d(t,{GlobalError:()=>l.a,__next_app__:()=>u,originalPathname:()=>m,pages:()=>c,routeModule:()=>p,tree:()=>d});var r=s(50482),a=s(69108),i=s(62563),l=s.n(i),n=s(68300),o={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>n[e]);s.d(t,o);let d=["",{children:["(main)",{children:["quotations",{children:["templates",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(s.bind(s,5783)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/quotations/templates/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(s.bind(s,22758)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(s.bind(s,12962)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(s.t.bind(s,69361,23)),"next/dist/client/components/not-found-error"]}],c=["/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/quotations/templates/page.tsx"],m="/(main)/quotations/templates/page",u={require:s,loadChunk:()=>Promise.resolve()},p=new r.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/(main)/quotations/templates/page",pathname:"/quotations/templates",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},41937:(e,t,s)=>{Promise.resolve().then(s.bind(s,58461))},58461:(e,t,s)=>{"use strict";s.r(t),s.d(t,{default:()=>y});var r=s(95344),a=s(3729),i=s(22254),l=s(18117),n=s(43989),o=s(65489),d=s(51838),c=s(28765),m=s(1960),u=s(46064),p=s(38271),x=s(95252);function y(){let e=(0,i.useRouter)(),t=(0,n.p)(),{can:s}=(0,o.g)(),[y,h]=(0,a.useState)([]),[g,f]=(0,a.useState)(!0),[b,k]=(0,a.useState)(""),[v,j]=(0,a.useState)(""),[w,Z]=(0,a.useState)(!1),[N,q]=(0,a.useState)(null);(0,a.useEffect)(()=>{M()},[v]);let M=async()=>{try{f(!0);let e=new URLSearchParams;v&&e.append("category",v),b&&e.append("search",b);let t=await l.Z.get(`/quotation-templates?${e.toString()}`);h(t.data.templates||[])}catch(e){t.error("Failed to load templates")}finally{f(!1)}},C=()=>{M()},z=e=>{q(e),Z(!0)},P=async()=>{if(N)try{await l.Z.delete(`/quotation-templates/${N}`),t.success("Template deleted successfully"),M(),Z(!1),q(null)}catch(e){t.error("Failed to delete template")}},_=async s=>{try{(await l.Z.post(`/quotation-templates/${s}/apply`)).data.template,e.push(`/quotations/create?templateId=${s}`)}catch(e){t.error("Failed to apply template")}},S=Array.from(new Set(y.map(e=>e.category).filter(Boolean)));return g?r.jsx("div",{className:"flex items-center justify-center min-h-screen",children:r.jsx(x.T,{size:"lg"})}):(0,r.jsxs)("div",{className:"max-w-7xl mx-auto px-4 py-8",children:[(0,r.jsxs)("div",{className:"flex justify-between items-center mb-6",children:[(0,r.jsxs)("div",{children:[r.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:"Quotation Templates"}),r.jsx("p",{className:"text-sm text-gray-600 mt-1",children:"Save and reuse quotation templates"})]}),s("Quotation","create")&&(0,r.jsxs)("button",{onClick:()=>e.push("/quotations/create"),className:"px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center",children:[r.jsx(d.Z,{className:"w-4 h-4 mr-2"}),"Create Quotation"]})]}),r.jsx("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6",children:(0,r.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-4",children:[r.jsx("div",{className:"md:col-span-2",children:(0,r.jsxs)("div",{className:"relative",children:[r.jsx(c.Z,{className:"absolute left-3 top-2.5 text-gray-400 w-5 h-5"}),r.jsx("input",{type:"text",placeholder:"Search templates...",value:b,onChange:e=>k(e.target.value),onKeyPress:e=>"Enter"===e.key&&C(),className:"w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"})]})}),r.jsx("div",{children:(0,r.jsxs)("select",{value:v,onChange:e=>j(e.target.value),className:"w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",children:[r.jsx("option",{value:"",children:"All Categories"}),S.map(e=>r.jsx("option",{value:e,children:e},e))]})})]})}),0===y.length?(0,r.jsxs)("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center",children:[r.jsx("div",{className:"text-gray-400 mb-4",children:r.jsx(m.Z,{className:"w-16 h-16 mx-auto"})}),r.jsx("h3",{className:"text-lg font-medium text-gray-900 mb-2",children:"No templates found"}),r.jsx("p",{className:"text-gray-600 mb-4",children:"Create your first quotation template to get started"}),s("Quotation","create")&&r.jsx("button",{onClick:()=>e.push("/quotations/create"),className:"px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700",children:"Create Quotation"})]}):r.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:y.map(e=>r.jsx("div",{className:"bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow",children:(0,r.jsxs)("div",{className:"p-6",children:[e.category&&r.jsx("span",{className:"inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded mb-3",children:e.category}),r.jsx("h3",{className:"text-lg font-semibold text-gray-900 mb-2",children:e.name}),e.description&&r.jsx("p",{className:"text-sm text-gray-600 mb-4 line-clamp-2",children:e.description}),(0,r.jsxs)("div",{className:"flex items-center text-sm text-gray-500 mb-4",children:[r.jsx(u.Z,{className:"w-4 h-4 mr-1"}),"Used ",e.usageCount," times"]}),(0,r.jsxs)("div",{className:"flex items-center space-x-2",children:[r.jsx("button",{onClick:()=>_(e.id),className:"flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium",children:"Use Template"}),s("Quotation","delete")&&r.jsx("button",{onClick:()=>z(e.id),className:"px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50",children:r.jsx(p.Z,{className:"w-4 h-4"})})]})]})},e.id))}),w&&r.jsx("div",{className:"fixed inset-0 z-50 overflow-y-auto","aria-labelledby":"modal-title",role:"dialog","aria-modal":"true",children:(0,r.jsxs)("div",{className:"flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0",children:[r.jsx("div",{className:"fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity","aria-hidden":"true",onClick:()=>Z(!1)}),r.jsx("span",{className:"hidden sm:inline-block sm:align-middle sm:h-screen","aria-hidden":"true",children:"​"}),(0,r.jsxs)("div",{className:"inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full",children:[r.jsx("div",{className:"bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4",children:(0,r.jsxs)("div",{className:"sm:flex sm:items-start",children:[r.jsx("div",{className:"mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10",children:r.jsx(p.Z,{className:"h-6 w-6 text-red-600"})}),(0,r.jsxs)("div",{className:"mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left",children:[r.jsx("h3",{className:"text-lg leading-6 font-medium text-gray-900",id:"modal-title",children:"Delete Template"}),r.jsx("div",{className:"mt-2",children:r.jsx("p",{className:"text-sm text-gray-500",children:"Are you sure you want to delete this template? This action cannot be undone."})})]})]})}),(0,r.jsxs)("div",{className:"bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse",children:[r.jsx("button",{type:"button",onClick:P,className:"w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm",children:"Delete"}),r.jsx("button",{type:"button",onClick:()=>Z(!1),className:"mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm",children:"Cancel"})]})]})]})})]})}},95252:(e,t,s)=>{"use strict";s.d(t,{T:()=>a});var r=s(95344);function a({size:e="md",className:t=""}){return r.jsx("div",{className:`${{sm:"h-4 w-4 border-2",md:"h-8 w-8 border-2",lg:"h-12 w-12 border-3"}[e]} animate-spin rounded-full border-gray-300 border-t-primary-600 ${t}`,role:"status","aria-label":"Loading",children:r.jsx("span",{className:"sr-only",children:"Loading..."})})}},43989:(e,t,s)=>{"use strict";s.d(t,{p:()=>a});var r=s(92373);function a(){let{showToast:e}=(0,r.useToastContext)();return{success:t=>e("success",t),error:t=>e("error",t),warning:t=>e("warning",t),info:t=>e("info",t)}}},88534:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
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
 */let r=(0,s(69224).Z)("PieChart",[["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}],["path",{d:"M22 12A10 10 0 0 0 12 2v10z",key:"1rfc4y"}]])},51838:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]])},28765:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]])},15786:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},38271:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]])},46064:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]])},89895:(e,t,s)=>{"use strict";s.d(t,{Z:()=>r});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,s(69224).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},22254:(e,t,s)=>{e.exports=s(14767)},5783:(e,t,s)=>{"use strict";s.r(t),s.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>l});let r=(0,s(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/quotations/templates/page.tsx`),{__esModule:a,$$typeof:i}=r,l=r.default}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[6291,1934,783,7316,2841],()=>s(80379));module.exports=r})();