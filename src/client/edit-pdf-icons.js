// Icons for the PDF editor (lucide-static, ISC license).
import select from 'lucide-static/icons/mouse-pointer-2.svg';
import edit from 'lucide-static/icons/text-cursor-input.svg';
import text from 'lucide-static/icons/type.svg';
import hl from 'lucide-static/icons/highlighter.svg';
import ul from 'lucide-static/icons/underline.svg';
import st from 'lucide-static/icons/strikethrough.svg';
import pen from 'lucide-static/icons/pencil.svg';
import rect from 'lucide-static/icons/square.svg';
import ell from 'lucide-static/icons/circle.svg';
import line from 'lucide-static/icons/minus.svg';
import arrow from 'lucide-static/icons/move-up-right.svg';
import note from 'lucide-static/icons/sticky-note.svg';
import sign from 'lucide-static/icons/signature.svg';
import date from 'lucide-static/icons/calendar.svg';
import check from 'lucide-static/icons/check.svg';
import image from 'lucide-static/icons/image.svg';
import white from 'lucide-static/icons/eraser.svg';
import undo from 'lucide-static/icons/undo-2.svg';
import redo from 'lucide-static/icons/redo-2.svg';
import zin from 'lucide-static/icons/zoom-in.svg';
import zout from 'lucide-static/icons/zoom-out.svg';
import fit from 'lucide-static/icons/move-horizontal.svg';
import panel from 'lucide-static/icons/panel-left.svg';
import bold from 'lucide-static/icons/bold.svg';
import italic from 'lucide-static/icons/italic.svg';
import al from 'lucide-static/icons/align-left.svg';
import ac from 'lucide-static/icons/align-center.svg';
import ar from 'lucide-static/icons/align-right.svg';
import addpage from 'lucide-static/icons/file-plus.svg';
import copy from 'lucide-static/icons/copy.svg';
import trash from 'lucide-static/icons/trash-2.svg';
import rotate from 'lucide-static/icons/rotate-cw.svg';
import up from 'lucide-static/icons/arrow-up.svg';
import down from 'lucide-static/icons/arrow-down.svg';
import xi from 'lucide-static/icons/x.svg';
import save from 'lucide-static/icons/download.svg';
import plus from 'lucide-static/icons/plus.svg';

const ICONS = { select, edit, text, hl, ul, st, pen, rect, ell, line, arrow, note, sign, date, check, image, white, undo, redo, zin, zout, fit, panel, bold, italic, al, ac, ar, addpage, copy, trash, rotate, up, down, x: xi, save, plus };

/** Returns a decorative <svg> element for the named editor icon. */
export function pic(name, cls = 'ic') {
  const tpl = document.createElement('template');
  tpl.innerHTML = ICONS[name].replace(/<!--.*?-->/s, '').trim();
  const svg = tpl.content.firstElementChild;
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  return svg;
}
