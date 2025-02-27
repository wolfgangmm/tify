<template>
	<section class="tify-scan">
		<h2 class="tify-sr-only">{{ $root.translate('Scan') }}</h2>

		<button
			v-if="!customPageViewActive && !isFirstPage"
			class="tify-scan-page-button -previous"
			:title="$root.translate('Previous page')"
			@click="goToPreviousPage"
		>
			<icon-chevron-left/>
		</button>
		<button
			v-if="!customPageViewActive && !isLastPage"
			class="tify-scan-page-button -next"
			:title="$root.translate('Next page')"
			@click="goToNextPage"
		>
			<icon-chevron-right/>
		</button>

		<div class="tify-scan-buttons" v-if="viewer">
			<button
				class="tify-scan-button"
				:disabled="isMaxZoom"
				:title="$root.translate('Zoom in')"
				@click="zoomIn"
			>
				<icon-magnify-plus/>
			</button>
			<button
				class="tify-scan-button"
				:disabled="isReset"
				:title="$root.translate('Reset')"
				@click="resetScan(!!$event.shiftKey)"
			>
				<icon-aspect-ratio/>
			</button>
			<button
				class="tify-scan-button"
				:disabled="isMinZoom"
				:title="$root.translate('Zoom out')"
				@click="zoomOut"
			>
				<icon-magnify-minus/>
			</button>

			<button
				class="tify-scan-button"
				:class="{ '-active': $root.options.rotation }"
				:title="$root.translate('Rotate')"
				@click="rotateRight($event)"
			>
				<icon-rotate-right/>
			</button>

			<div
				v-click-outside="closeFilters"
				class="tify-scan-filters"
				:class="{ '-open': filtersVisible }"
			>
				<button
					class="tify-scan-button"
					:class="{ '-active': filtersActive }"
					:title="$root.translate('Toggle image filters')"
					:aria-controls="$root.getId('filters')"
					:aria-expanded="filtersVisible ? 'true' : 'false'"
					@click="filtersVisible = !filtersVisible"
				>
					<icon-tune/>
				</button>
				<div class="tify-scan-filters-popup" :id="$root.getId('filters')" v-show="filtersVisible">
					<h3 class="tify-sr-only">{{ $root.translate('Image filters') }}</h3>
					<p>
						<label>
							<icon-white-balance-sunny/>
							{{ $root.translate('Brightness') }}
							<b>{{ Math.round(($root.options.filters.brightness || 1) * 100) }}&nbsp;%</b>
							<input
								class="tify-scan-range"
								max="2"
								min=".5"
								ref="firstSlider"
								step=".01"
								type="range"
								:value="$root.options.filters.brightness || 1"
								@input="setFilter('brightness', $event)"
							/>
						</label>
					</p>
					<p>
						<label>
							<icon-brightness-6/>
							{{ $root.translate('Contrast') }}
							<b>{{ Math.round(($root.options.filters.contrast || 1) * 100) }}&nbsp;%</b>
							<input
								class="tify-scan-range"
								max="2"
								min=".5"
								step=".01"
								type="range"
								:value="$root.options.filters.contrast || 1"
								@input="setFilter('contrast', $event)"
							/>
						</label>
					</p>
					<p>
						<label>
							<icon-palette/>
							{{ $root.translate('Saturation') }}
							<b>{{ Math.round(saturation * 100)}}&nbsp;%</b>
							<input
								class="tify-scan-range"
								max="3"
								min="0"
								step=".01"
								type="range"
								:value="saturation"
								@input="setFilter('saturate', $event)"
							/>
						</label>
					</p>
					<p>
						<button
							class="tify-scan-reset"
							:disabled="!filtersActive"
							@click="resetFilters"
						>
							<icon-backup-restore/>
							{{ $root.translate('Reset') }}
						</button>
					</p>
				</div>
			</div>
		</div>

		<div class="tify-scan-image" ref="image"/>
	</section>
</template>

<script>
import OpenSeadragon from 'openseadragon';

import keyboard from '../mixins/keyboard';
import pagination from '../mixins/pagination';

const gapBetweenPages = .01;

