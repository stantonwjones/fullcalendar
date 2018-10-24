
/* A rectangular panel that is absolutely positioned over other content
------------------------------------------------------------------------------------------------------------------------
Options:
  - className (string)
  - content (HTML string, element, or element array)
  - parentEl
  - top
  - left
  - right (the x coord of where the right edge should be. not a "CSS" right)
  - autoHide (boolean)
  - show (callback)
  - hide (callback)
*/

import { removeElement, createElement, applyStyle } from '../util/dom-manip'
import { listenBySelector } from '../util/dom-event'
import { computeClippingRect, computeRect } from '../util/dom-geom'

export interface PopoverOptions {
  className?: string
  content?: (el: HTMLElement) => void
  parentEl: HTMLElement
  autoHide?: boolean
  top?: number
  left?: number
  right?: number
  viewportConstrain?: boolean
}

export default class Popover {

  isHidden: boolean = true
  options: PopoverOptions
  el: HTMLElement // the container element for the popover. generated by this object
  margin: number = 10 // the space required between the popover and the edges of the scroll container


  constructor(options: PopoverOptions) {
    this.options = options
  }


  // Shows the popover on the specified position. Renders it if not already
  show() {
    if (this.isHidden) {
      if (!this.el) {
        this.render()
      }
      this.el.style.display = ''
      this.position()
      this.isHidden = false
      this.trigger('show')
    }
  }


  // Hides the popover, through CSS, but does not remove it from the DOM
  hide() {
    if (!this.isHidden) {
      this.el.style.display = 'none'
      this.isHidden = true
      this.trigger('hide')
    }
  }


  // Creates `this.el` and renders content inside of it
  render() {
    let options = this.options
    let el = this.el = createElement('div', {
      className: 'fc-popover ' + (options.className || ''),
      style: {
        top: '0',
        left: '0'
      }
    })

    if (typeof options.content === 'function') {
      options.content(el)
    }

    options.parentEl.appendChild(el)

    // when a click happens on anything inside with a 'fc-close' className, hide the popover
    listenBySelector(el, 'click', '.fc-close', (ev) => {
      this.hide()
    })

    if (options.autoHide) {
      document.addEventListener('mousedown', this.documentMousedown)
    }
  }


  // Triggered when the user clicks *anywhere* in the document, for the autoHide feature
  documentMousedown = (ev) => {
    // only hide the popover if the click happened outside the popover
    if (this.el && !this.el.contains(ev.target)) {
      this.hide()
    }
  }


  // Hides and unregisters any handlers
  destroy() {
    this.hide()

    if (this.el) {
      removeElement(this.el)
      this.el = null
    }

    document.removeEventListener('mousedown', this.documentMousedown)
  }


  // Positions the popover optimally, using the top/left/right options
  position() {
    let options = this.options
    let el = this.el
    let elDims = el.getBoundingClientRect() // only used for width,height
    let origin = computeRect(el.offsetParent)
    let clippingRect = computeClippingRect(options.parentEl)
    let top // the "position" (not "offset") values for the popover
    let left //

    // compute top and left
    top = options.top || 0
    if (options.left !== undefined) {
      left = options.left
    } else if (options.right !== undefined) {
      left = options.right - elDims.width // derive the left value from the right value
    } else {
      left = 0
    }

    // constrain to the view port. if constrained by two edges, give precedence to top/left
    top = Math.min(top, clippingRect.bottom - elDims.height - this.margin)
    top = Math.max(top, clippingRect.top + this.margin)
    left = Math.min(left, clippingRect.right - elDims.width - this.margin)
    left = Math.max(left, clippingRect.left + this.margin)

    applyStyle(el, {
      top: top - origin.top,
      left: left - origin.left
    })
  }


  // Triggers a callback. Calls a function in the option hash of the same name.
  // Arguments beyond the first `name` are forwarded on.
  // TODO: better code reuse for this. Repeat code
  // can kill this???
  trigger(name) {
    if (this.options[name]) {
      this.options[name].apply(this, Array.prototype.slice.call(arguments, 1))
    }
  }

}
