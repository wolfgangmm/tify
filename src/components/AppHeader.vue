<template>
	<header class="tify-header">
		<div class="tify-header-column -title">
			<h1 class="tify-header-title" :title="title">
				{{ title }}
			</h1>
		</div>

		<div v-if="$root.manifest" class="tify-header-column -pagination">
			<div class="tify-header-button-group -page-select">
				<page-select/>

				<button
					class="tify-header-button"
					:class="{ '-active': $root.options.pages.length > 1 }"
					:title="$root.translate('Toggle double-page')"
					@click="toggleDoublePage"
				>
					<icon-view-module v-if="customPageViewActive"/>
					<icon-book-open-blank-variant v-else/>
				</button>
			</div>

			<div class="tify-header-button-group -pagination">
				<button
					class="tify-header-button"
					:disabled="customPageViewActive || isFirstPage"
					:title="$root.translate('First page')"
					@click="goToFirstPage"
				>
					<icon-page-first/>
				</button>

				<button
					v-if="structures && structures.length"
					class="tify-header-button"
					:disabled="customPageViewActive || isFirstPage"
					:title="$root.translate('Previous section')"
					@click="goToPreviousSection"
				>
					<icon-skip-previous/>
				</button>

				<button
					class="tify-header-button"
					:disabled="customPageViewActive || isFirstPage"
					:title="$root.translate('Previous page')"
					@click="goToPreviousPage"
				>
					<icon-chevron-left/>
				</button>

				<button
					class="tify-header-button"
					:disabled="customPageViewActive || isLastPage"
					:title="$root.translate('Next page')"
					@click="goToNextPage"
				>
					<icon-chevron-right/>
				</button>

				<button
					v-if="structures && structures.length"
					class="tify-header-button"
					:disabled="customPageViewActive || isLastSection"
					:title="$root.translate('Next section')"
					@click="goToNextSection"
				>
					<icon-skip-next/>
				</button>

				<button
					class="tify-header-button"
					:disabled="customPageViewActive || isLastPage"
					:title="$root.translate('Last page')"
					@click="goToLastPage"
				>
					<icon-page-last/>
				</button>
			</div>
		</div>

		<div class="tify-header-column -toggle">
			<div class="tify-header-button-group -toggle" ref="switchViewSmall">
				<button
					v-click-outside="closeControlsPopup"
					:aria-controls="$root.getId('controls')"
					:aria-expanded="controlsVisible ? 'true' : 'false'"
					:aria-label="$root.translate('View')"
					class="tify-header-button"
					:title="$root.translate('View')"
					@click="toggleControlsPopup"
				>
					<icon-dots-grid/>
				</button>
			</div>
		</div>

		<div
			class="tify-header-column -controls"
			:class="{ '-visible': controlsVisible }"
			:id="$root.getId('controls')"
		>
			<div class="tify-header-button-group -view">
				<!-- NOTE: This button is hidden on large containers -->
				<button
					v-if="$root.manifest"
					class="tify-header-button -scan"
					:class="{ '-active': $root.options.view === 'scan' }"
					:aria-controls="$root.getId('scan')"
					:aria-expanded="$root.options.view === 'scan' ? 'true' : 'false'"
					@click="toggleView('scan')"
				>
					<icon-image/>
					{{ $root.translate('Scan') }}
				</button>

				<button
					v-if="fulltextEnabled"
					class="tify-header-button"
					:class="{ '-active': $root.options.view === 'fulltext' }"
					:aria-controls="$root.getId('fulltext')"
					:aria-expanded="$root.options.view === 'fulltext' ? 'true' : 'false'"
					@click="toggleView('fulltext')"
				>
					<icon-text-long/>
					{{ $root.translate('Fulltext') }}
				</button>

				<button
					v-if="$root.manifest"
					class="tify-header-button"
					:class="{ '-active': $root.options.view === 'thumbnails' }"
					:aria-controls="$root.getId('thumbnails')"
					:aria-expanded="$root.options.view === 'thumbnails' ? 'true' : 'false'"
					@click="toggleView('thumbnails')"
				>
					<icon-view-module/>
					{{ $root.translate('Pages') }}
				</button>

				<button
					v-if="tocEnabled"
					class="tify-header-button"
					:class="{ '-active': $root.options.view === 'toc' }"
					:aria-controls="$root.getId('toc')"
					:aria-expanded="$root.options.view === 'toc' ? 'true' : 'false'"
					@click="toggleView('toc')"
				>
					<icon-table-of-contents/>
					{{ $root.translate('Contents') }}
				</button>

				<button
					class="tify-header-button"
					:class="{ '-active': $root.options.view === 'info' }"
					:aria-controls="$root.getId('info')"
					:aria-expanded="$root.options.view === 'info' ? 'true' : 'false'"
					@click="toggleView('info')"
				>
					<icon-information-variant/>
					{{ $root.translate('Info') }}
				</button>

				<button
					v-if="$root.manifest"
					class="tify-header-button"
					:class="{ '-active': $root.options.view === 'export' }"
					:aria-controls="$root.getId('export')"
					:aria-expanded="$root.options.view === 'export' ? 'true' : 'false'"
					@click="toggleView('export')"
				>
					<icon-download-outline/>
					{{ $root.translate('Export') }}
				</button>

				<button
					v-if="$root.collection"
					class="tify-header-button"
					:class="{ '-active': $root.options.view === 'collection' }"
					:aria-controls="$root.getId('collection')"
					:aria-expanded="$root.options === 'collection' ? 'true' : 'false'"
					@click="toggleView('collection')"
				>
					<icon-list-box-outline/>
					{{ $root.translate('Collection') }}
				</button>
			</div>

			<div v-if="fullscreenSupported" class="tify-header-button-group -view">
				<button
					class="tify-header-button -icon-only"
					:class="{ '-active': $root.options.view === 'help' }"
					:aria-controls="$root.getId('help')"
					:aria-expanded="$root.options.view === 'help' ? 'true' : 'false'"
					:title="$root.translate('Help')"
					@click="toggleView('help')"
				>
					<icon-help-circle-outline/>
					{{ $root.translate('Help') }}
				</button>
				<button
					v-if="!fullscreenActive"
					class="tify-header-button -icon-only"
					:title="$root.translate('Fullscreen')"
					@click="toggleFullscreen"
				>
					<icon-fullscreen/>
					{{ $root.translate('Fullscreen') }}
				</button>
				<button
					v-else
					class="tify-header-button -icon-only"
					:title="$root.translate('Exit fullscreen')"
					@click="toggleFullscreen"
				>
					<icon-fullscreen-exit/>
					{{ $root.translate('Exit fullscreen') }}
				</button>
			</div>

			<div v-if="$root.manifest" class="tify-header-button-group -popup">
				<button
					class="tify-header-button"
					:disabled="customPageViewActive || isFirstPage"
					:title="$root.translate('First page')"
					@click="goToFirstPage"
				>
					<icon-page-first/>
				</button>

				<button
					v-if="structures && structures.length"
					class="tify-header-button"
					:disabled="customPageViewActive || isFirstPage"
					:title="$root.translate('Previous section')"
					@click="goToPreviousSection"
				>
					<icon-skip-previous/>
				</button>

				<button
					class="tify-header-button"
					:disabled="customPageViewActive || isFirstPage"
					:title="$root.translate('Previous page')"
					@click="goToPreviousPage"
				>
					<icon-chevron-left/>
				</button>

				<button
					class="tify-header-button"
					:disabled="customPageViewActive || isLastPage"
					:title="$root.translate('Next page')"
					@click="goToNextPage"
				>
					<icon-chevron-right/>
				</button>

				<button
					v-if="structures && structures.length"
					class="tify-header-button"
					:disabled="customPageViewActive || isLastSection"
					:title="$root.translate('Next section')"
					@click="goToNextSection"
				>
					<icon-skip-next/>
				</button>

				<button
					class="tify-header-button"
					:disabled="customPageViewActive || isLastPage"
					:title="$root.translate('Last page')"
					@click="goToLastPage"
				>
					<icon-page-last/>
				</button>
			</div>
		</div>
	</header>
