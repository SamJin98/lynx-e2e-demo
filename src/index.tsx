import {root, useState} from '@lynx-js/react';
import {useOffset} from './swiper/useOffset';
import {useUpdateSwiperStyle} from './swiper/useUpdateSwiperStyle';
import pic1 from './assets/1.png';
import pic2 from './assets/3.png';
import pic3 from './assets/4.png';
import './style.css';
const pictures = [pic1, pic2, pic3];
const easing = (t: number) => { 'main thread'; return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; };
function App() {
 const [current,setCurrent]=useState(0);
 const [finish,setFinish]=useState('Charcoal');
 const [quantity,setQuantity]=useState(1);
 const [bag,setBag]=useState(0);
 const [added,setAdded]=useState('');
 const [details,setDetails]=useState(false);
 const {containerRef,updateSwiperStyle}=useUpdateSwiperStyle();
 const {handleTouchStart,handleTouchMove,handleTouchEnd,updateIndex}=useOffset({itemWidth:440,dataLength:3,onOffsetUpdate:updateSwiperStyle,onIndexUpdate:setCurrent,duration:300,MTEasing:easing});
 return <view className="page">
  <view className="header"><text className="brand">FORM / STUDIO</text><view accessibility-label="Shopping bag" className="bag"><text id="bag-count">Bag ({bag})</text></view></view>
  <scroll-view id="product-scroll" scroll-y className="content">
   <view className="photo" accessibility-label="Product image carousel">
    <view className="photo-track" main-thread:ref={containerRef} main-thread:bindtouchstart={handleTouchStart} main-thread:bindtouchmove={handleTouchMove} main-thread:bindtouchend={handleTouchEnd}>
     {pictures.map((src,i)=><view key={i} className="slide"><image src={src} mode="aspectFit" className="product-image"/></view>)}
    </view>
    <view className="photo-label"><text>THE EVERYDAY COLLECTION</text></view>
    <view className="photo-bottom"><text>Considered from every angle.</text><text id="image-index">{current+1} / 3</text></view>
   </view>
   <view className="dots">{pictures.map((_,i)=><view key={i} accessibility-element={true} accessibility-trait="button" accessibility-label={`View image ${i+1}`} bindtap={()=>{setCurrent(i);updateIndex(i)}} className={current===i?'dot active':'dot'}/>)}</view>
   <view className="information">
    <view className="eyebrow"><text>DESIGNED FOR SLOW LIVING</text><text>01 / SEATING</text></view>
    <view className="title-row"><text className="title">The Everyday Chair</text><text className="price">$240</text></view>
    <text className="description">A quiet presence. Sculpted lines, a generous seat, and thoughtful details made for the spaces you call home.</text>
    <view className="rule"/>
    <view className="label-row"><text className="label">Finish</text><text id="selected-finish">{finish}</text></view>
    <view className="finishes">{['Charcoal','Sand','Olive'].map((name,i)=><view key={name} accessibility-element={true} accessibility-trait="button" accessibility-label={`Select ${name} finish`} bindtap={()=>setFinish(name)} className={finish===name?'finish selected':'finish'}><view className={`swatch swatch-${i}`}/><text>{name}</text></view>)}</view>
    <view className="purchase"><view className="quantity"><view accessibility-element={true} accessibility-trait="button" accessibility-label="Decrease quantity" bindtap={()=>setQuantity(Math.max(1,quantity-1))}><text>−</text></view><text id="quantity">{quantity}</text><view accessibility-element={true} accessibility-trait="button" accessibility-label="Increase quantity" bindtap={()=>setQuantity(quantity+1)}><text>+</text></view></view><view className="add" accessibility-element={true} accessibility-trait="button" accessibility-label="Add to bag" bindtap={()=>{setBag(bag+quantity);setAdded(`${quantity} × ${finish} added to bag`)}}><text>Add to bag</text><text>↗</text></view></view>
    <text className="confirmation" id="confirmation">{added || 'Made to last. Ready for your everyday.'}</text>
    <view className="shipping"><text>Complimentary delivery</text><text>Ships in 3–5 days</text></view>
    <view className="detail-row" accessibility-element={true} accessibility-trait="button" accessibility-label="Product details" bindtap={()=>setDetails(!details)}><text>Details & materials</text><text>{details?'−':'+'}</text></view>
    {details&&<text id="product-details" className="details">Solid wood frame. Upholstered seat. Width 54 cm · Depth 58 cm · Height 78 cm. Wipe clean with a soft, dry cloth.</text>}
    <view className="footer"><text>LESS, BUT BETTER.</text><text>Objects for everyday life.</text></view>
   </view>
  </scroll-view>
 </view>;
}
root.render(<App/>);
