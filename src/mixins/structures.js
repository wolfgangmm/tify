const structures = {
	computed: {
		currentStructure() {
			if (!this.$root.manifest || !Array.isArray(this.$root.manifest.structures)) {
				return false;
			}

			const currentCanvasIds = [];
			this.$root.options.pages.forEach((page) => {
				if (page) {
					currentCanvasIds.push(this.$root.canvases[page - 1]['@id']);
				}
			});

			const { length } = this.$root.manifest.structures;
			let indexOfStructureWithSmallestRange;
			let smallestRange;
			for (let i = 0; i < length; i += 1) {
				const structure = this.$root.manifest.structures[i];
				const { canvases } = structure;
				if (canvases && canvases.some((canvasId) => currentCanvasIds.indexOf(canvasId) > -1)) {
					if (structure.firstPage && structure.lastPage) {
						const currentRange = structure.lastPage - structure.firstPage;
						if ((currentRange < smallestRange) || !smallestRange) {
							indexOfStructureWithSmallestRange = i;
							smallestRange = currentRange;
							if (smallestRange === 0) {
								break;
							}
						}
					}
				}
			}
			if (typeof indexOfStructureWithSmallestRange === 'number' && indexOfStructureWithSmallestRange >= 0) {
				return this.$root.manifest.structures[indexOfStructureWithSmallestRange];
			}

			return false;
		},
		currentStructureLabel() {
			const { label } = this.currentStructure;
			return label;
		},
		currentStructureMetadata() {
			const { metadata } = this.currentStructure;
			return metadata;
		},
		structures() {
			if (!this.$root.manifest.structures) {
				return [];
			}

			const mappedStructures = [];
			const structuresThatAreChildren = [];
			const { length } = this.$root.manifest.structures;
			for (let i = 0; i < length; i += 1) {
				const structure = this.$root.manifest.structures[i];

				// https://iiif.io/api/presentation/2.1/#viewinghint
				if (structure.viewingHint === 'top') {
					continue;
				}

				if (structure.label) {
					structure.label = this.$root.convertValueToArray(structure.label)[0].trim();
				} else {
					structure.label = '—'; // NOTE: That's an em dash (&mdash;)
				}

				if (structure.canvases) {
					const firstCanvas = structure.canvases[0];
					structure.firstPage = this.$root.canvases.findIndex((canvas) => canvas['@id'] === firstCanvas) + 1;

					const lastCanvas = structure.canvases[structure.canvases.length - 1];
					structure.lastPage = this.$root.canvases.findIndex((canvas) => canvas['@id'] === lastCanvas) + 1;

					const firstPageCanvas = this.$root.canvases[structure.firstPage - 1];
					if (!firstPageCanvas) {
						// Excluding structure if its range has no canvases
						continue;
					}

					structure.pageLabel = firstPageCanvas.label;
				} else if (this.$root.canvases[0]) {
					structure.firstPage = 1;
					structure.lastPage = this.$root.pageCount;
					structure.pageLabel = this.$root.canvases[0].label;
				}

				structure.pageCount = (structure.lastPage - structure.firstPage) + 1;

				if (structure.within) {
					structuresThatAreChildren.push(structure);
				}

				mappedStructures.push(structure);
			}

			const structuresThatAreChildrenLength = structuresThatAreChildren.length;
			for (let i = 0; i < length; i += 1) {
				const childStructures = [];
				for (let j = 0; j < structuresThatAreChildrenLength; j += 1) {
					const childStructure = structuresThatAreChildren[j];
					if (childStructure.within === mappedStructures[i]['@id']) {
						childStructures.push(childStructure);
					}
				}
				if (childStructures.length) {
					mappedStructures[i].childStructures = childStructures.sort((a, b) => a.firstPage - b.firstPage);
				}
			}

			const topLevelStructures = mappedStructures
				.filter((structure) => !structure.within)
				.sort((a, b) => a.firstPage - b.firstPage);

			return topLevelStructures;
		},
	},
};

export default structures;
