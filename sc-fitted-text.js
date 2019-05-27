/* eslint-disable indent */
import {PolymerElement, html} from './node_modules/@polymer/polymer/polymer-element.js';
import {beforeNextRender} from './node_modules/@polymer/polymer/lib/utils/render-status.js';
import {Debouncer} from './node_modules/@polymer/polymer/lib/utils/debounce.js';
import {timeOut} from './node_modules/@polymer/polymer/lib/utils/async.js';

/**
 * @customElement
 * @polymer
 */
export class ScFittedText extends PolymerElement {
	static get template() {
		return html`
                <style>
                    :host {
                    display: flex;
                    white-space: nowrap;
                    }

                #fittedContent {
                    visibility: hidden; /* hide until fonts load */
                }
                </style>

                <div id="fittedContent"></div>
            `;
	}

	static get properties() {
		return {
			text: {
				type: String,
				observer: '_textChanged'
			},
			maxWidth: {
				type: Number,
				value: 0,
				observer: '_maxWidthChanged'
			},
			align: {
				type: String,
				value: 'left',
				observer: '_alignChanged'
			}
		};
	}

	/**
     * Re-fit the text to maxWidth.
     * It should rarely be necessary to manually call this, as it will be automatically
     * called whenever the `text` or `maxWidth` properties change.
     */
	fit() {
		this._fitDebouncer = Debouncer.debounce(
			this._fitDebouncer,
			timeOut.after(0),
			this._fit.bind(this)
		);
	}

	/**
     * The public `fit` method is actually a debouncer.
     * This private method is what does the fitting.
     * @private
     */
	_fit() {
		beforeNextRender(this, () => {
			this.$.fittedContent.style.transform = 'scaleX(1)';

			const maxWidth = parseInt(this.maxWidth, 10);
			if (isNaN(maxWidth) || maxWidth <= 0) {
				return;
			}

			const scrollWidth = this.$.fittedContent.scrollWidth;
			if (scrollWidth > maxWidth) {
				this.$.fittedContent.style.transform = `scaleX(${maxWidth / scrollWidth})`;
			} else {
				this.$.fittedContent.style.transform = 'scaleX(1)';
			}
		});
	}

	/**
     * When the `text` property changes.
     * @param {String} newVal
     * @private
     */
	_textChanged(newVal) {
		this.$.fittedContent.textContent = newVal;

		if (document.readyState !== 'complete') {
			window.addEventListener('load', () => {
				this._textChanged(this.text);
			});
			return;
		}

		const font = window.getComputedStyle(this.$.fittedContent).font;
		if (!font) {
			this.$.fittedContent.style.visibility = 'visible';
			this.fit();
			return;
		}

		document.fonts.load(font).then(() => {
			this.$.fittedContent.style.visibility = 'visible';
			this.fit();
		}).catch(e => {
			console.error('Failed to load fonts:', e);
		});
	}

    /**
     * When the `maxWidth` property changes.
     * @param {String} newVal
     * @private
     */
	_maxWidthChanged(newVal) {
		this.style.maxWidth = newVal <= 0 ? '' : `${newVal}px`;
		this.fit();
	}

    /**
     * When the `align` property changes.
     * @param {String} newVal
     * @private
     */
	_alignChanged(newVal) {
		switch (newVal) {
			case 'center':
				this.style.justifyContent = 'center';
				this.$.fittedContent.style.transformOrigin = 'center';
				this.$.fittedContent.style.textAlign = 'center';
				break;
			case 'left':
				this.style.justifyContent = '';
				this.$.fittedContent.style.transformOrigin = 'left';
				this.$.fittedContent.style.textAlign = 'left';
				break;
			case 'right':
				this.style.justifyContent = 'flex-end';
				this.$.fittedContent.style.transformOrigin = 'right';
				this.$.fittedContent.style.textAlign = 'right';
				break;
			default:
				throw new Error(`Unexpected align value: ${newVal}`);
		}
	}
}
customElements.define('sc-fitted-text', ScFittedText);
