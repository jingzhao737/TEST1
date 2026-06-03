import gsap from 'gsap';

// Singleton Hover Preview
if (!('ontouchstart' in window)) {
  const workList = document.querySelector('.work-list');
  const cards = document.querySelectorAll('.work-card');
  console.log('Premium Interactions JS Initialized.', !!workList, cards.length);
  
  if (workList && cards.length > 0) {
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    let isVisible = false;
    let activeSrc = null;

    // Singleton DOM
    const wrapper = document.createElement('div');
    wrapper.className = 'work-preview-wrapper';
    
    const curtain = document.createElement('div');
    curtain.className = 'work-preview-curtain';
    
    const imgContainer = document.createElement('div');
    imgContainer.className = 'work-preview-img-container';
    
    wrapper.appendChild(curtain);
    wrapper.appendChild(imgContainer);
    document.body.appendChild(wrapper);
    
    // Initial State
    gsap.set(wrapper, { autoAlpha: 0 });
    gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
    gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 14, x: 16, rotationX: -15 }); 
    
    // List Enter
    workList.addEventListener('mouseenter', () => {
      isVisible = true;
      currentX = targetX; currentY = targetY; // snap to initial
      
      gsap.to(wrapper, { autoAlpha: 1, duration: 0.15, overwrite: 'auto' });
      gsap.to(curtain, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', y: 0, rotationX: 0, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
      gsap.to(imgContainer, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', y: -16, x: 16, rotationX: 0, duration: 0.6, ease: 'expo.out', delay: 0.15, overwrite: 'auto' });
    });
    
    // List Leave
    workList.addEventListener('mouseleave', () => {
      isVisible = false;
      activeSrc = null;
      
      gsap.to(wrapper, { autoAlpha: 0, duration: 0.2, overwrite: 'auto', onComplete: () => {
        gsap.set(curtain, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
        gsap.set(imgContainer, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 14, x: 16, rotationX: -15 });
        imgContainer.innerHTML = '';
      }});
      gsap.to(curtain, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', y: -30, rotationX: 15, duration: 0.5, ease: 'expo.out', overwrite: 'auto' });
      gsap.to(imgContainer, { clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)', y: -46, x: 16, rotationX: 15, duration: 0.5, ease: 'expo.out', delay: 0.1, overwrite: 'auto' });
    });
    
    // Mouse Move
    workList.addEventListener('mousemove', (e) => {
      targetX = e.clientX - 100;
      targetY = e.clientY - 90;
    });
    
    // RAF Animation Loop
    let curX1 = 0, curY1 = 0;
    let curX2 = 0, curY2 = 0;
    let firstMove = true;
    
    (function animateHover() {
      if (isVisible) {
        if (firstMove) {
          curX1 = targetX; curY1 = targetY;
          curX2 = targetX; curY2 = targetY;
          firstMove = false;
        }
        
        let dx1 = targetX - curX1, dy1 = targetY - curY1;
        curX1 += dx1 * 0.06; curY1 += dy1 * 0.06; 
        
        let tiltY1 = gsap.utils.clamp(-25, 25, dx1 * 0.1);
        let tiltX1 = gsap.utils.clamp(-25, 25, -dy1 * 0.1);
        let tiltZ1 = gsap.utils.clamp(-8, 8, dx1 * 0.025);
        
        let dx2 = targetX - curX2, dy2 = targetY - curY2;
        curX2 += dx2 * 0.09; curY2 += dy2 * 0.09; 
        
        let tiltY2 = gsap.utils.clamp(-30, 30, dx2 * 0.12);
        let tiltX2 = gsap.utils.clamp(-30, 30, -dy2 * 0.12);
        let tiltZ2 = gsap.utils.clamp(-10, 10, dx2 * 0.035);
        
        gsap.set(curtain, { 
          left: curX1, top: curY1, 
          transformPerspective: 1000, 
          rotationY: tiltY1, 
          rotationX: tiltX1, 
          rotation: tiltZ1 
        });
        gsap.set(imgContainer, { 
          left: curX2, top: curY2, 
          transformPerspective: 1000, 
          rotationY: tiltY2, 
          rotationX: tiltX2, 
          rotation: tiltZ2 
        });
      } else {
        firstMove = true;
      }
      requestAnimationFrame(animateHover);
    })();
    
    // Card Hover
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        const src = card.dataset.image;
        if (src && src !== activeSrc) {
          activeSrc = src;
          const newImg = document.createElement('img');
          newImg.className = 'work-preview-img';
          newImg.src = src;
          
          gsap.set(newImg, { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)', y: 30, rotationX: -15 });
          imgContainer.appendChild(newImg);
          
          gsap.to(newImg, {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            y: 0,
            rotationX: 0,
            duration: 0.6,
            ease: 'expo.out',
            overwrite: 'auto',
            onComplete: () => {
              const imgs = imgContainer.querySelectorAll('.work-preview-img');
              if (imgs.length > 1) {
                for (let i = 0; i < imgs.length - 1; i++) {
                  imgs[i].remove();
                }
              }
            }
          });
        }
      });
    });
  }
}
