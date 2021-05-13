/*
 * Скин видео проигрывателя
 * 
 * Версия:      0.3
 * Автор:       Banko Viktor (bankviktor14@gmail.com)
 * Дата:        07.05.2021
 *
 */

// TODO кнопка "С начала" при завершении видео
// TODO пропадание контролов при воспроизведении и не двжении мыши
// TODO всплывающая подсказка мутирования 0.5
// TODO всплывающая подсказка далее/назад 5сек, плей/стоп
// TODO ffmpeg Создание нескольких выходов https://trac.ffmpeg.org/wiki/Creating%20multiple%20outputs
// TODO название видео в левом верхнем углу прлеера
// TODO спинер при ожидании загрузки

/**
 * Горячие клавишы:
 *   [H] или [Стрелка влево] - Перейти на 5 сек раньше
 *   [J] - Уменьшить скорость воспроизведения
 *   [K] - Старт/стоп/нормальноая скорость
 *   [L] - Увеличить скорость воспроизведения
 *   [;] или [Стрелка вправо] - Перейти на 5 сек позже
 *   [I] - Открыть мини проигрователь
 *   [F] - Во весь экран
 *   [M] - Отключение/включение звука
 *   [0]-[9] или [NumPad 0]-[NumPad 9] - Перейти на % видео
 *   [Стрелка вверх] - Плавное увеличение громкости звука
 *   [Стрелка вниз] - Плавное уменьшение громкости звука
 */


class bvPlayer {
    /**
     * Меняет состояние кнопки.
     * @param {Element} element Элемент контролла.
     * @param {string} title Новый текст всплывающей подсказки.
     * @param {string} innerHTML Новое содержимое (SVG иконка).
     */
    static _changeButtonState(element, title, innerHTML) {
        element.innerHTML = innerHTML;
        element.title = title;
    }

    /**
     * Устанавливает скорость воспроизведения из набора по индексу.
     * @param {Element} video Элемент проигрывателя.
     * @param {number} speedIndex Индекс скорости воспроизведния из набора.
     */
    _setPlaySpeed(video, speedIndex) {
        this.playSpeedCur = speedIndex;
        video.playbackRate = this.playSpeeds[speedIndex];
    }

    /**
     * Преобразует строку вида 'hh:mm:ss' в число.
     * @param {string} str
     */
    static str2dur(str) {
        const parts = str.split(":", 3).reverse();
        const m = [1, 60, 3600];
        let result = 0;
        for (let i = 0; i < parts.length; i++) {
            result += parseInt(parts[i]) * m[i];
        }
        return result;
    }

    /**
     * Преобразует число в строку вида 'hh:mm:ss'.
     * @param {number} duration
     */
    static dur2str(duration) {
        const m = Math.trunc(duration / 60);
        const h = Math.trunc(m / 60);
        const s = Math.trunc(duration - (h * 60 + m) * 60);
        let result = m + ":" + (s < 10 ? "0" + s : s);
        if (m >= 60) {
            result = h + ":" + result;
        }
        return result;
    }

    /**
     * Устанавливает громкость.
     * @param {Event} event события
     */
    _setVolume(event) {
        let x = event.offsetX;

        if (event.target === this.volumeSliderThumb) {
            x = event.target.offsetLeft + event.offsetX + 6;
        }

        const width = event.currentTarget.clientWidth - 1;
        let val = x / width;

        if (val < 0) {
            val = 0;
        } else if (val > 1) {
            val = 1;
        }

        this.video.volume = val;
        this.volumeFill.style.width = `${val * 100}%`;

        if (this.video.muted) {
            this.video.muted = false;
        }
    }

    /**
     * Создает новый объект управления плеером.
     * @param {string} root_player_id Id корневого div-элемента плеера.
     */
    constructor(root_player_id) {
        // data
        this.playSpeedDef = 3;
        this.playSpeedCur = this.playSpeedDef;
        this.playSpeeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0, 8.0];
        this.moveTimeStep = 5;
        this.volumeStep = 0.1;

