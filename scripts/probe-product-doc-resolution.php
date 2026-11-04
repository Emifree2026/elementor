<?php
/**
 * Verify that every product route resolves to its OWN Elementor document.
 *
 *   php probe-product-doc-resolution.php
 *
 * The trap this guards against: a product family has two pages with
 * different slugs ('mechanical' / 'mechanische-filtration'). Looking
 * the slug up without the language hands the German URL the English
 * document. This prints, per route and per template call, the page id
 * that emifree_product_elementor_document_id() resolves to and asserts
 * that it is the page whose post_name matches that language.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_cases = array(
	// family slug, language, route slug, expected page post_name.
	array( 'mechanical', 'en', 'mechanical', 'mechanical' ),
	array( 'mechanical', 'de', 'mechanische-filtration', 'mechanische-filtration' ),
	array( 'electrostatic', 'en', 'electrostatic', 'electrostatic' ),
	array( 'electrostatic', 'de', 'elektrostatische-filtration', 'elektrostatische-filtration' ),
	array( 'dust', 'en', 'dust', 'dust' ),
	array( 'dust', 'de', 'entstaubung', 'entstaubung' ),
);

$emifree_fail = 0;

foreach ( $emifree_cases as $emifree_case ) {
	list( $emifree_family, $emifree_lang, $emifree_route, $emifree_expected ) = $emifree_case;

	// 1. The family slug — what the shim templates pass.
	$emifree_by_family = emifree_product_elementor_document_id( $emifree_family, $emifree_lang );

	// 2. The route slug — what emifree_current_product_route() reports.
	$emifree_by_route = emifree_product_elementor_document_id( $emifree_route, $emifree_lang );

	$emifree_expected_id = emifree_find_page_id_by_slug( $emifree_expected );
	$emifree_ok_family  = ( $emifree_by_family === $emifree_expected_id );
	$emifree_ok_route   = ( $emifree_by_route === $emifree_expected_id );

	if ( ! $emifree_ok_family || ! $emifree_ok_route ) {
		$emifree_fail++;
	}

	printf(
		"%-14s %-3s  family-slug -> %-5d %-4s   route-slug -> %-5d %-4s   expected post %-26s (id %d)\n",
		$emifree_family,
		$emifree_lang,
		$emifree_by_family,
		$emifree_ok_family ? 'OK' : 'BAD',
		$emifree_by_route,
		$emifree_ok_route ? 'OK' : 'BAD',
		$emifree_expected,
		$emifree_expected_id
	);

	// The document must actually carry content.
	if ( $emifree_by_family ) {
		$emifree_data = get_post_meta( $emifree_by_family, '_elementor_data', true );
		$emifree_len   = is_string( $emifree_data ) ? strlen( $emifree_data ) : 0;
		printf( "                 elementor_data: %d bytes\n", $emifree_len );
	} else {
		printf( "                 elementor_data: (no document — PHP fallback)\n" );
	}
}

printf( "\n%s\n", $emifree_fail ? "FAIL: $emifree_fail case(s) resolved to the wrong document." : 'OK: every route resolves to its own document.' );
exit( $emifree_fail ? 1 : 0 );
