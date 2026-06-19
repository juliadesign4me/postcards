import createPostage1 from './postcards/create/postage-1.png';
import createPostage2 from './postcards/create/postage-2.png';
import createPostage3 from './postcards/create/postage-3.png';
import createStamp1 from './postcards/create/stamp-1.png';
import createStamp2 from './postcards/create/stamp-2.png';
import createStampBack1 from './postcards/create/stamp-back-1.png';
import createStampBack2 from './postcards/create/stamp-back-2.png';
import createStampPreview from './postcards/create/stamp-preview.png';
import createStampBackGhost from './postcards/create/stamp-back-ghost.png';
import createPostageFrameSmall from './postcards/create/postage-frame-small.svg';
import createIconUploadSm from './postcards/create/icon-upload-sm.svg';

import retroPostage1 from './postcards/retro70/postage-art-1.png';
import retroPostage2 from './postcards/retro70/postage-art-2.png';
import retroPostage3 from './postcards/retro70/postage-art-3.png';
import retroStampFront from './postcards/retro70/stamp-front.png';
import retroStampBack from './postcards/retro70/stamp-back.png';

import vintagePostage1 from './postcards/vintage/postage-art-1.png';
import vintagePostage2 from './postcards/vintage/postage-art-2.png';
import vintagePostage3 from './postcards/vintage/postage-art.png';
import vintageStampFront from './postcards/vintage/stamp-front.png';
import vintageStampBack from './postcards/vintage/stamp-back.png';

import modernStickerCroissant from './postcards/modern/sticker-croissant.png';
import modernStickerDrink from './postcards/modern/sticker-drink.png';
import modernStickerBeach from './postcards/modern/sticker-beach.png';
import modernStickerBackpack from './postcards/modern/sticker-backpack.png';
import modernStickerHeart from './postcards/modern/sticker-heart.png';
import modernStickerCup from './postcards/modern/sticker-cup.png';
import modernStickerSea from './postcards/modern/sticker-sea.png';
import modernStickerMountains from './postcards/modern/sticker-mountains.png';

import retroStickerCroissant from './postcards/retro70/sticker-croissant.png';
import retroStickerDrink from './postcards/retro70/sticker-drink.png';
import retroStickerBeach from './postcards/retro70/sticker-beach.png';
import retroStickerBackpack from './postcards/retro70/sticker-backpack.png';
import retroStickerHeart from './postcards/retro70/sticker-heart.png';
import retroStickerCup from './postcards/retro70/sticker-cup.png';
import retroStickerSea from './postcards/retro70/sticker-sea.png';
import retroStickerMountains from './postcards/retro70/sticker-mountains.png';

import vintageStickerCroissant from './postcards/vintage/sticker-croissant.png';
import vintageStickerDrink from './postcards/vintage/sticker-drink.png';
import vintageStickerBeach from './postcards/vintage/sticker-beach.png';
import vintageStickerBackpack from './postcards/vintage/sticker-backpack.png';
import vintageStickerHeart from './postcards/vintage/sticker-heart.png';
import vintageStickerCup from './postcards/vintage/sticker-cup.png';
import vintageStickerSea from './postcards/vintage/sticker-sea.png';
import vintageStickerMountains from './postcards/vintage/sticker-mountains.png';

import modernFrontFrame from './postcards/modern/front-frame.svg';
import modernFrontFrameEmpty from './postcards/modern/front-frame-empty.svg';
import modernBackFrame from './postcards/modern/back-frame.svg';
import modernUploadIcon from './postcards/modern/upload-icon.svg';
import modernPostageFrame from './postcards/modern/postage-frame.svg';

import retroFrontFrame from './postcards/retro70/front-frame.svg';
import retroFrontFrameEmpty from './postcards/retro70/front-frame-empty.svg';
import retroBackFrame from './postcards/retro70/back-frame.svg';
import retroUploadIcon from './postcards/retro70/upload-icon.svg';
import retroPostageFrame from './postcards/retro70/postage-frame.svg';

import vintageFrontFrame from './postcards/vintage/front-frame.svg';
import vintageFrontFrameEmpty from './postcards/vintage/front-frame-empty.svg';
import vintageBackFrame from './postcards/vintage/back-frame.svg';
import vintageUploadIcon from './postcards/vintage/upload-icon.svg';
import vintagePostageFrame from './postcards/vintage/postage-frame.svg';
import vintagePostageFrameNew from './postcards/vintage/postage-frame-new.svg';
import vintageBgPaper from './postcards/vintage/bg-paper.png';
import vintageInnerFrame from './postcards/vintage/inner-frame.svg';

const STICKER_LABELS = [
  'Croissant',
  'Drink',
  'Beach',
  'Backpack',
  'Heart',
  'Cup',
  'Sea',
  'Mountains',
];

function stickerOptions(urls){
  return urls.map((src, index)=>({
    src,
    label: STICKER_LABELS[index],
  }));
}

export const CARD_ASSETS = {
  uploadIconSm: createIconUploadSm,
  postage: {
    modern: [createPostage1, createPostage2, createPostage3],
    retro70: [retroPostage1, retroPostage2, retroPostage3],
    vintage: [vintagePostage1, vintagePostage2, vintagePostage3],
  },
  frontStamps: {
    modern: [createStamp1, createStamp2],
    retro70: [retroStampFront, createStamp2],
    vintage: [vintageStampFront, createStamp2],
  },
  backStamps: {
    modern: [createStampBack1, createStampBack2],
    retro70: [retroStampBack, createStampBack2],
    vintage: [vintageStampBack, createStampBack2],
  },
  ghostStampFront: createStampPreview,
  ghostStampBack: createStampBackGhost,
  postageFrameSmall: createPostageFrameSmall,
  postageFrameByStyle: {
    modern: modernPostageFrame,
    retro70: retroPostageFrame,
    vintage: vintagePostageFrame,
  },
  stickers: {
    modern: stickerOptions([
      modernStickerCroissant,
      modernStickerDrink,
      modernStickerBeach,
      modernStickerBackpack,
      modernStickerHeart,
      modernStickerCup,
      modernStickerSea,
      modernStickerMountains,
    ]),
    retro70: stickerOptions([
      retroStickerCroissant,
      retroStickerDrink,
      retroStickerBeach,
      retroStickerBackpack,
      retroStickerHeart,
      retroStickerCup,
      retroStickerSea,
      retroStickerMountains,
    ]),
    vintage: stickerOptions([
      vintageStickerCroissant,
      vintageStickerDrink,
      vintageStickerBeach,
      vintageStickerBackpack,
      vintageStickerHeart,
      vintageStickerCup,
      vintageStickerSea,
      vintageStickerMountains,
    ]),
  },
  style: {
    modern: {
      frontFrame: modernFrontFrame,
      frontFrameEmpty: modernFrontFrameEmpty,
      backFrame: modernBackFrame,
      uploadIcon: modernUploadIcon,
      postageFrame: modernPostageFrame,
    },
    retro70: {
      frontFrame: retroFrontFrame,
      frontFrameEmpty: retroFrontFrameEmpty,
      backFrame: retroBackFrame,
      uploadIcon: retroUploadIcon,
      postageFrame: retroPostageFrame,
    },
    vintage: {
      frontFrame: vintageFrontFrame,
      frontFrameEmpty: vintageFrontFrameEmpty,
      backFrame: vintageBackFrame,
      uploadIcon: vintageUploadIcon,
      postageFrame: vintagePostageFrameNew,
      bgPaper: vintageBgPaper,
      innerFrame: vintageInnerFrame,
    },
  },
};
