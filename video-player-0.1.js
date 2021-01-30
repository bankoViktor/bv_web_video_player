/*
 * Скин видео проигрователя
 * 
 * Версия:   0.1
 * Автор:    Банько В.С. (bankviktor14@gmail.com)
 * Дата:     26.01.2021
 *
*/


let playSpeedDef = 3;
let playSpeedCur = playSpeedDef;
let playSpeeds = [ 0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0, 8.0, 16.0 ];

let vp_player;
let vp_video;
let vp_ctl_play_pause;
let vp_ctl_sound;
let vp_ctl_slower;
let vp_ctl_speed_indicator;
let vp_ctl_faster;
let vp_ctl_pip;
let vp_ctl_fullsrc;


window.onload = function () {
  vp_player = document.querySelector("#video-player");
  vp_video = document.querySelector("#video-player video");
  vp_ctl_play_pause = document.querySelector("#vp-ctl-play-pause");
  vp_ctl_sound = document.querySelector("#vp-ctl-sound");
  vp_ctl_slower = document.querySelector("#vp-ctl-slower");
  vp_ctl_speed_indicator = document.querySelector("#vp-ctl-speed-indicator");
  vp_ctl_faster = document.querySelector("#vp-ctl-faster");
  vp_ctl_pip = document.querySelector("#vp-ctl-pip");
  vp_ctl_fullsrc = document.querySelector("#vp-ctl-fullsrc");

  // Player Container
  vp_player.onfullscreenchange = function(event) {
    if (document.fullscreen) {
      changeButtonState(vp_ctl_fullsrc, "Выход из полноэкранного режима (f)", svg_fullscr_leave);
    } else {
      changeButtonState(vp_ctl_fullsrc, "Во весь экран (f)", svg_fullscr_enter);
    }
  }

  // Player
  vp_video.onplay = function() { 
    changeButtonState(vp_ctl_play_pause, "Пауза (K)", svg_pause); 
  }
  vp_video.onpause = function() { 
    changeButtonState(vp_ctl_play_pause, "Смотреть (K)", svg_play); 
  }
  vp_video.onvolumechange = function() {
    if (vp_video.volume == 0) {
      changeButtonState(vp_ctl_sound, "Отключение звука (m)", svg_sound_mute);
    } else if (vp_video.volume < 0.5) {
      changeButtonState(vp_ctl_sound, "Отключение звука (m)", svg_sound_middle);
    } else {
      changeButtonState(vp_ctl_sound, "Отключение звука (m)", svg_sound_max);
    }
  }
  vp_video.onratechange = function() {
    vp_ctl_slower.disabled = playSpeedCur <= 0;
    vp_ctl_faster.disabled = playSpeedCur >= playSpeeds.length - 1;
    vp_ctl_speed_indicator.disabled = playSpeedCur == playSpeedDef;
    vp_ctl_speed_indicator.title = playSpeedCur == playSpeedDef 
      ? "Текущая скорость воспроизведения"
      : "К нормальной скорости воспроизведения (s)";
    var speed_content = vp_ctl_speed_indicator.querySelector("#vp-ctl-speed-indicator-content");
    speed_content.innerText = "x" + vp_video.playbackRate;
    //console.info("--- cur speed x" + playSpeeds[playSpeedCur] + " (" + vp_video.playbackRate + ")");
  }
  vp_video.onenterpictureinpicture = function() { 
    changeButtonState(vp_ctl_pip, "Закрыть мини проигрователь (I)", svg_pip_leave); 
  }
  vp_video.onleavepictureinpicture = function() {
    changeButtonState(vp_ctl_pip, "Открыть мини проигрователь (I)", svg_pip_enter);
  }

  // Player Controls
  vp_ctl_play_pause.onclick = function (event) {
    vp_ctl_play_pause.blur();
    if (vp_video.paused) {
      vp_video.play();
    } else {
      vp_video.pause();
    }
  }
  vp_ctl_sound.onclick = function (event) { 
    vp_ctl_sound.blur();
    vp_video.volume = vp_video.volume > 0 ? 0 : 1;
  }
  vp_ctl_slower.onclick = function (event) {
    vp_ctl_slower.blur();
    if (!vp_ctl_slower.disabled) {
      setPlaySpeed(playSpeedCur - 1);
    }
  }
  vp_ctl_speed_indicator.onclick = function (event) {
    vp_ctl_speed_indicator.blur();
    setPlaySpeed(playSpeedDef);
  }
  vp_ctl_faster.onclick = function (event) {
    vp_ctl_faster.blur();
    if (!vp_ctl_faster.disabled) {
      setPlaySpeed(playSpeedCur + 1);
    }
  } 
  vp_ctl_pip.onclick = function (event) {
    vp_ctl_pip.blur();
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else {
      vp_video.requestPictureInPicture();
    }
  }
  vp_ctl_fullsrc.onclick = function (event) {
    vp_ctl_fullsrc.blur();
    if (document.fullscreen) {
      document.exitFullscreen();
    } else {
      vp_player.requestFullscreen();
    }
  }

  // Hotkeys
  document.onkeyup = function(event) {
    if (event.keyCode == 70) vp_ctl_fullsrc.onclick(); 
    else if (event.keyCode == 72) {
      // back step (5 sec)
      console.error("NotImplemented - hot key Step Back ");
    } else if (event.keyCode == 73) vp_ctl_pip.onclick(); 
    else if (event.keyCode == 74) vp_ctl_slower.onclick(); 
    else if (event.keyCode == 75) { 
      if (vp_video.paused) {
        vp_ctl_play_pause.onclick();
      } else if (vp_video.playbackRate != 1) {
        vp_video.playbackRate = 1;
        setPlaySpeed(playSpeedDef);
      } else {
        vp_ctl_play_pause.onclick();
      }
    } else if (event.keyCode == 76) vp_ctl_faster.onclick();
    else if (event.keyCode == 77) vp_ctl_sound.onclick();
    else if (event.keyCode == 186) {
      // forward step (5 sec)
      console.error("NotImplemented - hot key Forward Back ");
    } //else console.info("key up " + event.keyCode);
  }

  // Init
  vp_ctl_speed_indicator.disabled = true;
  init_time_codes();
}

