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
 const [panel,setPanel]=useState('');
 const [order,setOrder]=useState({finish:'',frame:'',quantity:0,total:0});
 const [frame,setFrame]=useState('Oak');
 const [cart,setCart]=useState({finish:'Charcoal',frame:'Oak',price:240});
 const frames=['Oak','Ash','Maple','Birch','Beech','Walnut'];
 const price=frame==='Walnut'?270:240;
 const {containerRef,updateSwiperStyle}=useUpdateSwiperStyle();
 const {handleTouchStart,handleTouchMove,handleTouchEnd,updateIndex}=useOffset({itemWidth:440,dataLength:3,onOffsetUpdate:updateSwiperStyle,onIndexUpdate:setCurrent,duration:300,MTEasing:easing});
 return <view className="page">
  <view className="header"><text className="brand">FORM / STUDIO</text><view accessibility-element={true} accessibility-trait="button" accessibility-label="Shopping bag" className="bag" bindtap={()=>setPanel('bag')}><text id="bag-count">Bag ({bag})</text></view></view>
  <scroll-view id="product-scroll" scroll-y className="content">
   <view className="photo" accessibility-label="Product image carousel" main-thread:bindtouchstart={handleTouchStart} main-thread:bindtouchmove={handleTouchMove} main-thread:bindtouchend={handleTouchEnd}>
    <view className="photo-track" main-thread:ref={containerRef}>
     {pictures.map((src,i)=><view key={i} className="slide"><image src={src} mode="aspectFit" className="product-image"/></view>)}
    </view>
    <view className="drag-zone drag-right" accessibility-element={true} accessibility-label="Right side of product image"/><view className="drag-zone drag-left" accessibility-element={true} accessibility-label="Left side of product image"/><view className="photo-label"><text>THE EVERYDAY COLLECTION</text></view>
    <view className="photo-bottom"><text>Considered from every angle.</text><text id="image-index">{current+1} / 3</text></view>
   </view>
   <view className="dots">{pictures.map((_,i)=><view key={i} accessibility-element={true} accessibility-trait="button" accessibility-label={`View image ${i+1}`} bindtap={()=>{setCurrent(i);updateIndex(i)}} className={current===i?'dot active':'dot'}/>)}</view>
   <view className="information">
    <view className="eyebrow"><text>DESIGNED FOR SLOW LIVING</text><text>01 / SEATING</text></view>
    <view className="title-row"><text className="title">The Everyday Chair</text><text className="price">${price}</text></view>
    <text className="description">A quiet presence. Sculpted lines, a generous seat, and thoughtful details made for the spaces you call home.</text>
    <view className="rule"/>
    <view className="label-row"><text className="label">Finish</text><text id="selected-finish">{finish}</text></view>
    <view className="finishes">{['Charcoal','Sand','Olive'].map((name,i)=><view key={name} accessibility-element={true} accessibility-trait="button" accessibility-label={`Select ${name} finish`} bindtap={()=>setFinish(name)} className={finish===name?'finish selected':'finish'}><view className={`swatch swatch-${i}`}/><text>{name}</text></view>)}</view>
    <view className="detail-row" accessibility-element={true} accessibility-trait="button" accessibility-label="Choose frame" bindtap={()=>setPanel('frame')}><text>Frame material</text><text id="selected-frame">{frame} ›</text></view><view className="purchase"><view className="quantity"><view accessibility-element={true} accessibility-trait="button" accessibility-label="Decrease quantity" bindtap={()=>setQuantity(Math.max(1,quantity-1))}><text>−</text></view><text id="quantity">{quantity}</text><view accessibility-element={true} accessibility-trait="button" accessibility-label="Increase quantity" bindtap={()=>setQuantity(quantity+1)}><text>+</text></view></view><view className="add" accessibility-element={true} accessibility-trait="button" accessibility-label="Add to bag" bindtap={()=>{setBag(bag+quantity);setCart({finish,frame,price});setAdded(`${quantity} × ${finish} added to bag`)}}><text>Add to bag</text><text>↗</text></view></view>
    <text className="confirmation" id="confirmation">{added || 'Made to last. Ready for your everyday.'}</text>
    <view className="shipping"><text>Complimentary delivery</text><text>Ships in 3–5 days</text></view>
    <view className="detail-row" accessibility-element={true} accessibility-trait="button" accessibility-label="Product details" bindtap={()=>setDetails(!details)}><text>Details & materials</text><text>{details?'−':'+'}</text></view>
    {details&&<text id="product-details" className="details">Solid wood frame. Upholstered seat. Width 54 cm · Depth 58 cm · Height 78 cm. Wipe clean with a soft, dry cloth.</text>}
    <view className="footer"><text>LESS, BUT BETTER.</text><text>Objects for everyday life.</text></view>
   </view>
  </scroll-view>
  {panel&&<view className="panel-shade"><view className="panel">
   <view className="panel-heading"><text className="panel-title">{panel==='frame'?'Choose your frame':panel==='order'?'Thank you':'Your shopping bag'}</text><view accessibility-element={true} accessibility-trait="button" accessibility-label="Close panel" bindtap={()=>setPanel('')}><text>Close ×</text></view></view>
   {panel==='order'?<view className="order-success"><view className="success-mark"><text>✓</text></view><text id="order-status" className="order-title">Order confirmed</text><text className="muted">Your next everyday favourite is on its way.</text><view className="order-receipt"><text className="cart-name">The Everyday Chair</text><text id="order-variant">{order.finish} / {order.frame}</text><text id="order-quantity">Quantity: {order.quantity}</text><view className="cart-total"><text>Total</text><text id="order-total">${order.total}</text></view><text className="muted">Complimentary delivery · 3–5 days</text></view></view>:panel==='frame'?<scroll-view scroll-y id="frame-options" className="panel-scroll">{frames.map((name,i)=><view key={name} className="frame-option" accessibility-element={true} accessibility-trait="button" accessibility-label={`Choose ${name} frame`} bindtap={()=>{setFrame(name);setPanel('')}}><view><text>{name}</text><text className="muted">{i===5?'Rich grain · +$30':'Natural grain · Included'}</text></view><text>{name===frame?'Selected':'Select'}</text></view>)}</scroll-view>:<view className="cart-content">
    {bag>0?<view><text className="cart-name">The Everyday Chair</text><text id="cart-variant" className="muted">{cart.finish} / {cart.frame}</text><view className="label-row cart-quantity"><text id="cart-quantity">Quantity: {bag}</text><view accessibility-element={true} accessibility-trait="button" accessibility-label="Increase bag quantity" bindtap={()=>setBag(bag+1)}><text>+ Add one</text></view></view><view className="cart-total"><text>Subtotal</text><text id="cart-total">${bag*cart.price}</text></view><view className="submit-order" accessibility-element={true} accessibility-trait="button" accessibility-label="Submit order" bindtap={()=>{setOrder({finish:cart.finish,frame:cart.frame,quantity:bag,total:bag*cart.price});setBag(0);setPanel('order')}}><text>Submit order</text><text>↗</text></view><view className="detail-row" accessibility-element={true} accessibility-trait="button" accessibility-label="Remove item" bindtap={()=>setBag(0)}><text>Remove item</text><text>×</text></view></view>:<text id="empty-bag">Your bag is empty</text>}
   </view>}
  </view></view>}
  {panel==='order'&&<view id="confetti" className="confetti">{Array.from({length:48},(_,i)=><view key={i} className="confetti-piece" style={{left:`${(i*83)%430}px`,backgroundColor:['#c6a36a','#486746','#e6a797','#d0bcdf','#e4cd73','#78a5ae'][i%6],animationDelay:`-${(i%12)*0.3}s`,animationDuration:`${3.2+(i%5)*0.25}s`,width:`${5+i%4}px`,height:`${9+i%7}px`}}/>)}</view>}
 </view>;
}
root.render(<App/>);
