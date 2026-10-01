// The SVG icons used by tool scripts (lucide-static, ISC license), bundled as strings.
import upload from 'lucide-static/icons/upload.svg';
import download from 'lucide-static/icons/download.svg';
import fileVideo from 'lucide-static/icons/file-video.svg';
import fileAudio from 'lucide-static/icons/file-audio.svg';
import fileText from 'lucide-static/icons/file-text.svg';
import image from 'lucide-static/icons/image.svg';
import images from 'lucide-static/icons/images.svg';
import circleCheck from 'lucide-static/icons/circle-check.svg';
import circleAlert from 'lucide-static/icons/circle-alert.svg';
import x from 'lucide-static/icons/x.svg';
import rotateCw from 'lucide-static/icons/rotate-cw.svg';
import rotateCcw from 'lucide-static/icons/rotate-ccw.svg';
import trash from 'lucide-static/icons/trash-2.svg';
import grip from 'lucide-static/icons/grip-vertical.svg';
import play from 'lucide-static/icons/play.svg';
import pause from 'lucide-static/icons/pause.svg';
import scissors from 'lucide-static/icons/scissors.svg';
import refresh from 'lucide-static/icons/refresh-ccw.svg';
import plus from 'lucide-static/icons/plus.svg';
import copy from 'lucide-static/icons/copy.svg';
import arrowUp from 'lucide-static/icons/arrow-up.svg';
import arrowDown from 'lucide-static/icons/arrow-down.svg';
import arrowLeft from 'lucide-static/icons/arrow-left.svg';
import arrowRight from 'lucide-static/icons/arrow-right.svg';
import merge from 'lucide-static/icons/merge.svg';
import split from 'lucide-static/icons/split.svg';
import camera from 'lucide-static/icons/camera.svg';
import crop from 'lucide-static/icons/crop.svg';
import sparkles from 'lucide-static/icons/sparkles.svg';
import fileImage from 'lucide-static/icons/file-image.svg';
import music from 'lucide-static/icons/music.svg';
import repeat from 'lucide-static/icons/repeat.svg';
import eye from 'lucide-static/icons/eye.svg';
import zap from 'lucide-static/icons/zap.svg';
// A richer set for complex tools (resume builder…). Loaded lazily on demand.
const EXTRA_NAMES = ['undo-2', 'redo-2', 'bold', 'italic', 'underline', 'strikethrough', 'list', 'link-2', 'palette', 'move-vertical', 'check', 'eye-off', 'type', 'clipboard-list', 'briefcase', 'graduation-cap', 'folder-kanban', 'user-round', 'heart-handshake', 'trophy', 'languages', 'award', 'badge-check', 'message-square-quote', 'star', 'settings-2', 'minimize-2', 'circle-help', 'delete', 'pencil', 'image-plus', 'layout-template', 'wand-sparkles', 'file-plus-2', 'columns-2', 'rows-3', 'chevron-down', 'history', 'circle-plus', 'square-pen'];
let extraIcons = null;

const ICONS = { upload, download, fileVideo, fileAudio, fileText, image, images, circleCheck, circleAlert, x, rotateCw, rotateCcw, trash, grip, play, pause, scissors, refresh, plus, copy, arrowUp, arrowDown, arrowLeft, arrowRight, merge, split, camera, crop, sparkles, fileImage, music, repeat, eye, zap };

const toSvg = (raw, cls) => {
  const tpl = document.createElement('template');
  tpl.innerHTML = raw.replace(/<!--.*?-->/s, '').trim();
  const svg = tpl.content.firstElementChild;
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  return svg;
};

/** Returns a decorative <svg> element. */
export function icon(name, cls = 'ic') {
  return toSvg(ICONS[name], cls);
}

/** Every bundled lucide-static icon, as { name: svgString } (named "lucide" chunks). */
export async function allIcons() {
  if (extraIcons) return { ...ICONS, ...extraIcons };
  const mods = await Promise.all(EXTRA_NAMES.map((n) => import(`lucide-static/icons/${n}.svg`)));
  extraIcons = Object.fromEntries(EXTRA_NAMES.map((n, i) => [n, mods[i].default]));
  return { ...ICONS, ...extraIcons };
}

/** Synchronously renders an extended icon; only call after allIcons() has resolved. */
export function iconSync(name, cls = 'ic') {
  const raw = ICONS[name] || extraIcons?.[name];
  return raw ? toSvg(raw, cls) : toSvg(ICONS.circleAlert, cls);
}