function init_time_codes() {
  var elements = document.getElementsByTagName("timecode");
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i]; 
    element.title = "Перейти на " + element.innerText + " в проигрователе";
    element.onclick = function(event) {
      var dur = str2dur(event.currentTarget.innerText);
      if (dur <= vp_video.duration) {
        vp_video.currentTime = dur;
        vp_video.play();
      } else {
        event.currentTarget.style.color = "red";
        alert("Тайм-код за пределами длительности видео.");    
      }
    }
  }
}

function str2dur(str) {
  var parts = str.split(":", 3).reverse();
  var result = 0;
  var m = [ 1, 60, 3600 ];
  for (var i = 0; i < parts.length; i++) {
    result += parseInt(parts[i]) * m[i];
  }
  return result;
}

function dur2str(duration) {
  var m = Math.trunc(duration / 60);
  var h = Math.trunc(m / 60);
  var s = Math.trunc(duration - (h * 60 + m) * 60);
  var result = m + ":" + (s < 10 ? "0" + s : s);
  if (m >= 60) {
    result = h + ":" + result;
  }
  return result;
}

function changeButtonState(element, title, innerHTML) {
  element.innerHTML = innerHTML;
  element.title = title;
}

function setPlaySpeed(index) {
  playSpeedCur = index;
  vp_video.playbackRate = playSpeeds[index];
  //console.info("cur speed " + vp_video.playbackRate);
}

// Resources
let svg_play = "<svg viewBox='0 0 36 36'><path d='M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z'/></svg>";
let svg_pause = "<svg viewBox='0 0 36 36'><path d='M 12,26 16,26 16,10 12,10 z M 21,26 25,26 25,10 21,10 z'/></svg>";
let svg_sound_max = "<svg viewBox='0 0 36 36'><path d='M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 ZM19,11.29 C21.89,12.15 24,14.83 24,18 C24,21.17 21.89,23.85 19,24.71 L19,26.77 C23.01,25.86 26,22.28 26,18 C26,13.72 23.01,10.14 19,9.23 L19,11.29 Z'/></svg>";
let svg_sound_middle = "<svg viewBox='0 0 36 36'><path d='m 14.35,-0.14 -5.86,5.86 20.73,20.78 5.86,-5.91 z'/><path d='M 7.07,6.87 -1.11,15.33 19.61,36.11 27.80,27.60 z'/><path d='M 9.09,5.20 6.47,7.88 26.82,28.77 29.66,25.99 z'/><path d='m -11.45,-15.55 -4.44,4.51 20.45,20.94 4.55,-4.66 z'/><path d='M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 Z'/><path d='M 9.25,9 7.98,10.27 24.71,27 l 1.27,-1.27 Z'/></svg>";
let svg_sound_mute = "<svg viewBox='0 0 36 36'><path d='m 21.48,17.98 c 0,-1.77 -1.02,-3.29 -2.5,-4.03 v 2.21 l 2.45,2.45 c .03,-0.2 .05,-0.41 .05,-0.63 z m 2.5,0 c 0,.94 -0.2,1.82 -0.54,2.64 l 1.51,1.51 c .66,-1.24 1.03,-2.65 1.03,-4.15 0,-4.28 -2.99,-7.86 -7,-8.76 v 2.05 c 2.89,.86 5,3.54 5,6.71 z M 9.25,8.98 l -1.27,1.26 4.72,4.73 H 7.98 v 6 H 11.98 l 5,5 v -6.73 l 4.25,4.25 c -0.67,.52 -1.42,.93 -2.25,1.18 v 2.06 c 1.38,-0.31 2.63,-0.95 3.69,-1.81 l 2.04,2.05 1.27,-1.27 -9,-9 -7.72,-7.72 z m 7.72,.99 -2.09,2.08 2.09,2.09 V 9.98 z'/></svg>";
let svg_pip_enter = "<svg viewBox='0 0 36 36'><path d='M25,17 L17,17 L17,23 L25,23 L25,17 L25,17 z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 z'/></svg>";
let svg_pip_leave = "<svg viewBox='0 0 36 36'><path d='M11,13 V23 H25 V13 z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 z'/></svg>";
let svg_fullscr_enter = "<svg viewBox='0 0 36 36'><path d='m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z'/><path d='m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z' /><path d='m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z'/><path d='M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z'/></svg>";
let svg_fullscr_leave = "<svg viewBox='0 0 36 36'><path d='m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z'/><path d='m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z'/><path d='m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z'/><path d='m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z'/></svg>";


/*
  
TODO

- горизонтальная полоса под плеером
- кнопка "С начала" или "Повторить" при завершении видео
- прогресс бар плеера
- таймер и длительность
- метки
- сегменты
- исправить границу индикатора скорости при активации
- граница фокуса при активации и покидании контрола
- запуск/стоп воспроизведения при клике по плееру 
- размер кнопок плеера
- пропадающие контролы
- горячая клавиша f
*/