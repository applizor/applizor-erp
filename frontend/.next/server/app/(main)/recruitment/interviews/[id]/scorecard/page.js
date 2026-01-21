(()=>{var e={};e.id=586,e.ids=[586],e.modules={47849:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external")},72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},55403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},94749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},39491:e=>{"use strict";e.exports=require("assert")},6113:e=>{"use strict";e.exports=require("crypto")},82361:e=>{"use strict";e.exports=require("events")},57147:e=>{"use strict";e.exports=require("fs")},13685:e=>{"use strict";e.exports=require("http")},85158:e=>{"use strict";e.exports=require("http2")},95687:e=>{"use strict";e.exports=require("https")},22037:e=>{"use strict";e.exports=require("os")},71017:e=>{"use strict";e.exports=require("path")},12781:e=>{"use strict";e.exports=require("stream")},76224:e=>{"use strict";e.exports=require("tty")},57310:e=>{"use strict";e.exports=require("url")},73837:e=>{"use strict";e.exports=require("util")},59796:e=>{"use strict";e.exports=require("zlib")},54960:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>p,originalPathname:()=>u,pages:()=>d,routeModule:()=>m,tree:()=>l});var s=r(50482),a=r(69108),i=r(62563),n=r.n(i),o=r(68300),c={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(c[e]=()=>o[e]);r.d(t,c);let l=["",{children:["(main)",{children:["recruitment",{children:["interviews",{children:["[id]",{children:["scorecard",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,15328)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/recruitment/interviews/[id]/scorecard/page.tsx"]}]},{}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,37432)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/recruitment/layout.tsx"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,22758)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,69361,23)),"next/dist/client/components/not-found-error"]}]},{layout:[()=>Promise.resolve().then(r.bind(r,12962)),"/Users/arun/Documents/applizor-softech-erp/frontend/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,69361,23)),"next/dist/client/components/not-found-error"]}],d=["/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/recruitment/interviews/[id]/scorecard/page.tsx"],u="/(main)/recruitment/interviews/[id]/scorecard/page",p={require:r,loadChunk:()=>Promise.resolve()},m=new s.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/(main)/recruitment/interviews/[id]/scorecard/page",pathname:"/recruitment/interviews/[id]/scorecard",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},91591:(e,t,r)=>{Promise.resolve().then(r.bind(r,2089))},62989:(e,t,r)=>{Promise.resolve().then(r.bind(r,53949))},2089:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>c});var s=r(95344),a=r(43989),i=r(3729),n=r(18117),o=r(22254);function c({params:e}){let t=(0,a.p)(),r=(0,o.useRouter)(),[c,l]=(0,i.useState)(!0),[d,u]=(0,i.useState)({technical:0,communication:0,problemSolving:0,cultureFit:0,comments:""}),p=({label:e,value:t,onChange:r})=>(0,s.jsxs)("div",{className:"mb-4",children:[(0,s.jsxs)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:[e," (1-10)"]}),s.jsx("div",{className:"flex space-x-2",children:[1,2,3,4,5,6,7,8,9,10].map(e=>s.jsx("button",{type:"button",onClick:()=>r(e),className:`w-8 h-8 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${t>=e?"bg-primary-600 text-white":"bg-gray-100 text-gray-600 hover:bg-gray-200"}`,children:e},e))})]});(0,i.useEffect)(()=>{m()},[]);let m=async()=>{try{l(!0);let t=await n.Z.get(`/recruitment/interviews/${e.id}/scorecard`);t.data&&u({technical:t.data.technical,communication:t.data.communication,problemSolving:t.data.problemSolving,cultureFit:t.data.cultureFit,comments:t.data.comments||""})}catch(e){console.error("Failed to load scorecard:",e)}finally{l(!1)}},h=async s=>{s.preventDefault();try{let t=(d.technical+d.communication+d.problemSolving+d.cultureFit)/4;await n.Z.put(`/recruitment/interviews/${e.id}/feedback`,{scorecard:d,rating:Math.round(10*t)/10,feedback:d.comments,status:"completed"}),r.push("/recruitment/interviews")}catch(e){t.error("Failed to submit scorecard")}};return c?s.jsx("div",{className:"p-8",children:"Loading..."}):(0,s.jsxs)("div",{className:"max-w-2xl mx-auto py-8 px-4",children:[s.jsx("h1",{className:"text-2xl font-bold mb-6",children:"Interview Scorecard"}),(0,s.jsxs)("form",{onSubmit:h,className:"bg-white shadow rounded-lg p-6 space-y-6",children:[s.jsx(p,{label:"Technical Skills",value:d.technical,onChange:e=>u({...d,technical:e})}),s.jsx(p,{label:"Communication",value:d.communication,onChange:e=>u({...d,communication:e})}),s.jsx(p,{label:"Problem Solving",value:d.problemSolving,onChange:e=>u({...d,problemSolving:e})}),s.jsx(p,{label:"Culture Fit",value:d.cultureFit,onChange:e=>u({...d,cultureFit:e})}),(0,s.jsxs)("div",{children:[s.jsx("label",{className:"block text-sm font-medium text-gray-700",children:"Detailed Comments"}),s.jsx("textarea",{rows:4,value:d.comments,onChange:e=>u({...d,comments:e.target.value}),className:"mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500",placeholder:"Key strengths, weaknesses, recommendation..."})]}),(0,s.jsxs)("div",{className:"pt-4 flex justify-end space-x-3",children:[s.jsx("button",{type:"button",onClick:()=>r.back(),className:"bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50",children:"Cancel"}),s.jsx("button",{type:"submit",className:"bg-primary-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-700",children:"Submit Scorecard"})]})]})]})}},53949:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>o});var s=r(95344),a=r(20783),i=r.n(a),n=r(22254);function o({children:e}){let t=(0,n.usePathname)();return(0,s.jsxs)("div",{className:"min-h-screen bg-gray-50",children:[s.jsx("div",{className:"bg-white shadow",children:(0,s.jsxs)("div",{className:"px-4 sm:px-6 lg:px-8",children:[s.jsx("div",{className:"py-4",children:s.jsx("h1",{className:"text-2xl font-bold text-gray-900",children:"Recruitment & ATS"})}),s.jsx("div",{className:"border-b border-gray-200",children:s.jsx("nav",{className:"-mb-px flex space-x-8","aria-label":"Tabs",children:[{name:"Job Openings",href:"/recruitment/jobs"},{name:"Candidates",href:"/recruitment/candidates"}].map(e=>{let r=t===e.href||t?.startsWith(e.href+"/");return s.jsx(i(),{href:e.href,className:`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${r?"border-primary-500 text-primary-600":"border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}
                    `,children:e.name},e.name)})})})]})}),s.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",children:e})]})}},43989:(e,t,r)=>{"use strict";r.d(t,{p:()=>a});var s=r(92373);function a(){let{showToast:e}=(0,s.useToastContext)();return{success:t=>e("success",t),error:t=>e("error",t),warning:t=>e("warning",t),info:t=>e("info",t)}}},88534:(e,t,r)=>{"use strict";r.d(t,{Z:()=>s});/**
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
 */let s=(0,r(69224).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},22254:(e,t,r)=>{e.exports=r(14767)},15328:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>n});let s=(0,r(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/recruitment/interviews/[id]/scorecard/page.tsx`),{__esModule:a,$$typeof:i}=s,n=s.default},37432:(e,t,r)=>{"use strict";r.r(t),r.d(t,{$$typeof:()=>i,__esModule:()=>a,default:()=>n});let s=(0,r(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/recruitment/layout.tsx`),{__esModule:a,$$typeof:i}=s,n=s.default}};var t=require("../../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[6291,1934,783,7316,2841],()=>r(54960));module.exports=s})();