        // elements
        this.player = document.querySelector(`div#${root_player_id}`); 
        this.video = this.player.querySelector("video");
        this.progressBarTrack = this.player.querySelector(".bv-progress-bar-track");
        this.progressBarPos = this.player.querySelector(".bv-progress-bar-pos");
        this.progressBarCursor = this.player.querySelector(".bv-progress-bar-cursor");
        this.ctlPlayPause = this.player.querySelector("#bv_ctl_play_pause"); 
        this.ctlMute = this.player.querySelector("#bv_ctl_mute"); 
        this.volumeSlider = this.player.querySelector(".bv-volume-slider");
        this.volumeSliderWrapper = this.player.querySelector(".bv-volume-slider-wrapper");
        this.volumeSliderThumb = this.player.querySelector(".bv-volume-slider-thumb");
        this.volumeFill = this.player.querySelector(".bv-volume-slider-fill");
        this.ctlSlower = this.player.querySelector("#bv_ctl_slower"); 
        this.ctlSpeedIndicator = this.player.querySelector(".bv-ctl-speed-indicator"); 
        this.ctlSpeedIndicatorContent = this.player.querySelector(".bv-ctl-speed-indicator-content"); 
        this.ctlFaster = this.player.querySelector("#bv_ctl_faster"); 
        this.ctlPip = this.player.querySelector("#bv_ctl_pip");
        this.ctlFullSrc = this.player.querySelector("#bv_ctl_fullsrc"); 
        this.ctlQuality = this.player.querySelector("#bv_ctl_quality"); 
        this.ctlHelp = this.player.querySelector("#bv_ctl_help"); 
        this.timeCurrent = this.player.querySelector(".bv-time-current"); 
        this.timeDuration = this.player.querySelector(".bv-time-duration");
        this.bufferSegs = this.player.querySelector(".bv-buffer-segs"); 
        this.popup = this.player.querySelector(".bv-popup");
        this.ctlPopupClose = this.player.querySelector(".bv-popup-footer button");
        this.timeCode = this.player.querySelector(".bv-timecode");
        this.hint = this.player.querySelector(".bv-hint");
        this.popupQuality = this.player.querySelector(".bv-menu");
        this.floatIcon = this.player.querySelector('.bv-float-icon');

        // Player root
        this.player.onfullscreenchange = event => {
            if (document.fullscreen) {
                bvPlayer._changeButtonState(this.ctlFullSrc, "Выход из полноэкранного режима (F)", svg_fullscr_leave);
            } else {
                bvPlayer._changeButtonState(this.ctlFullSrc, "Во весь экран (F)", svg_fullscr_enter);
            }
        }
        this.player.ondblclick = event => {
            if (event.target === this.video) {
                this.ctlFullSrc.click();
            }
        }
        this.player.onclick = event => {
            let isClosing = true;

            for (let i = 0; i < event.path.length; i++) {
                if (event.path[i] === this.ctlQuality) {
                    isClosing = false;
                    break;
                }
            }

            if (isClosing) {
                this.popupQuality.style.visibility = 'collapse';
                this.popupQuality.style.opacity = 0;
            }
        }

