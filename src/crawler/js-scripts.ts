/**
 * JavaScript injection scripts for media extraction from search engines
 */

import type { SearchType } from "./url-builder";

/**
 * Get the CSS selector to wait for based on search type
 */
export function getWaitForSelector(type: SearchType): string {
  switch (type) {
    case "image":
      return ".tile--img, .tile-wrap, .zci-wrap";
    case "video":
      return ".tile--vid, .module--carousel";
    case "news":
      return ".result--news, .result";
    default:
      return ".result";
  }
}

/**
 * Get the JavaScript extraction script for media search types
 */
export function getMediaExtractionScript(
  type: "image" | "video" | "news" | "web",
): string {
  if (type === "news" || type === "web") {
    return getNewsOrWebScript(type);
  }
  if (type === "image") {
    return getImageScript();
  }
  return getVideoScript();
}

function getNewsOrWebScript(type: "news" | "web"): string {
  return `
    const results = [];
    const selector = '${type === "news" ? ".result--news" : ".result"}';
    const tiles = document.querySelectorAll(selector);
    
    tiles.forEach(tile => {
       if (tile.classList.contains('result--more') || tile.classList.contains('result--ad')) return;

       const titleEl = tile.querySelector('.result__title a');
       const link = titleEl ? titleEl.href : null;
       const title = titleEl ? titleEl.innerText : '';
       const snippet = tile.querySelector('.result__snippet')?.innerText || '';
       
       let image = null;
       const imgEl = tile.querySelector('.result__image img, .result__icon__img, .tile__media__img');
       if (imgEl) {
         const dataSrc = imgEl.dataset.src || imgEl.getAttribute('data-src');
         const rawSrc = imgEl.src;
         
         if (dataSrc) {
           image = dataSrc;
         } else if (rawSrc && !rawSrc.startsWith('data:')) {
           image = rawSrc;
         }
         
         if (image && image.startsWith('//')) image = 'https:' + image;
       }

       const date = tile.querySelector('.result__timestamp')?.innerText || '';
       const source = tile.querySelector('.result__url')?.innerText || '';
       
       let icon = null;
       const iconEl = tile.querySelector('.result__icon__img');
       if (iconEl && iconEl.src && !iconEl.src.startsWith('data:')) {
          icon = iconEl.src;
       }
       
       if (link && title) {
         results.push({
           title,
           url: link,
           snippet,
           image,
           date,
           source,
           favicon: icon,
           type: '${type}'
         });
       }
    });
    
    document.body.innerText = JSON.stringify(results);
  `;
}

function getImageScript(): string {
  return `
    const results = [];
    const tiles = document.querySelectorAll('.tile--img, .tile');
    
    tiles.forEach(tile => {
      const link = tile.querySelector('a.tile--img__sub, a.tile__link');
      const img = tile.querySelector('.tile--img__img, .tile__media__img, img.tile__image');
      const title = tile.querySelector('.tile--img__title, .tile__title');
      const dims = tile.querySelector('.tile--img__dims');
      
      if (!link || !img) return;
      
      const imgSrc = img.dataset.src || img.getAttribute('data-src') || img.src;
      if (!imgSrc || imgSrc.startsWith('data:') || imgSrc.includes('placeholder')) return;

      results.push({
        title: title ? title.innerText : 'Image',
        url: link.href,
        snippet: title ? title.innerText : '', 
        media: {
           url: link.href,
           thumbnail: imgSrc,
           dimensions: dims ? { 
               width: parseInt(dims.innerText.split('x')[0] || '0'), 
               height: parseInt(dims.innerText.split('x')[1] || '0') 
           } : undefined
        },
        type: 'image'
      });
    });
    
    document.body.innerText = JSON.stringify(results);
  `;
}

function getVideoScript(): string {
  return `
    const tiles = document.querySelectorAll('.tile--vid');
    const results = Array.from(tiles).map(tile => {
      const link = tile.querySelector('.tile__media > a');
      const title = tile.querySelector('.tile__title > a');
      const img = tile.querySelector('.tile__media__img');
      const duration = tile.querySelector('.tile__time');
      const views = tile.querySelector('.tile__views');
      const published = tile.querySelector('.tile__published');
      
      if (!link || !title) return null;
      
      const imgSrc = img ? (img.dataset.src || img.src) : null;
      
      return {
        title: title.innerText,
        url: link.href,
        snippet: title.innerText,
        media: {
           url: link.href,
           thumbnail: imgSrc,
           duration: duration ? duration.innerText : undefined,
           views: views ? views.innerText : undefined,
           publishedAt: published ? published.innerText : undefined
        },
        type: 'video'
      };
    }).filter(Boolean);
    
    document.body.innerText = JSON.stringify(results);
  `;
}
