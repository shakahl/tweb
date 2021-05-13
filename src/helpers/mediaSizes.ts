/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import { MOUNT_CLASS_TO } from "../config/debug";
import calcImageInBox from "./calcImageInBox";
import EventListenerBase from "./eventListenerBase";

export class MediaSize {
  constructor(public width = 0, public height = width) {

  }

  public aspect(boxSize: MediaSize, fitted: boolean) {
    return calcImageInBox(this.width, this.height, boxSize.width, boxSize.height, fitted);
  }

  public aspectFitted(boxSize: MediaSize) {
    return this.aspect(boxSize, true);
  }

  public aspectCovered(boxSize: MediaSize) {
    return this.aspect(boxSize, false);
  }
}

export function makeMediaSize(width?: number, height?: number): MediaSize {
  return new MediaSize(width, height);
}

type MediaTypeSizes = {
  regular: MediaSize,
  webpage: MediaSize,
  album: MediaSize,
  esgSticker: MediaSize
};

export enum ScreenSize {
  mobile,
  medium,
  large
}

const MOBILE_SIZE = 600;
const MEDIUM_SIZE = 1275;
const LARGE_SIZE = 1680;

class MediaSizes extends EventListenerBase<{
  changeScreen: (from: ScreenSize, to: ScreenSize) => void
}> {
  private screenSizes: {key: ScreenSize, value: number}[] = [
    {key: ScreenSize.mobile, value: MOBILE_SIZE},
    {key: ScreenSize.medium, value: MEDIUM_SIZE},
    {key: ScreenSize.large, value: LARGE_SIZE}
  ];

  private sizes: {[k in 'desktop' | 'handhelds']: MediaTypeSizes} = {
    handhelds: {
      regular: makeMediaSize(270, 270),
      webpage: makeMediaSize(270, 200),
      album: makeMediaSize(270, 0),
      esgSticker: makeMediaSize(68, 68)
    },
    desktop: {
      regular: makeMediaSize(400, 320),
      webpage: makeMediaSize(400, 320),
      album: makeMediaSize(420, 0),
      esgSticker: makeMediaSize(80, 80)
    }
  };

  public isMobile = false;
  public active: MediaTypeSizes;
  public activeScreen: ScreenSize;
  public rAF: number;

  constructor() {
    super();

    window.addEventListener('resize', () => {
      if(this.rAF) window.cancelAnimationFrame(this.rAF);
      this.rAF = window.requestAnimationFrame(() => {
        this.handleResize();
        this.rAF = 0;
      });
    });
    this.handleResize();
  }

  private handleResize = () => {
    const innerWidth = window.innerWidth;
    //this.isMobile = innerWidth <= 720;
    
    let activeScreen = this.screenSizes[0].key;
    for(let i = this.screenSizes.length - 1; i >= 0; --i) {
      if(this.screenSizes[i].value < innerWidth) {
        activeScreen = (this.screenSizes[i + 1] || this.screenSizes[i]).key;
        break;
      }
    }

    const wasScreen = this.activeScreen;
    this.activeScreen = activeScreen;
    this.isMobile = this.activeScreen === ScreenSize.mobile;
    this.active = this.isMobile ? this.sizes.handhelds : this.sizes.desktop;

    //console.time('esg');
    //const computedStyle = window.getComputedStyle(document.documentElement);
    //this.active.esgSticker.width = parseFloat(computedStyle.getPropertyValue('--esg-sticker-size'));
    //console.timeEnd('esg');

    if(wasScreen !== activeScreen) {
      //console.log('changeScreen', this.activeScreen, activeScreen);

      if(wasScreen !== undefined) {
        this.dispatchEvent('changeScreen', this.activeScreen, activeScreen);
      }
    }

    /* if(this.isMobile) {
      for(let i in this.active) {
        // @ts-ignore
        let size = this.active[i];
        size.width = innerWidth 
      }
    } */
  };
}

const mediaSizes = new MediaSizes();
MOUNT_CLASS_TO.mediaSizes = mediaSizes;
export default mediaSizes;
