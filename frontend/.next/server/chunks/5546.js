exports.id=5546,exports.ids=[5546],exports.modules={7816:(e,a,t)=>{Promise.resolve().then(t.bind(t,91847))},91847:(e,a,t)=>{"use strict";t.r(a),t.d(a,{default:()=>l});var s=t(95344);function l({children:e}){return s.jsx("div",{className:"min-h-screen bg-gray-50 pb-12",children:e})}},62427:(e,a,t)=>{"use strict";t.d(a,{k:()=>d});var s=t(95344);t(3729);var l=t(66138);let d=({balances:e,loading:a})=>a?s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6",children:[1,2,3,4].map(e=>(0,s.jsxs)("div",{className:"bg-white p-4 rounded-lg shadow-sm border border-gray-100 animate-pulse",children:[s.jsx("div",{className:"h-4 bg-gray-200 rounded w-24 mb-3"}),(0,s.jsxs)("div",{className:"flex justify-between items-end",children:[s.jsx("div",{className:"h-8 bg-gray-200 rounded w-16"}),s.jsx("div",{className:"h-4 bg-gray-200 rounded w-12"})]})]},e))}):0===e.length?(0,s.jsxs)("div",{className:"bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-center text-blue-800",children:[s.jsx(l.Z,{size:20,className:"mr-2"}),s.jsx("span",{children:"No leave balances found. Please contact HR to initialize your leave quota."})]}):s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6",children:e.map(e=>{let a=e.total??e.leaveType.days,t=e.leaveType?.color||"#3B82F6",l=a>0?(a-e.remaining)/a*100:0;return(0,s.jsxs)("div",{className:"bg-white p-5 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden",children:[s.jsx("div",{className:"absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white via-white to-transparent opacity-50 transform rotate-45 translate-x-8 -translate-y-8 z-0"}),(0,s.jsxs)("div",{className:"relative z-10",children:[s.jsx("h3",{className:"text-gray-500 text-sm font-medium uppercase tracking-wide mb-2",children:e.leaveType?.name||"Unknown Type"}),(0,s.jsxs)("div",{className:"flex items-baseline justify-between mb-1",children:[(0,s.jsxs)("div",{className:"flex items-baseline space-x-1",children:[s.jsx("span",{className:"text-3xl font-bold text-gray-900",children:e.remaining}),(0,s.jsxs)("span",{className:"text-gray-400 text-sm",children:["/ ",a]})]}),e.leaveType?.accrualType!=="yearly"&&e.leaveType?.accrualRate>0&&(0,s.jsxs)("span",{className:"text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-semibold",children:["+",e.leaveType.accrualRate,"/","monthly"===e.leaveType.accrualType?"mo":"day"]})]}),s.jsx("div",{className:"mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden",children:s.jsx("div",{className:"h-full rounded-full transition-all duration-500",style:{width:`${Math.min(l,100)}%`,backgroundColor:t}})}),(0,s.jsxs)("div",{className:"mt-3 flex justify-between text-xs text-gray-500",children:[(0,s.jsxs)("span",{children:["Used: ",s.jsx("b",{children:e.used})]}),(0,s.jsxs)("span",{children:["Pending: ",s.jsx("b",{children:e.pending})]})]})]}),s.jsx("div",{className:"absolute top-0 left-0 w-1 h-full",style:{backgroundColor:t}})]},e.id)})})},1660:(e,a,t)=>{"use strict";t.d(a,{N$:()=>i,NY:()=>r,Nt:()=>n,jU:()=>d,vm:()=>l});var s=t(18117);let l={checkIn:async e=>(await s.Z.post("/attendance-leave/check-in",e)).data,checkOut:async()=>(await s.Z.post("/attendance-leave/check-out")).data,getMyAttendance:async(e,a)=>(await s.Z.get("/attendance-leave/my-attendance",{params:{month:e,year:a}})).data,todayStatus:async()=>(await s.Z.get("/attendance-leave/today-status")).data,getAll:async e=>(await s.Z.get("/attendance-leave/all-attendance",{params:e})).data,getMusterRoll:async(e,a,t)=>(await s.Z.get("/attendance-leave/all-attendance",{params:{month:e,year:a,departmentId:t}})).data},d={getTypes:async()=>(await s.Z.get("/attendance-leave/leave-types")).data,create:async e=>(await s.Z.post("/attendance-leave/leaves",e)).data,uploadAttachment:async e=>(await s.Z.post("/attendance-leave/leaves/upload",e,{headers:{"Content-Type":"multipart/form-data"}})).data,getMyLeaves:async()=>(await s.Z.get("/attendance-leave/my-leaves")).data,getAllLeaves:async e=>(await s.Z.get("/attendance-leave/all-leaves",{params:{status:e}})).data,updateStatus:async(e,a)=>(await s.Z.put(`/attendance-leave/leaves/${e}/status`,{status:a})).data,calculateDays:async e=>(await s.Z.post("/attendance-leave/leaves/calculate",e)).data,getMyBalances:async()=>(await s.Z.get("/attendance-leave/my-balances")).data,getAllBalances:async e=>(await s.Z.get("/attendance-leave/all-balances",{params:e})).data},n={getAll:async e=>(await s.Z.get("/attendance-leave/holidays",{params:{year:e}})).data,create:async e=>(await s.Z.post("/attendance-leave/holidays",e)).data,delete:async e=>(await s.Z.delete(`/attendance-leave/holidays/${e}`)).data},r={getAll:async()=>(await s.Z.get("/attendance-leave/leave-types")).data,create:async e=>(await s.Z.post("/attendance-leave/leave-types",e)).data,update:async(e,a)=>(await s.Z.put(`/attendance-leave/leave-types/${e}`,a)).data,delete:async e=>(await s.Z.delete(`/attendance-leave/leave-types/${e}`)).data},i={getRoster:async(e,a,t)=>(await s.Z.get("/shift-rosters",{params:{startDate:e,endDate:a,departmentId:t}})).data,updateBatch:async e=>(await s.Z.post("/shift-rosters/batch",{assignments:e})).data}},88534:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("Activity",[["path",{d:"M22 12h-4l-3 9L9 3l-3 9H2",key:"d5dnw9"}]])},16469:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("Banknote",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"2",key:"9lu3g6"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M6 12h.01M18 12h.01",key:"113zkx"}]])},98026:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("Briefcase",[["rect",{width:"20",height:"14",x:"2",y:"7",rx:"2",ry:"2",key:"eto64e"}],["path",{d:"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"zwj3tp"}]])},38330:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("CalendarCheck",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}],["path",{d:"m9 16 2 2 4-4",key:"19s6y9"}]])},45777:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("CircleUser",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}],["path",{d:"M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662",key:"154egf"}]])},1960:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]])},85674:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]])},83606:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("FileSpreadsheet",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M14 17h2",key:"10kma7"}]])},37121:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]])},33517:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]])},2273:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]])},56857:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("LineChart",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"m19 9-5 5-4-4-3 3",key:"2osh9i"}]])},48120:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]])},98200:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]])},21096:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("PieChart",[["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}],["path",{d:"M22 12A10 10 0 0 0 12 2v10z",key:"1rfc4y"}]])},15786:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},89895:(e,a,t)=>{"use strict";t.d(a,{Z:()=>s});/**
 * @license lucide-react v0.303.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,t(69224).Z)("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]])},22254:(e,a,t)=>{e.exports=t(14767)},84308:(e,a,t)=>{"use strict";t.r(a),t.d(a,{$$typeof:()=>d,__esModule:()=>l,default:()=>n});let s=(0,t(86843).createProxy)(String.raw`/Users/arun/Documents/applizor-softech-erp/frontend/app/(main)/attendance/layout.tsx`),{__esModule:l,$$typeof:d}=s,n=s.default}};