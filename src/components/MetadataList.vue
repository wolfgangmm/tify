<template>
	<div class="tify-info-metadata">
		<div v-for="(item, index) in metadata" :key="index">
			<h4>
				<div v-bind:key="index" v-for="(label, index) in $root.convertValueToArray(item.label)">
					{{ cleanLabel(label) }}
				</div>
			</h4>
			<div
				class="tify-info-content"
				:class="{ '-collapsed': infoItems[index] && infoItems[index].collapsed }"
				ref="contents"
			>
				<div class="tify-info-value">
					<template v-for="value in $root.convertValueToArray(item.value)" >
						<div v-if="isValidUrl(value)" :key="'url-' + value">
							<a :href="value">{{ value }}</a>
						</div>
						<div v-else v-html="value" :key="'html-' + value"/>
					</template>
				</div>

				<button
					v-if="infoItems[index] && infoItems[index].exceedsHeight"
					class="tify-info-toggle"
					@click="infoItems[index].collapsed = !infoItems[index].collapsed"
				>
					<template v-if="infoItems[index].collapsed">
						<icon-chevron-down/>
						{{ $root.translate('Expand') }}
					</template>
					<template v-else>
						<icon-chevron-up/>
						{{ $root.translate('Collapse') }}
					</template>
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import isValidUrl from '../functions/isValidUrl';

export default {
	props: [
		'metadata',
	],
	data() {
		return {
			infoItems: [],
		};
	},
	watch: {
		metadata() {
			this.updateInfoItems();
		},
	},
	mounted() {
		this.updateInfoItems();
	},
	methods: {
		cleanLabel(label) {
			const cleanedLabel = label.replace('_', ' ');
			return cleanedLabel.charAt(0).toUpperCase() + cleanedLabel.substr(1);
		},
		isValidUrl,
		updateInfoItems() {
			this.$nextTick(() => {
				if (!this.$refs.contents) {
					return;
				}

				this.$refs.contents.forEach((content, index) => {
					const fullHeight = content.offsetHeight;

					this.$set(this.infoItems, index, {
						collapsed: true,
						exceedsHeight: true,
					});

					this.$nextTick(() => {
						const collapsedHeight = content.offsetHeight;
						const shouldBeCollapsed = fullHeight >= collapsedHeight;

						this.$set(this.infoItems, index, {
							collapsed: shouldBeCollapsed,
							exceedsHeight: shouldBeCollapsed,
						});
					});
				});
			});
		},
	},
};
</script>
