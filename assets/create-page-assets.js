import iconHome from './postcards/create/icon-home.svg';
import iconFlip from './postcards/create/icon-flip.svg';
import iconTitle from './postcards/create/icon-title.svg';
import iconArrow from './postcards/create/icon-arrow.svg';
import styleModern from './postcards/create/style-modern.png';
import styleRetro from './postcards/create/style-retro.png';
import styleVintage from './postcards/create/style-vintage.png';
import bgDeco from './postcards/create/bg-deco.svg';

export const CREATE_PAGE_ASSETS = {
  iconHome,
  iconFlip,
  iconTitle,
  iconArrow,
  styleModern,
  styleRetro,
  styleVintage,
  bgDeco,
};

export function applyCreatePageAssets(root = document){
  root.querySelectorAll('[data-create-asset]').forEach((el)=>{
    const url = CREATE_PAGE_ASSETS[el.dataset.createAsset];
    if(url){
      el.setAttribute('src', url);
    }
  });

  const deco = root.querySelector('.create-bg-deco');
  if(deco){
    const mask = `url("${CREATE_PAGE_ASSETS.bgDeco}")`;
    deco.style.setProperty('-webkit-mask-image', mask);
    deco.style.setProperty('mask-image', mask);
  }
}
