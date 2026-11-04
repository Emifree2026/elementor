<?php
/**
 * Dump the rendered HTML of a product Elementor document.
 *
 *   php probe-product-dom.php 44 [needle]
 *
 * The atomic editor renders differently from what the builder assumes
 * (a link widget may wrap the image, `_cssid` may land on a wrapper
 * rather than on the widget). This prints the real DOM so the
 * JavaScript and the CSS can be written against it.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_post_id = isset( $argv[1] ) ? (int) $argv[1] : 44;
$emifree_needle  = isset( $argv[2] ) ? $argv[2] : 'emifree-thumb';

$emifree_html = \Elementor\Plugin::instance()->frontend->get_builder_content_for_display( $emifree_post_id, false );

if ( ! is_string( $emifree_html ) || '' === $emifree_html ) {
	fwrite( STDERR, "No rendered HTML for post $emifree_post_id\n" );
	exit( 1 );
}

printf( "post %d — %d bytes of rendered HTML\n\n", $emifree_post_id, strlen( $emifree_html ) );

// Every element that carries a hand-written id, with its tag.
preg_match_all( '/<(\w+)([^>]*\bid="emifree-[^"]*"[^>]*)>/', $emifree_html, $emifree_matches, PREG_SET_ORDER );
printf( "--- elements with an emifree-* id (%d)\n", count( $emifree_matches ) );
foreach ( $emifree_matches as $emifree_match ) {
	$emifree_attrs = preg_replace( '/\s+/', ' ', $emifree_match[2] );
	printf( "  <%s %s>\n", $emifree_match[1], $emifree_attrs );
}

// The slice around a needle, for inspecting one widget's markup.
if ( '' !== $emifree_needle ) {
	$emifree_pos = strpos( $emifree_html, $emifree_needle );
	if ( false === $emifree_pos ) {
		printf( "\n--- needle '%s' not found\n", $emifree_needle );
	} else {
		$emifree_start = max( 0, $emifree_pos - 400 );
		printf( "\n--- around '%s'\n%s\n", $emifree_needle, substr( $emifree_html, $emifree_start, 1400 ) );
	}
}