        // Video
        this.video.ontimeupdate = event => {
            this.timeCurrent.innerText = bvPlayer.dur2str(event.target.currentTime);
            const position = event.target.currentTime / event.target.duration;
            this.progressBarPos.style.width = position * 100 + "%";
            this.timeDuration.innerHTML = bvPlayer.dur2str(event.target.duration);
        }
        this.video.onplay = event => {
            bvPlayer._changeButtonState(this.ctlPlayPause, "Пауза (K)", svg_pause);
        }
        this.video.onpause = event => {
            bvPlayer._changeButtonState(this.ctlPlayPause, "Смотреть (K)", svg_play);
        }
        this.video.onvolumechange = event => {
            if (event.target.muted || event.target.volume === 0) {
                bvPlayer._changeButtonState(this.ctlMute, "Отключение звука (M)", svg_sound_mute);
            } else if (event.target.volume < 0.5) {
                bvPlayer._changeButtonState(this.ctlMute, "Отключение звука (M)", svg_sound_middle);
            } else {
                bvPlayer._changeButtonState(this.ctlMute, "Отключение звука (M)", svg_sound_max);
            }

            this.volumeFill.style.width = this.video.volume * 100 + '%';
        }
        if (this.video.muted) {
            bvPlayer._changeButtonState(this.ctlMute, "Отключение звука (М)", svg_sound_mute);
        }
        this.video.onratechange = event => {
            if (this.ctlSlower != null) {
                this.ctlSlower.disabled = this.playSpeedCur <= 0;
            }
            if (this.ctlFaster != null) {
                this.ctlFaster.disabled = this.playSpeedCur >= this.playSpeeds.length - 1;
            }
            if (this.ctlSpeedIndicator != null) {
                this.ctlSpeedIndicator.disabled = this.playSpeedCur == this.playSpeedDef;
            }
            if (this.ctlSpeedIndicatorContent != null) {
                this.ctlSpeedIndicatorContent.title = this.playSpeedCur == this.playSpeedDef ?
                    "Текущая скорость воспроизведения" :
                    "К нормальной скорости воспроизведения (K)";
                this.ctlSpeedIndicatorContent.innerText = "x" + this.video.playbackRate;
            }
        }
        this.video.onenterpictureinpicture = event => {
            bvPlayer._changeButtonState(this.ctlPip, "Закрыть мини проигрыватель (I)", svg_pip_leave);
        }
        this.video.onleavepictureinpicture = event => {
            bvPlayer._changeButtonState(this.ctlPip, "Открыть мини проигрыватель (I)", svg_pip_enter);
        }
        this.video.onclick = event => {
            if (this.popupQuality.style.opacity != 1) {
                this.ctlPlayPause.onclick(event);
            }
            this._showPlayHint();
        }
        // 1. loadstart
        // 2. durationchange
        this.video.ondurationchange = event => {
            this.timeDuration.innerHTML = bvPlayer.dur2str(event.target.duration);
        };
        // 3. loadedmetadata 
        // 4. loadeddata 
        // 5. progress
        this.video.onprogress = event => {
            const buff = event.target.buffered;
            this.bufferSegs.innerHTML = "";
            for (let i = 0; i < buff.length; i++) {
                const start = buff.start(i);
                const end = buff.end(i);
                const x = start / event.target.duration;
                const w = end / event.target.duration - x;
                this.bufferSegs.innerHTML += `<li style='left: ${x * 100}%; width: ${w * 100}%;' />`;
            }
        };
        // 6. canplay
        // 7. canplaythrough 

        // Progress Bar
        this.progressBarTrack.onmousemove = event => {
            const x = event.target.offsetLeft + event.offsetX;
            const width = event.currentTarget.clientWidth;
            const newPosRatio = x / width;
            this.progressBarCursor.style.width = newPosRatio * 100 + "%";

            this.timeCode.removeAttribute('hidden');
            const timeCodeWidth = this.timeCode.clientWidth;
            let timeCodePos = x - timeCodeWidth / 2;
            if (x < timeCodeWidth / 2) {
                timeCodePos = 0;
            } else if (x > width - timeCodeWidth / 2) {
                timeCodePos = width - timeCodeWidth;
            }

            this.timeCode.style.marginLeft = timeCodePos + 'px';
            const pos = this.video.duration * newPosRatio;
            this.timeCode.innerText = bvPlayer.dur2str(pos);
        }
        this.progressBarTrack.onmouseleave = event => {
            this.progressBarCursor.style.width = "0%";
            this.timeCode.setAttribute('hidden', '');
        }
        this.progressBarTrack.onclick = event => {
            const x = event.target.offsetLeft + event.offsetX;
            const width = event.currentTarget.clientWidth;
            this.video.currentTime = this.video.duration * (x / width);
        }

        // Volume
        this.volumeSlider.onmousedown = event => {
            this.volumePressed = true;
        }
        this.volumeSlider.onmouseup = event => {
            this.volumePressed = false;
        }
        this.volumeSlider.onmouseleave = event => {
            this.volumePressed = false;
        }
        this.volumeSliderWrapper.onmousemove = event => {
            if (this.volumePressed) {
                this._setVolume(event);
            }
        }
        this.volumeSliderWrapper.onmousedown = event => {
            this._setVolume(event);
        }

