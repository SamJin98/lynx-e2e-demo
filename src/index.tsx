import { root, useState } from '@lynx-js/react';
import './style.css';
function App(){
 const [level,setLevel]=useState(0);
 const [selected,setSelected]=useState('None');
 return <view className="page">
  <text className="title">Lynx scroll and menu</text>
  <text>Runtime: ReactLynx / Lynx for Web</text>
  <view className="menu">
   <view accessibility-element={true} accessibility-trait="button" accessibility-label="Account" bindtap={()=>setLevel(1)}><text>Account</text></view>
   {level>=1&&<view accessibility-element={true} accessibility-trait="button" accessibility-label="Settings" bindtap={()=>setLevel(2)}><text>Settings</text></view>}
   {level>=2&&<view accessibility-element={true} accessibility-trait="button" accessibility-label="Notifications" bindtap={()=>{setLevel(3);setSelected('Notifications')}}><text>Notifications</text></view>}
  </view>
  <text id="selected">Selected: {selected}</text>
  <text>Scroll inside the list to Item 60</text>
  <scroll-view id="items" className="items" scroll-y>
   {Array.from({length:80},(_,i)=><view key={i} className="row" accessibility-element={true} accessibility-trait="button" accessibility-label={`Item ${i+1}`} bindtap={()=>setSelected(`Item ${i+1}`)}><text>Item {i+1}</text></view>)}
  </scroll-view>
 </view>
}
root.render(<App/>);
