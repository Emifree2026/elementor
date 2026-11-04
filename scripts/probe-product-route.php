<?php
/**
 * Exercise the product route end to end, without HTTP.
 *
 *   php -c tools/php-guard.ini scripts/probe-product-route.php [doc_id]
 *
 * Simulates a request for /en/products/mechanical/:
 *   1. the virtual route's query vars are set
 *   2. the theme's wp_enqueue_scripts hook fires
 *   3. the document id is resolved for the route
 *   4. the atomic stylesheet is enqueued
 *   5. emifree_render_product_body() renders the document
 *
 * The document id is forced through the
 * `emifree_product_elementor_document_id` filter so the mechanism can
 * be exercised before the product pages carry Elementor content.
 * Pass 0 to test the PHP fallback instead.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$forced_doc = isset( $argv[1] ) ? (int) $argv[1] : 72;

// Second argument: simulate the BARE url (/products/mechanical/),
// where the page row IS the Elementor document and the theme falls
// back to the_content() instead of get_builder_content_for_display().
// The value is the post id to make the current post.
$as_current = isset( $argv[2] ) ? (int) $argv[2] : 0;
if ( $as_current ) {
	$current = get_post( $as_current );
	if ( $current ) {
		$GLOBALS['post'] = $current;
		$GLOBALS['wp_query']->post = $current;
		setup_postdata( $current );
	}
}

$notices = array();
set_error_handler(
	static function ( $errno, $errstr, $errfile, $errline ) use ( &$notices ) {
		$notices[] = sprintf( '%s in %s:%d', $errstr, basename( $errfile ), $errline );
		return true;
	}
);

// The route.
$GLOBALS['wp_query']->set( 'emifree_product', 'post' );
$GLOBALS['wp_query']->set( 'emifree_product_slug', 'mechanical' );
$GLOBALS['wp_query']->set( 'emifree_product_lang', 'en' );

if ( $forced_doc ) {
	add_filter(
		'emifree_product_elementor_document_id',
		static function ( $doc_id ) use ( $forced_doc ) {
			return $forced_doc;
		},
		99
	);
}

printf( "route slug/lang  : %s / %s\n", get_query_var( 'emifree_product_slug' ), get_query_var( 'emifree_product_lang' ) );
printf( "is_singular()    : %s\n", is_singular() ? 'yes' : 'no' );
printf( "get_the_ID()     : %s\n", get_the_ID() ? get_the_ID() : '(none)' );

$resolved = emifree_product_elementor_document_id( 'mechanical', 'en' );
printf( "resolved doc id  : %d\n", $resolved );

// The theme's enqueue hook runs inside wp_enqueue_scripts.
do_action( 'wp_enqueue_scripts' );

$queued = wp_styles()->queue;
printf( "queued styles    : %d\n", count( $queued ) );
$atomic = array();
foreach ( $queued as $handle ) {
	if ( false !== strpos( $handle, 'local-' ) || false !== strpos( $handle, 'elementor-post-' ) || 'elementor-frontend' === $handle ) {
		$atomic[] = $handle;
	}
}
foreach ( $atomic as $handle ) {
	printf( "  %s\n", $handle );
}

// Does the enqueued handle point at a file that exists?
$uploads = wp_get_upload_dir();
foreach ( $atomic as $handle ) {
	$src = wp_styles()->registered[ $handle ]->src ?? '';
	if ( ! $src ) {
		continue;
	}
	$path = $uploads['basedir'] . str_replace( $uploads['baseurl'], '', $src );
	printf( "  %-32s %s\n", $handle, file_exists( $path ) ? 'file ok' : 'MISSING ' . $path );
}

// Render the body.
ob_start();
emifree_render_product_body( 'mechanical', 'en' );
$body = ob_get_clean();

printf( "\nbody bytes       : %d\n", strlen( $body ) );
printf( "has elementor-%d : %s\n", $resolved, $resolved && false !== strpos( $body, 'elementor-' . $resolved ) ? 'yes' : 'NO' );
printf( "has e-con markup : %s\n", false !== strpos( $body, 'e-con' ) ? 'yes' : 'NO' );
printf( "has PHP partial  : %s\n", false !== strpos( $body, 'emifree-gallery' ) || false !== strpos( $body, 'data-emifree-gallery' ) ? 'yes (fallback)' : 'no' );

printf( "php notices      : %d\n", count( $notices ) );
foreach ( array_slice( $notices, 0, 8 ) as $notice ) {
	printf( "  %s\n", $notice );
}