        // Controls
        this.ctlPlayPause.onclick = event => {
            event.target.blur();
            if (this.video.paused) {
                this.video.play();
            } else {
                this.video.pause();
            }
        }
        this.ctlMute.onclick = event => {
            event.target.blur();
            this.video.muted = !this.video.muted;

            if (this.video.volume === 0) {
                this.video.muted = false;
                this.video.volume = 1;
            }
        }
        if (this.ctlSlower != null) {
            this.ctlSlower.onclick = event => {
                event.target.blur();
                if (!event.target.disabled) {
                    this._setPlaySpeed(this.video, this.playSpeedCur - 1);
                }
            }
        }
        if (this.ctlSpeedIndicator != null) {
            this.ctlSpeedIndicator.onclick = event => {
                event.target.blur();
                this._setPlaySpeed(this.video, this.playSpeedDef);
            }
        }
        if (this.ctlFaster != null) {
            this.ctlFaster.onclick = event => {
                event.target.blur();
                if (!event.target.disabled) {
                    this._setPlaySpeed(this.video, this.playSpeedCur + 1);
                }
            }
        }
        this.ctlPip.onclick = event => {
            event.target.blur();
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture();
            } else {
                this.video.requestPictureInPicture();
            }
        }
        this.ctlFullSrc.onclick = event => {
            if (event.target != null) event.target.blur();
            if (document.fullscreen) {
                document.exitFullscreen();
            } else {
                this.player.requestFullscreen();
            }
        }
        this.ctlQuality.onclick = event => {
            if (this.popupQuality.style.opacity == 0) {
                this.popupQuality.style.visibility = 'visible';
                this.popupQuality.style.opacity = 1;
            } else {
                this.popupQuality.style.visibility = 'collapse';
                this.popupQuality.style.opacity = 0;
            }
        }
        this.ctlHelp.onclick = event => {
            if (this.popup.hasAttribute('hidden')) {
                this.popup.removeAttribute('hidden');
            } else {
                this.popup.setAttribute('hidden', '');
            }
        }
        this.ctlPopupClose.onclick = event => {
            this.popup.setAttribute('hidden', '');
        }

        // Other
        document.onkeyup = event => {
            if (event.keyCode == KeyEvent.DOM_VK_F) {
                this.ctlFullSrc.click();
            } else if (event.keyCode == KeyEvent.DOM_VK_K) {
                if (this.video.paused) {
                    this.ctlPlayPause.click();
                    this._showPlayHint();
                } else if (this.video.playbackRate != 1) {
                    this.video.playbackRate = 1;
                    this._setPlaySpeed(this.video, this.playSpeedDef);
                } else {
                    this.ctlPlayPause.click();
                    this._showPlayHint();
                }
            } else if (event.keyCode == KeyEvent.DOM_VK_H || event.keyCode == KeyEvent.DOM_VK_LEFT) {
                this.video.currentTime = Math.max(this.video.currentTime - this.moveTimeStep, 0);
            } else if (event.keyCode == KeyEvent.DOM_VK_SEMICOLON || event.keyCode == KeyEvent.DOM_VK_RIGHT) {
                this.video.currentTime = Math.min(this.video.currentTime + this.moveTimeStep, this.video.duration);
            } else if (event.keyCode == KeyEvent.DOM_VK_I) {
                this.ctlPip.click();
            } else if (event.keyCode == KeyEvent.DOM_VK_J) {
                if (this.ctlSlower != null) {
                    this.ctlSlower.click();
                }
            } else if (event.keyCode == KeyEvent.DOM_VK_L) {
                if (this.ctlFaster != null) {
                    this.ctlFaster.click();
                }
            } else if (event.keyCode == KeyEvent.DOM_VK_M) {
                this.ctlMute.click();
                if (this.video.volume == 0) {
                    this.video.muted = false;
                    this.video.volume = 1;
                }
            } else if (event.keyCode == KeyEvent.DOM_VK_UP) {
                this.video.volume = Math.min(Math.floor(this.video.volume * 100) / 100 + this.volumeStep, 1);
                if (this.video.muted) {
                    this.video.muted = false;
                }
                this._showVolumeHint();
            } else if (event.keyCode == KeyEvent.DOM_VK_DOWN) {
                this.video.volume = Math.max(Math.floor(this.video.volume * 100) / 100 - this.volumeStep, 0);
                if (this.video.muted) {
                    this.video.muted = false;
                }
                this._showVolumeHint();
            } else if (event.keyCode >= KeyEvent.DOM_VK_0 && event.keyCode <= KeyEvent.DOM_VK_9 ||
                event.keyCode >= KeyEvent.DOM_VK_NUMPAD0 && event.keyCode <= KeyEvent.DOM_VK_NUMPAD9) {
                const base = event.keyCode < 96 ? 48 : 96;
                const m = (event.keyCode - base) / 10;
                this.video.currentTime = this.video.duration * m;
            } //else console.info("key up " + event.keyCode);
        }

        this._fillQualiteList();

        this.player.querySelectorAll('.bv-menu li').forEach((element, key, arr) => {
            element.onclick = event => {
                const newQuality = parseInt(event.currentTarget.getAttribute('quality'));
                if (newQuality == this.currentQuality) {
                    return;
                }

                // Убираем галки
                this.popupQuality.querySelectorAll('ul .bv-menu-item-icon').forEach((element, key, arr) => {
                    element.classList.add('bv-hide');
                });

                // Ставил новую галку
                event.currentTarget.querySelector('.bv-menu-item-icon').classList.remove('bv-hide');

                // Устанавливает источник
                
                const curTime = this.video.currentTime;
                this._setSource(newQuality);
                this.video.currentTime = curTime;
            }
        });
    }

    /**
     * Устанавливает качество как текущее.
     * @param {number} quality
     */
    _setSource(quality) {
        const isPaused = this.video.paused;
        this.currentQuality = quality;
        this.video.src = this.video.querySelector(`quality[height='${quality}']`).getAttribute('src');
        if (!isPaused) {
            this.video.play();
        }
    }

    /**
     * Заполняет список качества видео, и установаливает самое низкое по умолчанию.
     */
    _fillQualiteList() {
        let qualities = [];
        this.video.querySelectorAll('quality').forEach((element, key, arr) => {
            const quality = parseInt(element.getAttribute('height'));
            qualities.push(quality);
        })

        qualities.sort((a, b) => {
            if (a === b) {
                return 0;
            } else {
                return a <= b ? -1 : +1;
            }
        });

        const max_quality = qualities[qualities.length - 1];
        this._setSource(max_quality);

        const list = this.popupQuality.querySelector('ul');
        list.innerHTML = "";

        for (let i = 0; i < qualities.length; i++) {

            const hide = qualities[i] === this.currentQuality ? '' : 'bv-hide';

            const newItem = `<li quality="${qualities[i]}">
                               <div class="bv-menu-item-icon ${hide}">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172 172">
                                   <path d="M145.43294,37.93294l-80.93294,80.93295l-30.76628,-30.76628l-10.13411,10.13411l40.90039,40.90039l91.06706,-91.06705z"></path>
                                 </svg>
                               </div>
                               <div class="bv-menu-item-body">${ qualities[i]}p</div>
                             </li>`;

            list.insertAdjacentHTML('afterbegin', newItem);
        }
    }

    /**
     * Показывает на время элемент '.bv-hint'.
     */
    _showHint() {
        this.hint.style.opacity = 1;
        
        if (this.hintTimerId > 0) {
            clearTimeout(this.hintTimerId);
            this.hintTimerId == 0;
        }
        
        this.hintTimerId = setTimeout(() => {
            this.hint.style.opacity = 0;
        }, 500);
    }
        
    /**
     * Показывает на время величину громкости.
     */ 
    _showVolumeHint() {
        this.hint.innerHTML = `<span>${Math.round(this.video.volume * 100)}%</span>`;
        this._showHint();
    }
} 

