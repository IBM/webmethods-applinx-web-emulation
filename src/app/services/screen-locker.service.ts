/*
 * Copyright IBM Corp. 2024, 2025
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ 
 
import { Injectable, NgZone } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { MessagesService } from './messages.service';

// Support 2 animations (tab & screen spinners) when loading new screen.
// Screen spinner being displayed after 1sec if still loading.
// Tab spinner is being displayed immedietaly when loading new screen.
@Injectable({
  providedIn: 'root'
})
export class ScreenLockerService {

  private faviconFrames = [
    './assets/images/tab-spinner-frames/frame_0.gif',
    './assets/images/tab-spinner-frames/frame_1.gif',
    './assets/images/tab-spinner-frames/frame_2.gif',
    './assets/images/tab-spinner-frames/frame_3.gif',
    './assets/images/tab-spinner-frames/frame_4.gif',
    './assets/images/tab-spinner-frames/frame_5.gif',
    './assets/images/tab-spinner-frames/frame_6.gif',
    './assets/images/tab-spinner-frames/frame_7.gif',
    './assets/images/tab-spinner-frames/frame_8.gif',
    './assets/images/tab-spinner-frames/frame_9.gif',
    './assets/images/tab-spinner-frames/frame_10.gif',
    './assets/images/tab-spinner-frames/frame_11.gif',
    './assets/images/tab-spinner-frames/frame_12.gif',
    './assets/images/tab-spinner-frames/frame_13.gif',
    './assets/images/tab-spinner-frames/frame_14.gif',
    './assets/images/tab-spinner-frames/frame_15.gif',
    './assets/images/tab-spinner-frames/frame_16.gif',
    './assets/images/tab-spinner-frames/frame_17.gif',
    './assets/images/tab-spinner-frames/frame_18.gif',
    './assets/images/tab-spinner-frames/frame_19.gif',
    './assets/images/tab-spinner-frames/frame_20.gif',
    './assets/images/tab-spinner-frames/frame_21.gif',
    './assets/images/tab-spinner-frames/frame_22.gif',
    './assets/images/tab-spinner-frames/frame_23.gif',
  ];
  private imageCounter = 0;
  private tabSpinnerHandler: number;
  private screenSpinnerHandler: number;
  private showScreenSpinner = false;
  private isScreenIdUpdated = true;

   constructor(private ngZone: NgZone, private logger: NGXLogger, private messages: MessagesService) {}

  setLocked(lock: boolean): void {    
    if (lock) {
      this.showTabSpinner();
      this.screenSpinnerHandler = setTimeout(() => this.showScreenSpinner = true, 50);
    } else {
      if (this.showScreenSpinner) {
        setTimeout(() => this.showScreenSpinner = false); // 1000ms have already passed and spinner is presented.
      } else if (this.screenSpinnerHandler) {
        clearTimeout(this.screenSpinnerHandler); // 1000ms haven't yet passed and spinner is NOT presented, so cancel the timer.
      }
      this.hideTabSpinner();
      this.screenSpinnerHandler = null;
      this.setScreenIdUpdated(true);
    }
  }

  isLocked(): boolean {
    return  (!this.isScreenIdUpdated || this.showScreenSpinner || this.screenSpinnerHandler != null);
  }

  setScreenIdUpdated(isUpdated: boolean): void{
    this.isScreenIdUpdated = isUpdated;
  }

  setShowScreenSpinner(flag: boolean){
    this.showScreenSpinner = flag;
  }

  isShowScreenSpinner(): boolean {
    return this.showScreenSpinner;
  }

  private showTabSpinner(): void {
    this.ngZone.runOutsideAngular(() => {
    this.tabSpinnerHandler = setInterval(() => {
      const currentFavicon = document.querySelector('link[rel=\'icon\']');
      if (currentFavicon){
        currentFavicon.remove();
      }
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = this.faviconFrames[this.imageCounter];
      newFavicon.type = 'image/gif';
      document.head.appendChild(newFavicon);

      if (this.imageCounter === this.faviconFrames.length - 1) {
        this.imageCounter = 0;
      }
      else {
        this.imageCounter++;
      }
     }, 100);     
     });
  }

  // Stop the tab spinner and replace with the regular Applinx favicon.
  private hideTabSpinner(): void {
    this.ngZone.runOutsideAngular(() => {
    if (this.tabSpinnerHandler) {
      clearInterval(this.tabSpinnerHandler);
      this.tabSpinnerHandler = null;
    }
    const currentFavicon = document.querySelector('link[rel=\'icon\']');
    if (currentFavicon){
      currentFavicon.remove();
      const defaultFavicon = document.createElement('link');
      defaultFavicon.rel = 'icon';
      defaultFavicon.href = './assets/images/favicon.ico';
      defaultFavicon.type = 'image/x-icon';
      document.head.appendChild(defaultFavicon);
    }
    this.imageCounter = 0;
    });
  }
}
