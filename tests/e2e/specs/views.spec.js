describe('Views', () => {
	it('changes the view via buttons', () => {
		const encodedParams = encodeURIComponent(JSON.stringify({
			childManifestUrl: 'http://localhost:8081/manifest/wellcome-b19974760_1_0004',
		}));

		cy.visit(`/?manifest=http://localhost:8081/manifest/wellcome-b19974760&tify=${encodedParams}`);

		cy.contains('Fulltext').click();
		cy.get('.-active').contains('Fulltext');

		cy.contains('Pages').click();
		cy.get('.-active').contains('Pages');

		cy.contains('Contents').click();
		cy.get('.-active').contains('Contents');

		cy.contains('Info').click();
		cy.get('.-active').contains('Info');

		cy.contains('Export').click();
		cy.get('.-active').contains('Export');

		cy.contains('Collection').click();
		cy.get('.-active').contains('Collection');

		cy.contains('Help').click();
		cy.get('.-active').contains('Help');
	});

	it('changes the view via keyboard', () => {
		cy.visit('/?manifest=http://localhost:8081/manifest/wellcome-b18035723.json');

		cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting

		cy.get('.tify').type('1').get('.-active').contains('Fulltext');
		cy.get('.tify').type('2').get('.-active').contains('Pages');
		cy.get('.tify').type('3').get('.-active').contains('Contents');
		cy.get('.tify').type('4').get('.-active').contains('Info');
		cy.get('.tify').type('5').get('.-active').contains('Export');
		cy.get('.tify').type('7').get('.-active').contains('Help');
	});
});