function outClear() {
    getOut().innerHTML = "";
}

function out(param, value) {
    getOut().innerHTML += `<tr><td>${param}</td><td>${value}</td></tr>`;
}

function getOut() {
    return bv_player.querySelector(".bv-debug-out table");
}

// Resources
const svg_play = "<svg viewBox='0 0 36 36'><path d='M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z'/></svg>";
const svg_pause = "<svg viewBox='0 0 36 36'><path d='M 12,26 16,26 16,10 12,10 z M 21,26 25,26 25,10 21,10 z'/></svg>";
const svg_sound_max = "<svg viewBox='0 0 36 36'><path d='M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 ZM19,11.29 C21.89,12.15 24,14.83 24,18 C24,21.17 21.89,23.85 19,24.71 L19,26.77 C23.01,25.86 26,22.28 26,18 C26,13.72 23.01,10.14 19,9.23 L19,11.29 Z'/></svg>";
const svg_sound_middle = "<svg viewBox='0 0 36 36'><path d='M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 Z'></path></svg >";
const svg_sound_mute = "<svg viewBox='0 0 36 36'><path d='m 21.48,17.98 c 0,-1.77 -1.02,-3.29 -2.5,-4.03 v 2.21 l 2.45,2.45 c .03,-0.2 .05,-0.41 .05,-0.63 z m 2.5,0 c 0,.94 -0.2,1.82 -0.54,2.64 l 1.51,1.51 c .66,-1.24 1.03,-2.65 1.03,-4.15 0,-4.28 -2.99,-7.86 -7,-8.76 v 2.05 c 2.89,.86 5,3.54 5,6.71 z M 9.25,8.98 l -1.27,1.26 4.72,4.73 H 7.98 v 6 H 11.98 l 5,5 v -6.73 l 4.25,4.25 c -0.67,.52 -1.42,.93 -2.25,1.18 v 2.06 c 1.38,-0.31 2.63,-0.95 3.69,-1.81 l 2.04,2.05 1.27,-1.27 -9,-9 -7.72,-7.72 z m 7.72,.99 -2.09,2.08 2.09,2.09 V 9.98 z'/></svg>";
const svg_pip_enter = "<svg viewBox='0 0 36 36'><path d='M25,17 L17,17 L17,23 L25,23 L25,17 L25,17 z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 z'/></svg>";
const svg_pip_leave = "<svg viewBox='0 0 36 36'><path d='M11,13 V23 H25 V13 z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 z'/></svg>";
const svg_fullscr_enter = "<svg viewBox='0 0 36 36'><path d='m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z'/><path d='m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z' /><path d='m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z'/><path d='M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z'/></svg>";
const svg_fullscr_leave = "<svg viewBox='0 0 36 36'><path d='m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z'/><path d='m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z'/><path d='m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z'/><path d='m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z'/></svg>";