export default {
	mixins: [
		keyboard,
		pagination,
	],
	data() {
		return {
			filtersVisible: false,
			loadingTimeout: null,
			tileSources: {},
			viewer: null,
			zoomFactor: 1.5,
		};
	},
	computed: {
		filtersActive() {
			return (Object.keys(this.$root.options.filters).length > 0);
		},
		isMinZoom() {
			if (!this.viewer) {
				return true;
			}

			return this.viewer.viewport.getZoom() <= this.viewer.viewport.getMinZoom();
		},
		isMaxZoom() {
			if (!this.viewer) {
				return true;
			}

			return this.viewer.viewport.getZoom() >= this.viewer.viewport.getMaxZoom();
		},
		isReset() {
			// There may be some tiny deviation from the target values
			const homeBounds = this.viewer.viewport.getHomeBounds();
			const currentBounds = this.viewer.viewport.getBounds();
			return (
				Math.abs(homeBounds.height - currentBounds.height) < 1e-9
					&& Math.abs(homeBounds.width - currentBounds.width) < 1e-9
					&& Math.abs(homeBounds.x - currentBounds.x) < 1e-9
					&& Math.abs(homeBounds.y - currentBounds.y) < 1e-9
			);
		},
		saturation() {
			const saturation = this.$parent.$parent.options.filters.saturate;
			return typeof saturation === 'number' ? saturation : 1;
		},
	},
	watch: {
		// eslint-disable-next-line func-names
		'$root.options.pages': function (newValue, oldValue) {
			const reset = newValue.length !== oldValue.length;
			this.loadImageInfo(reset);
		},
	},
	methods: {
		closeFilters() {
			this.filtersVisible = false;
		},
		initViewer(reset) {
			const { options } = this.$root;

			// TODO: All tile sources could be added at once (sequence mode), but
			// this required the correct resolution to be present in the manifest,
			// which is currently loaded from the info file since the former is
			// unreliable.
			const tileSources = [];
			let initialWidth = 0;
			let tileSourceIndex;
			let totalWidth = 0;

			options.pages.forEach((page, index) => {
				let opacity = 1;
				if (page < 1) {
					opacity = 0;
					tileSourceIndex = (index > 0 ? this.$root.pageCount : 1);
				} else {
					tileSourceIndex = page;
				}

				const tileSource = this.tileSources[tileSourceIndex];

				if (!tileSource) {
					return;
				}

				if (!initialWidth) {
					initialWidth = tileSource.width;
				}

				const width = tileSource.width / initialWidth;

				tileSources.push({
					opacity,
					tileSource,
					width,
					x: totalWidth,
				});

				totalWidth += width + gapBetweenPages;
			});

			if (this.viewer) {
				this.viewer.addOnceHandler('open', () => {
					if (this.isReset || reset) {
						this.resetScan();
					} else {
						this.viewer.viewport.applyConstraints(true);

						if (!this.$root.options.optionsResetOnPageChange) {
							return;
						}

						// TODO: Add an e2e test for this
						this.$root.options.optionsResetOnPageChange.forEach((option) => {
							if (option === 'filters') {
								this.resetFilters();
							} else if (option === 'pan') {
								// Move upper left corner into viewport if required
								const bounds = this.viewer.viewport.getBounds();
								if (bounds.x <= 0 && bounds.y <= 0) {
									return;
								}

								const offsetX = (options.pages[0] ? 0 : 1);
								this.viewer.viewport.panTo({
									x: (bounds.x > 0 ? (bounds.width / 2) + offsetX : options.pan.x),
									y: (bounds.y > 0 ? (bounds.height / 2) : options.pan.y),
								});

								this.$root.updateOptions({ pan: {} });
							} else if (option === 'rotation') {
								this.viewer.viewport.setRotation(0);
								this.$root.updateOptions({ rotation: null });
							} else if (option === 'zoom') {
								this.viewer.viewport.goHome();
								this.$root.updateOptions({ zoom: null });
							}
						});
					}
				});

				this.viewer.open(tileSources);
				return;
			}

			// https://openseadragon.github.io/examples/tilesource-iiif/
			this.viewer = OpenSeadragon({
				animationTime: .4,
				element: this.$refs.image,
				immediateRender: true,
				preload: !this.$root.isMobile(),
				preserveImageSizeOnResize: true,
				preserveViewport: true,
				showNavigationControl: false,
				showZoomControl: false,
				tileSources,
				visibilityRatio: .2,
				...this.$root.options.viewer,
			});

			// Disable OpenSeadragons built-in key handler which interferes with TIFY's keyboard shortcuts
			this.viewer.innerTracker.keyHandler = null;

			this.viewer.gestureSettingsMouse.clickToZoom = false;

			this.viewer.addHandler('animation-finish', () => {
				if (this.isReset) {
					this.removeScanOptions();
					return;
				}

				const center = this.viewer.viewport.getCenter();
				this.$root.updateOptions({
					// 3 decimals are sufficient, keeping URL short
					pan: {
						x: Math.round(center.x * 1e3) / 1e3,
						y: Math.round(center.y * 1e3) / 1e3,
					},
					zoom: Math.round(this.viewer.viewport.getZoom() * 1e3) / 1e3,
				});
			});

			// Required for touchscreens: The canvas swallows the touch event, so click-outside is not triggered
			this.viewer.addHandler('canvas-click', () => {
				document.body.click();
			});

			this.viewer.addHandler('open', () => {
				this.startLoadingWatch();

				if (options.pan.x !== undefined || options.pan.y !== undefined || options.zoom) {
					if (options.pan.x !== undefined || options.pan.y !== undefined) {
						this.viewer.viewport.panTo({
							x: options.pan.x,
							y: options.pan.y,
						}, true);
					}

					if (options.zoom) {
						this.viewer.viewport.zoomTo(options.zoom, null, true);
					}
				} else {
					this.viewer.viewport.goHome();
				}

				if (options.rotation !== null) {
					this.viewer.viewport.setRotation(options.rotation);
				}
			});

			this.viewer.addHandler('tile-load-failed', (error) => {
				this.$root.error = `Error loading image: ${error.message}`;
			});

			this.$root.expose(this.resetScan);
			this.$root.expose(this.viewer, 'viewer');
		},
		loadImageInfo(reset = false) {
			this.stopLoadingWatch();

			const infoPromises = [];
			this.$root.options.pages.forEach((page) => {
				if (page < 1 || this.tileSources[page]) {
					return;
				}

				const { resource } = this.$root.canvases[page - 1].images[0];
				if (resource.service) {
					const id = resource.service['@id'];
					const infoUrl = `${id}${id.slice(-1) === '/' ? '' : '/'}info.json`;
					infoPromises.push(this.$http.get(infoUrl).then((response) => ({ ...response, page }), (error) => {
						let status;
						if (error.response && error.response.statusText) {
							status = error.response.statusText;
						} else if (error.message) {
							status = error.message;
						}

						this.$root.error = `Error loading info file for page ${page}${status ? `: ${status}` : ''}`;
					}));
				} else {
					this.tileSources[page] = {
						type: 'image',
						url: resource['@id'],
						width: resource.width,
						height: resource.height,
					};
				}
			});

			if (infoPromises.length) {
				Promise.all(infoPromises).then((responses) => {
					responses.forEach((response) => {
						if (response) {
							this.tileSources[response.page] = response.data;
						}
					});
					this.initViewer(reset);
				});
			} else {
				this.initViewer(reset);
			}
		},
		onKeydown(event) {
			if (event.key === 'Escape') {
				this.filtersVisible = false;
			}

			// Reset pan, zoom, rotation and filters
			const zeroKeyCodes = [
				45, // Insert (Shift+Numpad0)
				48, // 0
				96, // Numpad0
			];

			if (zeroKeyCodes.indexOf(event.keyCode) > -1) {
				if (event.shiftKey) {
					this.resetScan(event);
				} else {
					this.viewer.viewport.goHome();
				}
			}
		},
		onKeypress(event) {
			if (this.preventKeyboardEvent(event)) {
				return;
			}

			switch (event.key) {
			case 'r':
			case 'R':
				// NOTE: Same physical key for QUERTY and QUERTZ keyboards
				this.rotateRight(event);
				break;
			case 'i':
				this.filtersVisible = !this.filtersVisible;
				if (this.filtersVisible) {
					this.$nextTick(() => {
						this.$refs.firstSlider.focus();
					});
				}
				break;
			case 'I':
				this.resetFilters();
				break;

			// Restore some keyboard events for OpenSeadragon
			// https://github.com/openseadragon/openseadragon/blob/master/src/viewer.js#L2680-L2725
			case '+':
			case '=':
			case 'W':
				this.viewer.viewport.zoomBy(1.1);
				this.viewer.viewport.applyConstraints();
				break;
			case '-':
			case '_':
			case 'S':
				this.viewer.viewport.zoomBy(.9);
				this.viewer.viewport.applyConstraints();
				break;
			case 'w':
				this.viewer.innerTracker.keyDownHandler({ keyCode: 38 }); // up arrow
				break;
			case 's':
				this.viewer.innerTracker.keyDownHandler({ keyCode: 40 }); // down arrow
				break;
			case 'a':
				this.viewer.innerTracker.keyDownHandler({ keyCode: 37 }); // down arrow
				break;
			case 'd':
				this.viewer.innerTracker.keyDownHandler({ keyCode: 39 }); // right arrow
				break;
			default:
			}
		},
		removeScanOptions() {
			this.$root.updateOptions({
				pan: {},
				zoom: null,
			});
		},
		resetFilters() {
			this.$refs.image.style.cssText = '';
			this.$root.updateOptions({ filters: {} });
		},
		resetScan(includingFiltersAndRotation) {
			if (includingFiltersAndRotation) {
				// Rotation has to be reset before pan and zoom
				this.viewer.viewport.setRotation(0);
				this.$root.updateOptions({ rotation: null });
				if (this.filtersActive) {
					this.resetFilters();
				}
			}

			this.viewer.viewport.goHome();
			this.removeScanOptions();
		},
		rotateRight(event) {
			const { viewport } = this.viewer;
			const degrees = (event && event.shiftKey) ? 0 : (viewport.getRotation() + 90) % 360;
			viewport.setRotation(degrees);
			this.$root.updateOptions({ rotation: degrees || null });
		},
		setFilter(name, event) {
			const value = event.target.valueAsNumber;
			if (value === 1) {
				this.$delete(this.$root.options.filters, name);
			} else {
				this.$set(this.$root.options.filters, name, value);
			}
			this.$root.updateOptions({ filters: this.$root.options.filters });
			this.updateFilterStyle();
		},
		startLoadingWatch() {
			let loading = 0;
			for (let i = this.viewer.world.getItemCount() - 1; i >= 0; i -= 1) {
				const image = this.viewer.world.getItemAt(i);
				// eslint-disable-next-line no-underscore-dangle
				if (image && image._tilesLoading) {
					loading = 1;
				}
			}
			this.$root.loading = loading;

			// TODO: A timeout instead of a proper event handler? Abomination!
			// That's because neither getFullyLoaded() nor the fully-loaded-change
			// event are working for images that are not currently within canvas
			// bounds. OpenSeadragon would need add a global fully-loaded event,
			// not just one for each TiledImage.
			this.loadingTimeout = setTimeout(this.startLoadingWatch, 200);
		},
		stopLoadingWatch() {
			clearTimeout(this.loadingTimeout);
		},
		updateFilterStyle() {
			if (!this.filtersActive) {
				return;
			}

			const filters = [];
			Object.keys(this.$root.options.filters).forEach((key) => {
				filters.push(`${key}(${this.$root.options.filters[key]})`);
			});

			const { image } = this.$refs;
			const filterString = filters.join(' ');

			image.style.cssText = `filter: ${filterString}`;
		},
		zoomIn() {
			this.viewer.viewport.zoomBy(this.zoomFactor);
		},
		zoomOut() {
			this.viewer.viewport.zoomBy(1 / this.zoomFactor);
		},
	},
	mounted() {
		this.loadImageInfo();
		this.updateFilterStyle();

		this.$root.$el.addEventListener('keydown', this.onKeydown);
		this.$root.$el.addEventListener('keypress', this.onKeypress);
	},
	beforeDestroy() {
		if (this.viewer) {
			this.viewer.destroy();
		}

		this.$root.$el.removeEventListener('keydown', this.onKeydown);
		this.$root.$el.removeEventListener('keypress', this.onKeypress);
	},
};
</script>