</template>

<script>
import PageSelect from './PageSelect';

import keyboard from '../mixins/keyboard';
import pagination from '../mixins/pagination';

export default {
	components: {
		PageSelect,
	},
	mixins: [
		keyboard,
		pagination,
	],
	props: [
		'fulltextEnabled',
		'tocEnabled',
	],
	data() {
		return {
			controlsVisible: false,
			fullscreenActive: false,
			screen: this.$root.$el.parentNode,
		};
	},
	computed: {
		fullscreenSupported() {
			return document.fullscreenElement === null
					|| document.msFullscreenElement === null
					|| document.webkitFullscreenElement === null;
		},
		isLastSection() {
			const { pages } = this.$root.options;
			const lastIndex = pages.length - 1;
			const page = pages[lastIndex] ? pages[lastIndex] : pages[lastIndex - 1];
			return page >= this.sections[this.sections.length - 1].firstPage;
		},
		sections() {
			const sections = [];

			if (!this.structures) {
				return sections;
			}

			this.structures.forEach((structure) => {
				if (!structure.canvases) {
					sections.push({ firstPage: 1, lastPage: this.$root.pageCount });
					return;
				}

				const firstCanvasId = structure.canvases[0];
				const firstPage = this.$root.canvases.findIndex((canvas) => canvas['@id'] === firstCanvasId) + 1;
				const lastCanvasId = structure.canvases[structure.canvases.length - 1];
				const lastPage = this.$root.canvases.findIndex((canvas) => canvas['@id'] === lastCanvasId) + 1;
				sections.push({ firstPage, lastPage });
			});

			return sections;
		},
		structures() {
			return this.$root.manifest ? this.$root.manifest.structures : [];
		},
		title() {
			return this.$root.convertValueToArray((this.$root.manifest || this.$root.collection || {}).label)
				.join(`${String.fromCharCode(160)}· `) // 160 = &nbsp;
				.trim()
				// Ensure the last word does not stand alone in its line if it and
				// the 2nd-to-last word both have at most 10 characters
				.replace(/(\S{1,10})\s+(\S{1,10})$/, `$1${String.fromCharCode(160)}$2`);
		},
	},
	methods: {
		closeControlsPopup() {
			this.controlsVisible = false;
		},
		detectFullscreen: () => {
			let fullscreenAPI;

			// fullscreenAPI is set to the browser's implementation of the fullscreen API
			// (if supported). If the fullscreen API isn't supported, fullscreenAPI is set to false.
			switch (null) {
			case document.msFullscreenElement:
				fullscreenAPI = document.msFullscreenElement;
				break;
			case document.webkitFullscreenElement:
				fullscreenAPI = document.webkitFullscreenElement;
				break;
			case document.fullscreenElement:
				fullscreenAPI = document.fullscreenElement;
				break;
			default:
				fullscreenAPI = false;
			}

			return fullscreenAPI;
		},
		goToNextSection() {
			const { pages } = this.$root.options;
			const lastIndex = pages.length - 1;
			const page = pages[lastIndex] ? pages[lastIndex] : pages[lastIndex - 1];
			let sectionIndex = 0;
			while (
				page >= this.sections[sectionIndex].firstPage || (page && page >= this.sections[sectionIndex].firstPage)
			) {
				sectionIndex += 1;
			}
			this.$root.setPage(this.sections[sectionIndex].firstPage);
		},
		goToPreviousSection() {
			const { pages } = this.$root.options;
			const page = pages[0] ? pages[0] : pages[1];
			let sectionIndex = this.sections.length - 1;
			while (
				page <= this.sections[sectionIndex].firstPage || (page && page <= this.sections[sectionIndex].firstPage)
			) {
				sectionIndex -= 1;
			}
			this.$root.setPage(this.sections[sectionIndex].firstPage);
		},
		onKeyDown(event) {
			if (this.preventKeyboardEvent(event)) {
				return;
			}

			if (event.key === 'Escape') {
				this.controlsVisible = false;
				return;
			}

			switch (event.key) {
			case 'Backspace':
				// switchViewSmall is visible, i.e. screen is small
				if (this.$refs.switchViewSmall.offsetParent) {
					this.toggleView('scan');
				}
				break;
			case '1':
				if (this.$root.manifest && this.fulltextEnabled) {
					this.toggleView('fulltext');
				}
				break;
			case '2':
				if (this.$root.manifest) {
					this.toggleView('thumbnails');
				}
				break;
			case '3':
				if (this.$root.manifest && this.tocEnabled) {
					this.toggleView('toc');
				}
				break;
			case '4':
				this.toggleView('info');
				break;
			case '5':
				if (this.$root.manifest) {
					this.toggleView('export');
				}
				break;
			case '6':
				if (this.$root.collection) {
					this.toggleView('collection');
				}
				break;
			case '7':
				this.toggleView('help');
				break;
			case 'b':
				if (this.$root.manifest) {
					this.toggleDoublePage();
				}
				break;
			case 'f':
				this.toggleFullscreen();
				break;
			default:
			}

			if (!this.$root.manifest || this.customPageViewActive) {
				return;
			}

			const { pages } = this.$root.options;

			switch (event.key) {
			case 'q':
			case ',':
				if (pages[0] > 1) {
					this.goToPreviousPage();
				}
				break;
			case 'e':
			case '.':
				if (!this.isLastPage) {
					this.goToNextPage();
				}
				break;
			case 'Q':
				if (pages[0] > 1) {
					this.goToFirstPage();
				}
				break;
			case 'E':
				if (!this.isLastPage) {
					this.goToLastPage();
				}
				break;
			default:
			}
		},
		setView(name) {
			this.$root.updateOptions({ view: name });
		},
		toggleControlsPopup() {
			this.controlsVisible = !this.controlsVisible;
		},
		toggleDoublePage(forced) {
			const { pages } = this.$root.options;
			let newPages;
			if ((pages.length > 1 && forced !== true) || forced === false) {
				// There are already multiple pages shown; switch back to single page
				newPages = [pages[0] < 1 ? 1 : pages[0]];
			} else if (pages[0] < 2) {
				// Show only page 1 in double-page mode
				newPages = [0, 1];
			} else if (pages[0] % 2 > 0) {
				// An odd page was selected, add the preceding page
				newPages = [pages[0] - 1, pages[0]];
			} else {
				// An even page was selected, add the following page or 0 if it is the last one
				const followingPage = (pages[0] < this.$root.pageCount ? pages[0] + 1 : 0);
				newPages = [pages[0], followingPage];
			}

			this.$root.updateOptions({ pages: newPages });
			return newPages;
		},
		toggleFullscreen(forced) {
			if ((this.fullscreenActive && forced !== true) || forced === false) {
				if (document.exitFullscreen) {
					document.exitFullscreen();
				} else if (document.mozCancelFullScreen) { // Firefox
					document.mozCancelFullScreen();
				} else if (document.webkitExitFullscreen) { // Chrome, Safari and Opera
					document.webkitExitFullscreen();
				} else if (document.msExitFullscreen) { // IE/Edge
					document.msExitFullscreen();
				}

				return false;
			}

			if (this.screen.requestFullscreen) {
				this.screen.requestFullscreen();
			} else if (this.screen.mozRequestFullScreen) { // Firefox
				this.screen.mozRequestFullScreen();
			} else if (this.screen.webkitRequestFullscreen) { // Chrome, Safari and Opera
				this.screen.webkitRequestFullscreen();
			} else if (this.screen.msRequestFullscreen) { // IE/Edge
				this.screen.msRequestFullscreen();
			}

			return true;
		},
		toggleFullscreenActive() {
			this.fullscreenActive = !this.fullscreenActive;
		},
		toggleView(name) {
			const view = name === this.$root.options.view && this.$root.manifest && !this.$root.isMobile()
				? ''
				: name;
			this.$root.updateOptions({ view });
			return view;
		},
	},
	created() {
		this.$root.expose(this.setView);
		this.$root.expose(this.toggleDoublePage);
		this.$root.expose(this.toggleFullscreen);
	},
	mounted() {
		this.$root.$el.addEventListener('keydown', this.onKeyDown);

		// NOTE: Fullscreen state cannot be computed
		const vendorPrefixes = ['', 'moz', 'ms', 'webkit'];
		vendorPrefixes.forEach((prefix) => {
			document.addEventListener(`${prefix}fullscreenchange`, this.toggleFullscreenActive);
		});
	},
	beforeDestroy() {
		this.$root.$el.removeEventListener('keydown', this.onKeyDown);
	},
};
</script>