// Keys
if (typeof KeyEvent == "undefined") {
    var KeyEvent = {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SHIFT: 16,
        DOM_VK_CONTROL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_SPACE: 32,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_PRINTSCREEN: 44,
        DOM_VK_INSERT: 45,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48,
        DOM_VK_1: 49,
        DOM_VK_2: 50,
        DOM_VK_3: 51,
        DOM_VK_4: 52,
        DOM_VK_5: 53,
        DOM_VK_6: 54,
        DOM_VK_7: 55,
        DOM_VK_8: 56,
        DOM_VK_9: 57,
        DOM_VK_EQUALS: 61,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_CONTEXT_MENU: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SEPARATOR: 108,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_F13: 124,
        DOM_VK_F14: 125,
        DOM_VK_F15: 126,
        DOM_VK_F16: 127,
        DOM_VK_F17: 128,
        DOM_VK_F18: 129,
        DOM_VK_F19: 130,
        DOM_VK_F20: 131,
        DOM_VK_F21: 132,
        DOM_VK_F22: 133,
        DOM_VK_F23: 134,
        DOM_VK_F24: 135,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_SEMICOLON: 186,
        DOM_VK_COMMA: 188,
        DOM_VK_PERIOD: 190,
        DOM_VK_SLASH: 191,
        DOM_VK_BACK_QUOTE: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRACKET: 221,
        DOM_VK_QUOTE: 222,
        DOM_VK_META: 224
    };
}
